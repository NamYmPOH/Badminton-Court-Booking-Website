import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { extractBookingCode } from '../src/services/payment.service.js';
import { createVietQrUrl } from '../src/utils/qr.util.js';

const sample = JSON.parse(await readFile(new URL('../postman/sepay-webhook.sample.json', import.meta.url), 'utf8'));
const config = {
  auth: { mode: 'hmac', secret: 'local-test-secret-never-use-in-production', toleranceSeconds: 300 },
  bank: { bin: '970436', accountNo: '0123456789', accountName: 'NGUYEN VAN A', gateway: 'Vietcombank', subAccount: '' },
};

async function setup(t, overrides = {}, db) {
  const settings = { ...config, ...overrides };
  const server = createApp(settings, db).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, options) => {
    const response = await fetch(base + path, options);
    return { status: response.status, body: await response.json() };
  };
  const webhook = (patch = {}, options = {}) => {
    const body = options.body ?? JSON.stringify({ ...sample, ...patch });
    const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', options.secret || settings.auth.secret)
      .update(timestamp + '.').update(body).digest('hex');
    return request('/api/payment/webhook', {
      method: 'POST', body,
      headers: {
        'Content-Type': 'application/json',
        'X-SePay-Timestamp': timestamp, 'X-SePay-Signature': `sha256=${signature}`,
        ...(options.headers || {}),
      },
    });
  };
  const createBooking = async () => (await request('/api/bookings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId: 'COURT1-1800', totalAmount: 1 }),
  })).body;
  const getBooking = (booking) => request(`/api/bookings/${booking.code}`, {
    headers: { 'X-Booking-Token': booking.readToken },
  });
  return { request, webhook, createBooking, getBooking };
}

test('PENDING -> PAID; server owns price; polling needs token; slot held', async (t) => {
  const api = await setup(t);
  const booking = await api.createBooking();
  assert.equal(booking.status, 'PENDING');
  assert.equal(booking.totalAmount, 150000);
  assert.equal(new URL(booking.qrUrl).searchParams.get('addInfo'), 'DATSAN123');
  assert.equal((await api.request('/api/bookings/DATSAN123')).status, 404);
  assert.deepEqual(await api.webhook(), { status: 200, body: { success: true, result: 'PAID' } });
  const paid = await api.getBooking(booking);
  assert.equal(paid.body.status, 'PAID');
  assert.equal(paid.body.sepayTransactionId, 92704);
  assert.equal(paid.body.readToken, undefined);
  assert.equal((await api.createBooking()).success, false);
});

for (const [name, patch, result] of [
  ['underpayment', { transferAmount: 149999 }, 'REVIEW_AMOUNT_MISMATCH'],
  ['overpayment', { transferAmount: 150001 }, 'REVIEW_AMOUNT_MISMATCH'],
  ['outgoing', { transferType: 'out' }, 'IGNORED_OUTGOING'],
  ['wrong account', { accountNumber: '1111111111' }, 'REVIEW_WRONG_ACCOUNT'],
  ['wrong bank', { gateway: 'BIDV' }, 'REVIEW_WRONG_ACCOUNT'],
  ['missing code', { content: 'chuyen tien' }, 'REVIEW_BOOKING_CODE'],
  ['ambiguous codes', { content: 'DATSAN123 DATSAN124' }, 'REVIEW_BOOKING_CODE'],
  ['unknown booking', { content: 'DATSAN999' }, 'REVIEW_BOOKING_NOT_FOUND'],
]) {
  test(`${name}: ACK without marking paid`, async (t) => {
    const api = await setup(t);
    const booking = await api.createBooking();
    const response = await api.webhook(patch);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true, result });
    assert.equal((await api.getBooking(booking)).body.status, 'PENDING');
    assert.equal((await api.webhook(patch)).body.originalResult, result);
  });
}

test('parallel retries settle once; second payment needs review; conflicting ID rejected', async (t) => {
  const api = await setup(t);
  const booking = await api.createBooking();
  const results = await Promise.all(Array.from({ length: 12 }, () => api.webhook()));
  assert.equal(results.filter((r) => r.body.result === 'PAID').length, 1);
  assert.equal(results.filter((r) => r.body.result === 'DUPLICATE').length, 11);
  assert.equal((await api.webhook({ id: 92705 })).body.result, 'REVIEW_BOOKING_NOT_PENDING');
  assert.equal((await api.webhook({ transferAmount: 1 })).status, 409);
  assert.equal((await api.getBooking(booking)).body.sepayTransactionId, 92704);
});

test('HMAC rejects wrong secret, stale/future timestamps, bad signature, API-key downgrade', async (t) => {
  const api = await setup(t);
  await api.createBooking();
  for (const options of [
    { secret: 'wrong' },
    { timestamp: Math.floor(Date.now() / 1000) - 301 },
    { timestamp: Math.floor(Date.now() / 1000) + 301 },
    { headers: { 'X-SePay-Timestamp': 'NaN' } },
    { headers: { 'X-SePay-Signature': 'sha256=bad' } },
    { headers: { 'X-SePay-Signature': '', Authorization: `Apikey ${config.auth.secret}` } },
  ]) assert.equal((await api.webhook({}, options)).status, 401);
  assert.equal((await api.webhook()).body.result, 'PAID');
});

test('signature covers exact raw bytes, including whitespace and Vietnamese text', async (t) => {
  const api = await setup(t);
  await api.createBooking();
  const body = JSON.stringify({ ...sample, content: 'Đặt sân DATSAN123' }, null, 2);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const wrongSignature = createHmac('sha256', config.auth.secret)
    .update(timestamp + '.' + JSON.stringify(JSON.parse(body))).digest('hex');
  assert.equal((await api.webhook({}, { body, timestamp, headers: { 'X-SePay-Signature': `sha256=${wrongSignature}` } })).status, 401);
  assert.equal((await api.webhook({}, { body })).body.result, 'PAID');
});

test('API Key mode accepts Apikey; rejects Bearer and missing credentials', async (t) => {
  const api = await setup(t, { auth: { ...config.auth, mode: 'apikey' } });
  await api.createBooking();
  assert.equal((await api.webhook()).status, 401);
  assert.equal((await api.webhook({}, { headers: { Authorization: `Bearer ${config.auth.secret}` } })).status, 401);
  assert.equal((await api.webhook({}, { headers: { Authorization: `Apikey ${config.auth.secret}` } })).body.result, 'PAID');
});

test('invalid payload, invalid JSON, unsupported content type and oversized body rejected', async (t) => {
  const api = await setup(t);
  for (const patch of [{ id: '92704' }, { transferAmount: '150000' }, { transferAmount: 0 }, { content: null }, { transferAmount: 1.5 }]) {
    assert.equal((await api.webhook(patch)).status, 400);
  }
  assert.equal((await api.webhook({}, { body: '{' })).status, 400);
  assert.equal((await api.webhook({}, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await api.webhook({ content: 'A'.repeat(70000) })).status, 413);
});

test('DB failure is 500, not a successful ACK', async (t) => {
  const api = await setup(t, {}, { processPayment() { throw new Error('DB unavailable'); } });
  assert.deepEqual(await api.webhook(), { status: 500, body: { success: false, message: 'Internal server error' } });
});

test('configured VA is checked', async (t) => {
  const api = await setup(t, { bank: { ...config.bank, subAccount: 'VA123' } });
  await api.createBooking();
  assert.equal((await api.webhook()).body.result, 'REVIEW_WRONG_ACCOUNT');
  assert.equal((await api.webhook({ id: 92705, subAccount: 'VA123' })).body.result, 'PAID');
});

test('regex boundaries and QR encoding', () => {
  assert.equal(extractBookingCode('ck datsan00123.'), 'DATSAN00123');
  assert.equal(extractBookingCode('DATSAN123 DATSAN123'), 'DATSAN123');
  for (const value of ['XDATSAN123', 'DATSAN123ABC', 'DATSAN12345678901', 'DATSAN123 DATSAN124']) {
    assert.equal(extractBookingCode(value), null);
  }
  const url = new URL(createVietQrUrl(150000, 'DATSAN123', { ...config.bank, accountName: 'NGUYỄN VĂN A & B' }));
  assert.equal(url.searchParams.get('accountName'), 'NGUYỄN VĂN A & B');
  assert.equal(url.pathname, '/image/970436-0123456789-compact2.png');
  assert.throws(() => createVietQrUrl(1.5, 'DATSAN123', config.bank));
});

test('config fails closed when credentials missing or mode wrong; refuses production Mock DB', () => {
  assert.throws(() => loadConfig({}), /SEPAY_WEBHOOK_SECRET/);
  assert.throws(() => loadConfig({ SEPAY_AUTH_MODE: 'none' }), /SEPAY_AUTH_MODE/);
  assert.throws(() => loadConfig({ NODE_ENV: 'production' }), /Mock DB/);
});

test('Postman pre-request script creates a signature accepted by endpoint', async (t) => {
  const api = await setup(t);
  await api.createBooking();
  let raw = JSON.stringify(sample, null, 2);
  const headers = {};
  const pm = {
    environment: { get: () => config.auth.secret }, variables: { replaceIn: (s) => s },
    request: {
      body: { get raw() { return raw; }, update: (s) => { raw = s; } },
      headers: { upsert: ({ key, value }) => { headers[key] = value; } },
    },
  };
  const script = await readFile(new URL('../postman/hmac.pre-request.js', import.meta.url), 'utf8');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('pm', script)(pm);
  assert.equal((await api.request('/api/payment/webhook', { method: 'POST', body: raw, headers })).body.result, 'PAID');
});
