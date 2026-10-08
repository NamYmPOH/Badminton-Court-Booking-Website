const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { choosePaymentMethod, publicBooking, createReservation } = require('../src/services/reservation.service.ts');
const { canPayBooking } = require('../src/lib/booking-payment.ts');
const { checkBookingAction } = require('../src/lib/admin-policy.ts');
const { operatorVenueScope } = require('../src/lib/venue-operations.ts');
const { performAdminAction } = require('../src/services/admin.service.ts');
const { getSepayConfig } = require('../src/lib/sepay.ts');
const config = getSepayConfig({ SEPAY_WEBHOOK_SECRET: 'test-only-never-production', BANK_BIN: '970415', BANK_ACCOUNT_NO: '0001234703', BANK_ACCOUNT_NAME: 'TEST', SEPAY_BANK_GATEWAY: 'VietinBank' });
const future = new Date(Date.now() + 86400000);
function order(patch = {}) { return { id: 'b', code: 'DATSAN123', userId: 'u', venueId: 'v', status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', paymentMethod: 'BANK_TRANSFER', total: 150000, expiresAt: new Date(Date.now() + 600000), createdAt: new Date(), venue: { paymentMode: 'AT_VENUE' }, items: [{ id: 'i', status: 'HELD', date: future, startMin: 600, court: { name: 'Sân 1' } }], ...patch }; }
test('customer method changes enforce ownership and never confirm, pay or extend hold', async () => {
  const booking = order(); const expires = booking.expiresAt.getTime();
  const db = { $transaction: async work => work({ booking: {
    findFirst: async ({ where }) => where.userId === 'u' && where.code === booking.code ? booking : null,
    update: async ({ data }) => Object.assign(booking, data),
  } }) };
  await assert.rejects(choosePaymentMethod(db, 'other', booking.code, 'CASH'), e => e.status === 404);
  for (const method of ['CASH', 'CASH', 'BANK_TRANSFER']) {
    await choosePaymentMethod(db, 'u', booking.code, method);
    assert.equal(booking.paymentMethod, method); assert.equal(booking.status, 'PENDING_PAYMENT'); assert.equal(booking.paymentStatus, 'PENDING'); assert.equal(booking.expiresAt.getTime(), expires);
  }
  booking.paymentStatus = 'PAID';
  await assert.rejects(choosePaymentMethod(db, 'u', booking.code, 'CASH'), e => e.status === 409);
  booking.paymentStatus = 'PENDING'; booking.expiresAt = new Date(0);
  await assert.rejects(choosePaymentMethod(db, 'u', booking.code, 'CASH'), e => e.status === 409);
});
test('QR works for legacy confirmed unpaid reservations and disappears for paid, cancelled or started games', () => {
  const b = order({ status: 'CONFIRMED', paymentStatus: 'UNPAID', paymentMethod: null, expiresAt: null });
  b.items[0].status = 'CONFIRMED';
  assert.ok(publicBooking(b, config).qrUrl); assert.equal(publicBooking(b, config).paymentMethod, 'BANK_TRANSFER');
  assert.equal(publicBooking({ ...b, paymentStatus: 'PAID' }, config).qrUrl, null);
  assert.equal(publicBooking({ ...b, status: 'CANCELLED' }, config).qrUrl, null);
  b.items[0].date = new Date(0); assert.equal(canPayBooking(b), false);
});
test('cash request must be approved before collection and venue policy cannot override explicit online choice', () => {
  const b = order(); assert.throws(() => checkBookingAction(b, 'CONFIRM'));
  b.paymentMethod = 'CASH'; assert.doesNotThrow(() => checkBookingAction(b, 'CONFIRM'));
  assert.throws(() => checkBookingAction(b, 'CASH_PAID'));
  b.status = 'CONFIRMED'; assert.doesNotThrow(() => checkBookingAction(b, 'CASH_PAID'));
  b.paymentStatus = 'PAID'; assert.throws(() => checkBookingAction(b, 'CASH_PAID'));
});
test('operator access is scoped to ownership or staff membership; customers and blocked operators denied', async () => {
  assert.deepEqual(operatorVenueScope({ id: 'o', role: 'OWNER', status: 'ACTIVE' }), { ownerId: 'o' });
  assert.deepEqual(operatorVenueScope({ id: 's', role: 'STAFF', status: 'ACTIVE' }), { staff: { some: { userId: 's' } } });
  for (const actor of [{ role: 'CUSTOMER', status: 'ACTIVE' }, { role: 'OWNER', status: 'BLOCKED' }]) assert.throws(() => operatorVenueScope(actor));
  for (const role of ['OWNER', 'STAFF']) {
    let writes = 0;
    const db = { $transaction: async work => work({ user: { findUnique: async () => ({ id: 'actor', name: 'Operator', role, status: 'ACTIVE' }) }, booking: { findUnique: async () => order({ paymentMethod: 'CASH' }), update: async () => { writes++; } }, venue: { findFirst: async () => null } }) };
    await assert.rejects(performAdminAction(db, 'actor', { id: 'b', action: 'CONFIRM', reason: 'Approve booking' }), e => e.status === 403); assert.equal(writes, 0);
    await assert.rejects(performAdminAction(db, 'actor', { id: 'u', action: 'USER_ACCESS', role: 'ADMIN', status: 'ACTIVE', reason: 'Escalate rights' }), e => e.status === 403);
  }
});
test('new reservations show QR choice even at legacy cash-only venues', async () => {
  const date = future.toISOString().slice(0, 10);
  const venue = { id: 'v', status: 'ACTIVE', paymentMode: 'AT_VENUE', openMin: 300, closeMin: 1320, advanceDays: 30, minBookingMin: 60, maxBookingMin: 240, courts: [{ id: 'c', status: 'ACTIVE' }], pricing: [{ daysOfWeek: [1,2,3,4,5,6,7], startMin: 300, endMin: 1320, walkInPrice: 150000 }] };
  const db = { $transaction: async work => work({ venue: { findUnique: async () => venue }, courtBlock: { findFirst: async () => null }, bookingItem: { findFirst: async () => null }, booking: { findUnique: async () => null, count: async () => 0, create: async ({ data }) => data } }) };
  const b = await createReservation(db, 'u', { requestId: 'test', venueId: 'v', date, customerName: 'Test User', customerPhone: '0912345678', slots: [{ courtId: 'c', startMin: 600, endMin: 630 }, { courtId: 'c', startMin: 630, endMin: 660 }] });
  assert.equal(b.status, 'PENDING_PAYMENT'); assert.equal(b.paymentMethod, 'BANK_TRANSFER'); assert.ok(b.expiresAt); assert.equal(b.items.create[0].status, 'HELD');
});
test('assigned owners and staff approve cash without marking paid, then collect once with audit', async () => {
  for (const role of ['OWNER', 'STAFF']) {
    let state = { booking: order({ paymentMethod: 'CASH' }), payments: [], audits: [] };
    const db = { $transaction: async work => {
      const copy = structuredClone(state);
      const result = await work({
        user: { findUnique: async () => ({ id: 'operator', name: 'Operator', role, status: 'ACTIVE' }) },
        venue: { findFirst: async ({ where }) => { assert.equal(where.id, 'v'); assert.deepEqual(where, { id: 'v', ...operatorVenueScope({ id: 'operator', role, status: 'ACTIVE' }) }); return { id: 'v' }; } },
        booking: { findUnique: async () => copy.booking, update: async ({ data }) => Object.assign(copy.booking, data) },
        bookingItem: { updateMany: async ({ data }) => { copy.booking.items.forEach(i => Object.assign(i, data)); return { count: 1 }; } },
        payment: { create: async ({ data }) => copy.payments.push(data) },
        adminAudit: { create: async ({ data }) => copy.audits.push(data) },
      }); state = copy; return result;
    } };
    await performAdminAction(db, 'operator', { id: 'b', action: 'CONFIRM', reason: 'Customer will pay at venue' });
    assert.equal(state.booking.status, 'CONFIRMED'); assert.equal(state.booking.paymentStatus, 'PENDING'); assert.equal(state.booking.expiresAt, null); assert.equal(state.payments.length, 0);
    await performAdminAction(db, 'operator', { id: 'b', action: 'CASH_PAID', reason: 'Cash received in full' });
    assert.equal(state.booking.paymentStatus, 'PAID'); assert.equal(state.payments[0].provider, 'CASH'); assert.equal(state.audits.length, 2);
    await assert.rejects(performAdminAction(db, 'operator', { id: 'b', action: 'CASH_PAID', reason: 'Repeated click' }), e => e.status === 409);
    assert.equal(state.payments.length, 1);
  }
});
