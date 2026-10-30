// Stateful transaction fixture: commit on success, rollback on failure, serialize writers.
// This tests service invariants; it does not replace PostgreSQL concurrency verification.
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const actors = {
  owner: { id: 'owner', name: 'Chủ sân', role: 'OWNER', status: 'ACTIVE' },
  staff: { id: 'staff', name: 'Nhân viên', role: 'STAFF', status: 'ACTIVE' },
  customer: { id: 'customer', name: 'Khách', role: 'CUSTOMER', status: 'ACTIVE' },
  coach: { id: 'coach-user', name: 'HLV', role: 'CUSTOMER', status: 'ACTIVE' },
};
function fixture({ total = 400000, fee = 200000, amounts = [400000], shares = null, status = 'CONFIRMED', paymentStatus = 'PAID', refunds = [], payments, failAudit = false } = {}) {
  const initialPayments = payments || amounts.map((amount, i) => ({ id: `p${i}`, bookingId: 'b', amount, status: 'PAID', txnRef: `RECEIPT-${i}`, provider: i % 2 ? 'CASH' : 'BANK_TRANSFER', paidAt: new Date() }));
  let state = {
    booking: { id: 'b', code: 'DATSAN123', venueId: 'v', userId: 'customer', total, subtotal: total, paymentStatus, status, cancelApprovedAt: null, refundAmountApproved: null, expiresAt: new Date(Date.now() + 3600000), voucherId: null },
    venue: { id: 'v', ownerId: 'owner', status: 'ACTIVE', paymentMode: 'AT_VENUE' },
    items: [{ id: 'item', bookingId: 'b', status: status === 'PENDING_PAYMENT' ? 'HELD' : 'CONFIRMED', date: new Date(Date.now() + 3 * 86400000), startMin: 600, endMin: 660 }],
    coaches: [{ id: 'cb', coachId: 'coach', fee, status: 'CONFIRMED', bookingItemId: 'item' }],
    voucherUsages: [], voucherUsedCount: 0, receipts: [], payments: initialPayments, refunds: structuredClone(refunds), disbursements: [], audits: [], notifications: [],
    priceLines: [{ id: 'line', bookingId: 'b', type: 'COACH', beneficiaryId: 'coach', amount: fee }],
    group: shares ? { id: 'g', bookingId: 'b', inviteToken: 'invite', closedAt: null } : null,
    shares: shares ? shares.map((s, i) => ({ id: `s${i}`, position: i + 1, cashRequested: false, currentIntentId: 'intent', ...s })) : [],
    intents: [{ id: 'intent', groupId: 'g', status: 'OPEN' }],
    offers: [{ id: 'offer', bookingId: 'b', state: 'RESERVED', expiresAt: new Date() }],
  };
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => {
    if (['bookingItem', 'group', 'payment', 'venue', 'OR'].includes(key)) return true;
    if (value && typeof value === 'object') {
      if ('in' in value) return value.in.includes(row[key]);
      if ('not' in value) return row[key] !== value.not;
      return true;
    }
    return row[key] === value;
  });
  function client(s) {
    const model = (rows, defaults = {}) => ({
      findMany: async ({ where } = {}) => structuredClone(rows.filter((r) => matches(r, where))),
      findUnique: async ({ where }) => structuredClone(rows.find((r) => matches(r, where)) || null),
      findFirst: async ({ where }) => structuredClone(rows.find((r) => matches(r, where)) || null),
      create: async ({ data }) => { const row = { id: `id-${rows.length}`, ...defaults, ...data }; rows.push(row); return structuredClone(row); },
      update: async ({ where, data }) => { const row = rows.find((r) => matches(r, where)); if (!row) throw new Error('Fixture row missing'); Object.assign(row, data); return structuredClone(row); },
      updateMany: async ({ where, data }) => { const found = rows.filter((r) => matches(r, where)); found.forEach((r) => Object.assign(r, data)); return { count: found.length }; },
      count: async ({ where }) => rows.filter((r) => matches(r, where)).length,
      deleteMany: async ({ where }) => { let count = 0; for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], where)) { rows.splice(i, 1); count++; } return { count }; },
    });
    const booking = () => structuredClone({ ...s.booking, venue: s.venue, items: s.items, payments: s.payments, group: s.group });
    const group = () => s.group ? structuredClone({ ...s.group, booking: booking(), shares: s.shares, intents: s.intents }) : null;
    const tx = {
      user: { findUnique: async ({ where }) => Object.values(actors).find((a) => a.id === where.id) || null },
      venue: { findUnique: async () => s.venue, findFirst: async ({ where }) => (!where.ownerId || where.ownerId === s.venue.ownerId) && (!where.id || where.id === s.venue.id) ? s.venue : null },
      venueStaff: { findMany: async () => [], findFirst: async ({ where }) => where.userId === 'staff' ? { isActive: true } : null },
      staffShift: { findFirst: async () => ({ id: 'shift' }) },
      coachProfile: { findUnique: async ({ where }) => where.userId === 'coach-user' ? { id: 'coach', userId: 'coach-user' } : null },
      booking: { ...model([s.booking]), findUnique: async () => booking(), findUniqueOrThrow: async () => booking() },
      bookingItem: model(s.items),
      coachBooking: { ...model(s.coaches), findUnique: async ({ where }) => { const row = s.coaches.find((r) => r.id === where.id); return row ? structuredClone({ ...row, bookingItem: { ...s.items[0], booking: booking() } }) : null; } },
      bookingGroup: { ...model(s.group ? [s.group] : []), findUnique: async () => group(), findUniqueOrThrow: async () => group() },
      voucherUsage: { ...model(s.voucherUsages), findUnique: async ({ where }) => s.voucherUsages.find((r) => r.voucherId === where.voucherId_bookingId.voucherId && r.bookingId === where.voucherId_bookingId.bookingId) || null },
      voucher: { update: async ({ data }) => { s.voucherUsedCount += data.usedCount.increment; return {}; } },
      bookingPriceLine: model(s.priceLines), groupShare: model(s.shares), groupPaymentIntent: model(s.intents), offerUsage: model(s.offers),
      sepayReceipt: model(s.receipts),
      payment: { ...model(s.payments), findMany: async ({ where }) => structuredClone(s.payments.filter((p) => matches(p, where)).map((p) => ({ ...p, groupRefund: s.refunds.filter((r) => r.paymentId === p.id).map((r) => ({ ...r, disbursements: s.disbursements.filter((d) => d.refundId === r.id) }))[0] || null }))) },
      groupRefund: model(s.refunds, { completedAmount: 0, status: 'PENDING', completedAt: null }),
      refundDisbursement: model(s.disbursements),
      notification: model(s.notifications),
      adminAudit: { ...model(s.audits), create: async ({ data }) => { if (failAudit) throw new Error('audit unavailable'); s.audits.push(data); return data; } },
    };
    return tx;
  }
  let queue = Promise.resolve();
  const db = {
    get state() { return state; },
    tx() { return client(state); },
    $transaction(work, options) {
      if (options?.isolationLevel !== 'Serializable') throw new Error('Expected Serializable transaction');
      const task = queue.then(async () => { const copy = structuredClone(state); const result = await work(client(copy)); state = copy; return result; });
      queue = task.catch(() => {});
      return task;
    },
  };
  return db;
}
module.exports = { fixture, actors };
