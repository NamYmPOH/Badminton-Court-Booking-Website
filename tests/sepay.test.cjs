const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHmac } = require('node:crypto');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { getSepayConfig, verifySepaySignature, parseSepayEvent, extractBookingCode, eventFingerprint, createVietQrUrl, readPaymentBody, paymentErrorResponse } = require('../src/lib/sepay.ts');
const { receiveSepayPayment, serializable } = require('../src/services/sepay.service.ts');
const { bookingRequestSchema, priceBooking } = require('../src/lib/booking-request.ts');
const { createReservation, publicBooking } = require('../src/services/reservation.service.ts');
const config = getSepayConfig({ SEPAY_WEBHOOK_SECRET: 'test-only-secret-not-for-real-transfers', BANK_BIN: '970415', BANK_ACCOUNT_NO: '0001234703', BANK_ACCOUNT_NAME: 'NGUYEN VAN A', SEPAY_BANK_GATEWAY: 'VietinBank' });
const event = { id: 92704, accountNumber: config.BANK_ACCOUNT_NO, gateway: 'VietinBank', content: 'chuyen tien DATSAN1234567890', transferAmount: 150000, transferType: 'in' };
function signed(raw, seconds = Math.floor(Date.now() / 1000)) {
  const timestamp = String(seconds);
  return new Headers({ 'X-SePay-Timestamp': timestamp, 'X-SePay-Signature': 'sha256=' + createHmac('sha256', config.SEPAY_WEBHOOK_SECRET).update(timestamp + '.').update(raw).digest('hex') });
}
test('HMAC checks exact bytes, rejects tampering, expired/future timestamps and missing signature', () => {
  const raw = Buffer.from(JSON.stringify(event, null, 2));
  assert.equal(verifySepaySignature(raw, signed(raw), config.SEPAY_WEBHOOK_SECRET), true);
  assert.equal(verifySepaySignature(Buffer.from(JSON.stringify(event)), signed(raw), config.SEPAY_WEBHOOK_SECRET), false);
  assert.equal(verifySepaySignature(raw, signed(raw), 'wrong'), false);
  for (const delta of [-301, 301]) assert.equal(verifySepaySignature(raw, signed(raw, Math.floor(Date.now() / 1000) + delta), config.SEPAY_WEBHOOK_SECRET), false);
  assert.equal(verifySepaySignature(raw, new Headers(), config.SEPAY_WEBHOOK_SECRET), false);
});
test('payload validation, code boundaries, multiple codes and QR encoding', () => {
  assert.equal(parseSepayEvent(Buffer.from(JSON.stringify(event))).id, event.id);
  for (const patch of [{ id: '1' }, { transferAmount: 1.5 }, { transferAmount: 0 }, { transferType: 'unknown' }, { accountNumber: 123 }]) {
    assert.throws(() => parseSepayEvent(Buffer.from(JSON.stringify({ ...event, ...patch }))));
  }
  assert.throws(() => parseSepayEvent(Buffer.from('{')));
  assert.equal(extractBookingCode('ck datsan00123!'), 'DATSAN00123');
  for (const content of ['XDATSAN123', 'DATSAN123x', 'DATSAN12345678901', 'DATSAN123 DATSAN456']) assert.equal(extractBookingCode(content), null);
  assert.equal(extractBookingCode('DATSAN123 DATSAN123'), 'DATSAN123');
  const url = new URL(createVietQrUrl(150000, 'DATSAN1234567890', config));
  assert.equal(url.searchParams.get('amount'), '150000');
  assert.equal(url.searchParams.get('addInfo'), 'DATSAN1234567890');
  assert.equal(url.searchParams.get('accountName'), config.BANK_ACCOUNT_NAME);
  assert.match(url.pathname, /0001234703/);
  assert.throws(() => getSepayConfig({}), error => error.status === 503);
});
test('bounded raw-body reader rejects wrong content type and oversized payload', async () => {
  const request = (body, type = 'application/json') => new Request('https://example.test/api/payment/webhook', { method: 'POST', headers: { 'Content-Type': type }, body });
  assert.equal((await readPaymentBody(request('{ }'))).toString(), '{ }');
  await assert.rejects(readPaymentBody(request('x', 'text/plain')), error => error.status === 415);
  await assert.rejects(readPaymentBody(request('12345'), 4), error => error.status === 413);
});

// Transaction double: records commit/rollback and allows deterministic DB failures.
// This is not a substitute for PostgreSQL concurrency testing before deployment.
function paymentDb(patch = {}, fail = false) {
  let state = { booking: { id: 'bk', code: 'DATSAN1234567890', total: 150000, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', expiresAt: new Date(Date.now() + 600000), items: [{ status: 'HELD' }], ...patch }, receipts: [], payments: [] };
  return {
    get state() { return state; },
    async $transaction(work, options) {
      assert.equal(options.isolationLevel, 'Serializable');
      const copy = structuredClone(state);
      const tx = {
        sepayReceipt: {
          findUnique: async ({ where }) => copy.receipts.find(r => r.transactionId === where.transactionId) || null,
          create: async ({ data }) => { copy.receipts.push(data); return data; },
        },
        booking: {
          findUnique: async ({ where }) => copy.booking.code === where.code ? copy.booking : null,
          updateMany: async ({ where, data }) => {
            assert.equal(where.status, 'PENDING_PAYMENT');
            assert.deepEqual(where.paymentStatus.in, ['UNPAID', 'PENDING']);
            assert.equal(where.total, copy.booking.total);
            Object.assign(copy.booking, data); return { count: 1 };
          },
        },
        bookingItem: { updateMany: async () => { copy.booking.items.forEach(i => i.status = 'CONFIRMED'); return { count: 1 }; } },
        payment: { create: async ({ data }) => { if (fail) throw new Error('DB unavailable'); copy.payments.push(data); } },
      };
      const result = await work(tx);
      state = copy;
      return result;
    },
  };
}
test('valid payment commits booking, items, payment and receipt; retry is idempotent', async () => {
  const db = paymentDb();
  assert.deepEqual(await receiveSepayPayment(db, event, config), { result: 'PAID' });
  assert.equal(db.state.booking.paymentStatus, 'PAID');
  assert.equal(db.state.booking.items[0].status, 'CONFIRMED');
  assert.equal(db.state.payments.length, 1);
  assert.equal(db.state.receipts.length, 1);
  assert.equal((await receiveSepayPayment(db, event, config)).result, 'DUPLICATE');
  assert.equal(db.state.payments.length, 1);
  assert.equal((await receiveSepayPayment(db, { ...event, id: 92705 }, config)).result, 'REVIEW_BOOKING_NOT_PENDING');
  await assert.rejects(receiveSepayPayment(db, { ...event, transferAmount: 1 }, config), error => error.status === 409);
});
for (const [name, patch, result] of [
  ['outgoing', { transferType: 'out' }, 'IGNORED_OUTGOING'],
  ['account mismatch', { accountNumber: '1111111111' }, 'REVIEW_WRONG_ACCOUNT'],
  ['bank mismatch', { gateway: 'BIDV' }, 'REVIEW_WRONG_ACCOUNT'],
  ['missing code', { content: 'chuyen tien' }, 'REVIEW_BOOKING_CODE'],
  ['unknown booking', { content: 'DATSAN111' }, 'REVIEW_BOOKING_NOT_FOUND'],
  ['underpayment', { transferAmount: 149999 }, 'REVIEW_AMOUNT_MISMATCH'],
  ['overpayment', { transferAmount: 150001 }, 'REVIEW_AMOUNT_MISMATCH'],
]) test(`${name} is recorded for review without marking paid`, async () => {
  const db = paymentDb();
  assert.equal((await receiveSepayPayment(db, { ...event, ...patch }, config)).result, result);
  assert.equal(db.state.booking.paymentStatus, 'PENDING');
  assert.equal(db.state.payments.length, 0);
  assert.equal(db.state.receipts[0].result, result);
});
for (const [name, patch, result] of [
  ['expired', { expiresAt: new Date(0) }, 'REVIEW_EXPIRED'],
  ['no deadline', { expiresAt: null }, 'REVIEW_EXPIRED'],
  ['cancelled', { status: 'CANCELLED' }, 'REVIEW_BOOKING_NOT_PENDING'],
  ['released slots', { items: [{ status: 'EXPIRED' }] }, 'REVIEW_SLOT_RELEASED'],
  ['no slots', { items: [] }, 'REVIEW_SLOT_RELEASED'],
]) test(`${name} cannot be paid automatically`, async () => {
  const db = paymentDb(patch);
  assert.equal((await receiveSepayPayment(db, event, config)).result, result);
  assert.equal(db.state.payments.length, 0);
});
test('wrong configured VA requires review; gateway case does not change fingerprint', async () => {
  const db = paymentDb();
  assert.equal((await receiveSepayPayment(db, event, { ...config, SEPAY_SUB_ACCOUNT: 'VA1' })).result, 'REVIEW_WRONG_ACCOUNT');
  assert.equal(eventFingerprint(event), eventFingerprint({ ...event, gateway: 'vietinbank' }));
});
test('payment write failure rolls back booking and receipt, returns 500', async () => {
  const db = paymentDb({}, true);
  let failure;
  try { await receiveSepayPayment(db, event, config); } catch (error) { failure = error; }
  assert.ok(failure);
  assert.equal(paymentErrorResponse(failure).status, 500);
  assert.equal(db.state.booking.status, 'PENDING_PAYMENT');
  assert.equal(db.state.receipts.length, 0);
});
test('serialization and unique conflicts retry with a fresh transaction; other errors do not', async () => {
  for (const code of ['P2034', 'P2002']) {
    let attempts = 0;
    const db = { async $transaction(work) { if (++attempts < 3) throw { code }; return work({}); } };
    assert.equal(await serializable(db, async () => 'ok'), 'ok');
    assert.equal(attempts, 3);
  }
  let attempts = 0;
  await assert.rejects(serializable({ async $transaction() { attempts++; throw new Error('connection lost'); } }, async () => null));
  assert.equal(attempts, 1);
});
const venue = { openMin: 300, closeMin: 1320, advanceDays: 30, minBookingMin: 60, maxBookingMin: 240,
  courts: [{ id: 'c1', name: 'San 1', status: 'ACTIVE' }],
  pricing: [{ daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startMin: 300, endMin: 1320, walkInPrice: 150000 }],
};
const input = { requestId: '910f3559-9c44-4f65-9e0a-52763e88286d', venueId: 'v1', date: '2026-10-10', customerName: 'Test User', customerPhone: '0912345678', note: '',
  slots: [{ courtId: 'c1', startMin: 1080, endMin: 1110 }, { courtId: 'c1', startMin: 1110, endMin: 1140 }],
};
test('reservation validates duration and prices from DB; client amounts/vouchers rejected', () => {
  const now = new Date('2026-10-08T00:00:00Z');
  assert.equal(priceBooking(input, venue, now).total, 150000);
  assert.equal(bookingRequestSchema.safeParse({ ...input, total: 1 }).success, false);
  assert.equal(bookingRequestSchema.safeParse({ ...input, voucher: 'GIAM20K' }).success, false);
  for (const slots of [[input.slots[0]], [input.slots[0], input.slots[0]], [{ ...input.slots[0], courtId: 'unknown' }, input.slots[1]]]) assert.throws(() => priceBooking({ ...input, slots }, venue, now));
  assert.throws(() => priceBooking({ ...input, date: '2026-02-30' }, venue, now));
  assert.throws(() => priceBooking(input, venue, new Date('2026-10-11T00:00:00Z')));
});
test('idempotency cannot return another user booking; retry returns owned booking', async () => {
  const previous = { userId: 'u1', code: 'DATSAN123' };
  const db = { $transaction: async work => work({ booking: { findUnique: async () => previous } }) };
  assert.equal((await createReservation(db, 'u1', input)).code, previous.code);
  await assert.rejects(createReservation(db, 'u2', input), error => error.status === 409);
});
test('expired booking response has no QR and derives EXPIRED without claiming payment', () => {
  const booking = { id: 'bk', code: 'DATSAN123', status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', expiresAt: new Date(0), createdAt: new Date(), venue: { paymentMode: 'ONLINE_FULL' }, items: [] };
  const response = publicBooking(booking, config);
  assert.equal(response.status, 'EXPIRED');
  assert.equal(response.qrUrl, null);
  assert.equal(response.paymentStatus, 'PENDING');
});

test('createReservation rejects unavailable courts, occupied slots and excess holds', async () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(tomorrow);
  const currentInput = { ...input, date };
  const base = { ...venue, id: 'v1', status: 'ACTIVE', paymentMode: 'ONLINE_FULL' };
  for (const [overrides, expected] of [
    [{ venue: null }, 409], [{ venue: { ...base, status: 'PENDING' } }, 409],
    [{ block: {} }, 409], [{ conflict: {} }, 409], [{ count: 3 }, 429],
  ]) {
    const settings = { venue: base, block: null, conflict: null, count: 0, ...overrides };
    const db = { $transaction: async work => work({
      venue: { findUnique: async () => settings.venue },
      courtBlock: { findFirst: async () => settings.block },
      bookingItem: { findFirst: async () => settings.conflict },
      booking: { findUnique: async () => null, count: async () => settings.count, create: async () => assert.fail('must not create') },
    }) };
    await assert.rejects(createReservation(db, 'u1', currentInput), error => error.status === expected);
  }
  const db = { $transaction: async work => work({
    venue: { findUnique: async () => base }, courtBlock: { findFirst: async () => null },
    bookingItem: { findFirst: async () => null },
    booking: { findUnique: async () => null, count: async () => 0, create: async ({ data }) => data },
  }) };
  const created = await createReservation(db, 'u1', currentInput);
  assert.equal(created.total, 150000);
  assert.equal(created.paymentStatus, 'PENDING');
  assert.equal(created.status, 'PENDING_PAYMENT');
  assert.match(created.code, /^DATSAN\d{10}$/);
  assert.ok(created.expiresAt.getTime() <= Date.now() + 600000);
  assert.equal(created.items.create.length, 2);
});
