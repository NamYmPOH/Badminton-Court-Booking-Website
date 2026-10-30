const assert = require('node:assert/strict');
const { test } = require('node:test');
const { fixture, actors } = require('./helpers/refund-db.cjs');
const { refundLedger, reserveRefund, completeRefund, approveCancellationInTransaction } = require('../src/services/refund.service.ts');
const { cancelCoachBookingByCoach } = require('../src/services/coach.service.ts');
const { requestBookingCancellation, approveBookingCancellation, recordManualRefund, confirmCashPayment } = require('../src/services/venue-session.service.ts');
const { closeGroup, groupAction } = require('../src/services/group-payment.service.ts');
const { serializable } = require('../src/lib/transaction.ts');
const cancelCoach = (db) => cancelCoachBookingByCoach(db, 'coach-user', 'cb', 'HLV bị ốm đột xuất');
const reserve = (db, amount) => serializable(db, (tx) => reserveRefund(tx, 'b', amount, 'Hoàn theo chứng từ'));
const pay = (db, id, amount, reference) => recordManualRefund(db, actors.staff, 'b', amount, 'Đã đối soát chi thực tế', id, reference);

test('Hủy HLV rồi hủy sân: bảo toàn tiền đã thu, không duyệt lại tiền HLV đã chi', async () => {
  const db = fixture();
  await cancelCoach(db);
  assert.equal(db.state.booking.total, 200000);
  assert.equal(db.state.booking.paymentStatus, 'PAID');
  assert.equal(db.state.payments.length, 1);
  const id = db.state.refunds[0].id;
  await pay(db, id, 200000, 'BANK-COACH-1');
  assert.equal(db.state.booking.paymentStatus, 'PAID');
  assert.equal(db.state.refunds[0].status, 'COMPLETED');
  await requestBookingCancellation(db, actors.owner, 'b', 'Chủ sân ngừng hoạt động');
  assert.equal(db.state.refunds[0].amount, 400000);
  assert.equal(db.state.refunds[0].completedAmount, 200000);
  assert.equal(db.state.refunds[0].status, 'PENDING');
  assert.equal(db.state.booking.refundCompletedAt, null);
  await assert.rejects(pay(db, id, 200001, 'BANK-COURT-1'), { status: 409 });
  await pay(db, id, 200000, 'BANK-COURT-1');
  assert.equal(db.state.disbursements.reduce((sum, d) => sum + d.amount, 0), 400000);
  assert.equal(db.state.booking.paymentStatus, 'REFUNDED');
  assert.equal(db.state.payments[0].amount, 400000);
});

test('Hoàn từng phần, retry cùng chứng từ và xung đột chứng từ không làm tăng số tiền đã chi', async () => {
  const db = fixture();
  await approveBookingCancellation(db, actors.owner, 'b', 300000, 'Duyệt hoàn theo chính sách');
  const id = db.state.refunds[0].id;
  await pay(db, id, 100000, ' bank-001 ');
  assert.equal(db.state.booking.paymentStatus, 'REFUND_PENDING');
  assert.equal(db.state.booking.refundCompletedAt, null);
  assert.equal((await pay(db, id, 100000, 'BANK-001')).duplicate, true);
  await assert.rejects(pay(db, id, 100001, 'BANK-001'), { status: 409 });
  await assert.rejects(pay(db, id, 200001, 'BANK-002'), { status: 409 });
  await pay(db, id, 200000, 'BANK-002');
  assert.equal(db.state.disbursements.length, 2);
  assert.equal(db.state.refunds[0].completedAmount, 300000);
  // Giữ chứng từ thu 400k dù đã hoàn 300k.
  assert.equal(db.state.payments[0].status, 'PAID');
  assert.equal(db.state.booking.paymentStatus, 'REFUNDED');
});

test('Hai yêu cầu hoàn chạy đồng thời không chi vượt số dư (fixture tuần tự hóa transaction)', async () => {
  const db = fixture(); await reserve(db, 200000); const id = db.state.refunds[0].id;
  const results = await Promise.allSettled([pay(db, id, 150000, 'PARALLEL-1'), pay(db, id, 150000, 'PARALLEL-2')]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(db.state.refunds[0].completedAmount, 150000);
  const duplicate = await Promise.all([pay(db, id, 50000, 'PARALLEL-3'), pay(db, id, 50000, 'PARALLEL-3')]);
  assert.equal(duplicate.filter((r) => r.duplicate).length, 1);
  assert.equal(db.state.disbursements.length, 2);
});

test('Retry transaction P2034 sau rollback không mất hoặc nhân đôi khoản hoàn', async () => {
  const db = fixture(); let attempts = 0;
  const retryDb = { $transaction: (work, options) => db.$transaction(async (tx) => { const result = await work(tx); if (attempts++ === 0) throw Object.assign(new Error('serialization conflict'), { code: 'P2034' }); return result; }, options) };
  await reserve(retryDb, 200000);
  assert.equal(attempts, 2);
  assert.equal(db.state.refunds.length, 1);
  assert.equal(db.state.refunds[0].amount, 200000);
});

test('Audit thất bại rollback cả hủy HLV, đổi giá và nghĩa vụ hoàn', async () => {
  const db = fixture({ failAudit: true });
  const before = structuredClone(db.state);
  await assert.rejects(cancelCoach(db), /audit unavailable/);
  assert.deepEqual(db.state, before);
});

test('Chặn hoàn khi thiếu chứng từ, tiền không nguyên, sai booking hoặc vượt thực thu', async () => {
  const db = fixture({ amounts: [] });
  await assert.rejects(requestBookingCancellation(db, actors.owner, 'b', 'Hủy sân có lý do'), { status: 409 });
  await assert.rejects(cancelCoach(db), { status: 409 });
  for (const amount of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(reserve(db, amount), { status: 400 });
  }
  await assert.rejects(reserve(db, 1), { status: 409 });
  const paid = fixture(); await reserve(paid, 1000);
  await assert.rejects(serializable(paid, (tx) => completeRefund(tx, 'wrong-booking', paid.state.refunds[0].id, 100, 'WRONG-REF', 'staff')), { status: 409 });
});

test('Dữ liệu hoàn cũ hoặc sổ không khớp phải đối soát, không coi REFUND-COACH là tiền thu', async () => {
  for (const change of [
    (s) => s.payments.push({ id: 'legacy', bookingId: 'b', amount: 200000, status: 'REFUND_PENDING', txnRef: 'REFUND-COACH-cb' }),
    (s) => { s.payments[0].status = 'REFUNDED'; },
    (s) => s.refunds.push({ id: 'r', paymentId: 'p0', amount: 500000, completedAmount: 0, status: 'PENDING' }),
    (s) => s.refunds.push({ id: 'r', paymentId: 'p0', amount: 100000, completedAmount: 0, status: 'COMPLETED' }),
    (s) => s.refunds.push({ id: 'r', paymentId: 'p0', amount: 100000, completedAmount: 0, status: 'REVIEW_REQUIRED' }),
  ]) {
    const db = fixture(); change(db.state);
    await assert.rejects(reserve(db, 1), { status: 409 });
    assert.equal(db.state.disbursements.length, 0);
  }
});

test('Phân bổ nhiều người trả, trả thay và số lẻ luôn bảo toàn từng VND', async () => {
  for (const amounts of [[100001, 99999, 200000], [1, 2, 3], [200000, 200000]]) {
    const total = amounts.reduce((a, b) => a + b, 0);
    const db = fixture({ total, amounts });
    const target = Math.floor(total / 3);
    await reserve(db, target);
    assert.equal(db.state.refunds.reduce((a, b) => a + b.amount, 0), target);
    await reserve(db, total - target);
    for (const p of db.state.payments) assert.equal(db.state.refunds.find((r) => r.paymentId === p.id).amount, p.amount);
  }
  const db = fixture({ amounts: [300000], paymentStatus: 'PARTIALLY_PAID', status: 'PENDING_PAYMENT', shares: [
    { amount: 100000, paymentId: 'p0' }, { amount: 200000, paymentId: 'p0' }, { amount: 100000, paymentId: null },
  ] });
  await cancelCoach(db);
  assert.equal(db.state.shares.reduce((s, r) => s + r.amount, 0), 200000);
  assert.equal(db.state.refunds[0].paymentId, 'p0');
  assert.equal(db.state.refunds[0].amount, 100000);
});

test('Hủy sân đóng cả HLV, giữ chỗ, ưu đãi và QR nhóm; không thu tiền lại', async () => {
  const db = fixture({ shares: [{ amount: 400000, paymentId: 'p0' }] });
  await requestBookingCancellation(db, actors.owner, 'b', 'Cơ sở đóng cửa đột xuất');
  assert.equal(db.state.items[0].status, 'CANCELLED');
  assert.equal(db.state.coaches[0].status, 'CANCELLED');
  assert.equal(db.state.offers[0].state, 'RELEASED');
  assert.equal(db.state.intents[0].status, 'CLOSED');
  assert.ok(db.state.group.closedAt);
  await assert.rejects(confirmCashPayment(db, actors.owner, 'b', 400000, 'Không được thu lại'), { status: 409 });
  await assert.rejects(approveBookingCancellation(db, actors.owner, 'b', 1, 'Duyệt lần nữa'), { status: 409 });
});

test('Hủy HLV không được làm sống lại đơn hết hạn, đang sử dụng hoặc hoàn tất', async () => {
  for (const status of ['EXPIRED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']) {
    const db = fixture({ status }); await assert.rejects(cancelCoach(db), { status: 409 });
    assert.equal(db.state.refunds.length, 0);
  }
  const db = fixture({ status: 'PENDING_PAYMENT' }); db.state.booking.expiresAt = new Date(0);
  await assert.rejects(cancelCoach(db), { status: 409 });
});

test('Nhân viên và khách chỉ gửi yêu cầu; không tự duyệt hoặc ghi chi khoản chưa duyệt', async () => {
  const db = fixture();
  for (const actor of [actors.staff, actors.customer]) {
    assert.equal((await requestBookingCancellation(db, actor, 'b', 'Khách bận việc đột xuất')).requiresApproval, true);
    await assert.rejects(approveBookingCancellation(db, actor, 'b', 1000, 'Tự ý duyệt hoàn'), { status: 403 });
  }
  await assert.rejects(pay(db, 'not-approved', 1, 'NOT-APPROVED'), { status: 409 });
  assert.equal(db.state.booking.status, 'CONFIRMED');
});

test('Hủy nhóm sau khi hoàn HLV: chính sách 50% chỉ áp dụng số tiền còn giữ', async () => {
  const db = fixture({ shares: [{ amount: 400000, paymentId: 'p0' }] });
  await cancelCoach(db);
  await pay(db, db.state.refunds[0].id, 200000, 'COACH-FIRST');
  // Mốc thời gian còn 18 tiếng theo giờ Việt Nam.
  const target = new Date(Date.now() + 18 * 3600000 + 7 * 3600000);
  db.state.items[0].date = new Date(target.toISOString().slice(0, 10));
  db.state.items[0].startMin = target.getUTCHours() * 60 + target.getUTCMinutes();
  await serializable(db, (tx) => closeGroup(tx, 'g', false, 'Nhóm hủy theo chính sách'));
  assert.equal(db.state.refunds[0].amount, 300000);
  assert.equal(db.state.refunds[0].completedAmount, 200000);
  assert.equal(db.state.refunds[0].status, 'PENDING');
});

test('Chung sổ chi giữa màn hình nhóm và vận hành; không dùng một chứng từ cho hai người trả', async () => {
  const db = fixture({ amounts: [200000, 200000], shares: [{ amount: 200000, paymentId: 'p0' }, { amount: 200000, paymentId: 'p1' }] });
  await cancelCoach(db);
  const [a, b] = db.state.refunds;
  await groupAction(db, 'staff', 'invite', { action: 'REFUND_DONE', refundId: a.id, amount: 50000, reference: 'SHARED-REF-1', reason: 'Đã đối soát giao dịch' });
  assert.equal((await pay(db, a.id, 50000, 'SHARED-REF-1')).duplicate, true);
  await assert.rejects(pay(db, b.id, 50000, 'SHARED-REF-1'), { status: 409 });
  assert.equal(db.state.disbursements.length, 1);
  assert.equal(db.state.booking.paymentStatus, 'PAID');
});

test('Staff không lách quyền duyệt hủy qua API nhóm; phần 0 đồng không tạo phiếu thu', async () => {
  const db = fixture({ shares: [{ amount: 400000, paymentId: 'p0' }] });
  await assert.rejects(groupAction(db, 'staff', 'invite', { action: 'CANCEL', reason: 'Tự duyệt hủy có tiền' }), { status: 403 });
  const unpaid = fixture({ amounts: [], paymentStatus: 'PENDING', shares: [{ amount: 0, paymentId: null }, { amount: 400000, paymentId: null }] });
  await assert.rejects(groupAction(unpaid, 'staff', 'invite', { action: 'COLLECT_CASH', shareIds: ['s0'], reason: 'Không được thu zero' }), { status: 409 });
  assert.equal(unpaid.state.payments.length, 0);
});

test('Webhook chuyển tiền tới sau hủy được lưu chờ đối soát; không mở lại đơn hoặc ghi PAID', async () => {
  const { receiveSepayPayment } = require('../src/services/sepay.service.ts');
  const db = fixture({ amounts: [], paymentStatus: 'PENDING' });
  await requestBookingCancellation(db, actors.customer, 'b', 'Khách hủy trước thanh toán');
  const config = { BANK_ACCOUNT_NO: '123456', SEPAY_BANK_GATEWAY: 'TestBank' };
  const event = { id: 123, content: 'DATSAN123', transferType: 'in', transferAmount: 400000, accountNumber: '123456', gateway: 'TestBank' };
  assert.equal((await receiveSepayPayment(db, event, config)).result, 'REVIEW_BOOKING_NOT_PENDING');
  assert.equal((await receiveSepayPayment(db, event, config)).result, 'DUPLICATE');
  assert.equal(db.state.booking.status, 'CANCELLED');
  assert.equal(db.state.receipts.length, 1);
  assert.equal(db.state.payments.length, 0);
});

test('Sai tổng chứng từ chi và thiếu chứng từ thu nhóm đều chặn hoàn tự động', async () => {
  const db = fixture(); await reserve(db, 200000);
  db.state.refunds[0].completedAmount = 100;
  await assert.rejects(reserve(db, 1), { status: 409 });
  const group = fixture({ amounts: [], shares: [{ amount: 400000, paymentId: 'missing' }] });
  await assert.rejects(serializable(group, (tx) => closeGroup(tx, 'g', false, 'Thiếu chứng từ thu')), { status: 409 });
  assert.equal(group.state.booking.status, 'CONFIRMED');
});

test('Rollback rồi retry hủy HLV vẫn ghi chứng từ voucher đúng một lần', async () => {
  const db = fixture({ amounts: [200000], status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', shares: [{ amount: 200000, paymentId: 'p0' }, { amount: 200000, paymentId: null }] });
  db.state.booking.voucherId = 'voucher-refund-retry';
  db.state.offers = [];
  let attempts = 0;
  const retryDb = { $transaction: (work, options) => db.$transaction(async (tx) => {
    const result = await work(tx);
    if (attempts++ === 0) throw Object.assign(new Error('serialization conflict'), { code: 'P2034' });
    return result;
  }, options) };
  await cancelCoach(retryDb);
  assert.equal(attempts, 2);
  assert.equal(db.state.voucherUsages.length, 1);
  assert.equal(db.state.voucherUsedCount, 1);
  await serializable(db, (tx) => require('../src/services/settlement.service.ts').recordVoucherConsumption(tx, 'b', 'voucher-refund-retry'));
  assert.equal(db.state.voucherUsedCount, 1);
});

test('Quyền duyệt được đọc lại trong transaction; lỗi audit khi ghi chi rollback cả chứng từ', async () => {
  const db = fixture();
  await assert.rejects(approveBookingCancellation(db, { ...actors.staff, role: 'ADMIN' }, 'b', 100000, 'Không tin quyền cũ'), { status: 403 });
  const failing = fixture({ failAudit: true });
  await reserve(failing, 100000);
  const before = structuredClone(failing.state);
  await assert.rejects(pay(failing, failing.state.refunds[0].id, 100000, 'AUDIT-FAIL-1'), /audit unavailable/);
  assert.deepEqual(failing.state, before);
});

test('Hủy một ca HLV chỉ bỏ một dòng phí, giữ phí các ca khác của cùng HLV', async () => {
  const db = fixture({ total: 600000, fee: 200000, amounts: [600000] });
  db.state.priceLines.push({ id: 'line-other', bookingId: 'b', type: 'COACH', beneficiaryId: 'coach', amount: 200000 });
  await cancelCoach(db);
  assert.equal(db.state.priceLines.length, 1);
  assert.equal(db.state.priceLines[0].id, 'line-other');
  assert.equal(db.state.booking.total, 400000);
  assert.equal(db.state.refunds[0].amount, 200000);
});
