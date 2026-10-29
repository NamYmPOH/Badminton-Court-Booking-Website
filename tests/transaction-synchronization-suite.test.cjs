const { fixture, actors } = require("./helpers/refund-db.cjs");
const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const { test } = require("node:test");

require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );

const { cancelCoachBookingByCoach } = require("../src/services/coach.service.ts");
const { sync, closeGroup } = require("../src/services/group-payment.service.ts");

// ==============================================================================
// 1. TEST BẮT BUỘC NHÓM 1: ĐỒNG BỘ SAU HỦY HLV & VOUCHER
// ==============================================================================

test("Nhóm 1: Tiền đã thu nhỏ hơn tổng mới sau hủy HLV -> BookingItem vẫn HELD, chưa xác nhận", async () => {
  const db = fixture({ total: 500000, fee: 100000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(1).fill(250000), shares: Array.from({ length: 2 }, (_, i) => ({ amount: 250000, paymentId: i < 1 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.items[0].status, 'HELD');
  assert.equal(db.state.booking.status, 'PENDING_PAYMENT');
  assert.equal(db.state.shares[1].amount, 150000);
});

test("Nhóm 1: Tiền đã thu bằng tổng mới sau hủy HLV -> Sân CONFIRMED, không tạo refund dư", async () => {
  const db = fixture({ total: 400000, fee: 200000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(2).fill(100000), shares: Array.from({ length: 4 }, (_, i) => ({ amount: 100000, paymentId: i < 2 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.items[0].status, 'CONFIRMED');
  assert.equal(db.state.booking.paymentStatus, 'PAID');
  assert.equal(db.state.refunds.length, 0);
  assert.deepEqual(db.state.shares.map((s) => s.amount), [100000, 100000, 0, 0]);
});

test("Nhóm 1: Tiền đã thu lớn hơn tổng mới sau hủy HLV -> Sân CONFIRMED và tạo GroupRefund gắn với Payment gốc", async () => {
  const db = fixture({ total: 500000, fee: 300000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(3).fill(100000), shares: Array.from({ length: 5 }, (_, i) => ({ amount: 100000, paymentId: i < 3 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.items[0].status, 'CONFIRMED');
  assert.equal(db.state.booking.paymentStatus, 'PAID');
  assert.equal(db.state.refunds.reduce((s, r) => s + r.amount, 0), 100000);
  for (const r of db.state.refunds) assert.ok(db.state.payments.some((p) => p.id === r.paymentId));
});

test("Nhóm 1: HLV vừa hủy vẫn CANCELLED và lịch HLV khác còn hiệu lực chuyển sang CONFIRMED", async () => {
  const db = fixture({status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: [200000], shares: [{ amount: 200000, paymentId: 'p0' }, { amount: 200000, paymentId: null }]});
  db.state.coaches.push({ id: 'cb-other', coachId: 'other-coach', status: 'HELD', fee: 50000 });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.coaches[0].status, 'CANCELLED');
  assert.equal(db.state.coaches[1].status, 'CONFIRMED');
});

test("Nhóm 1: Retry cùng yêu cầu hủy HLV là idempotent và không tạo refund trùng", async () => {
  const db = fixture({ total: 300000, fee: 150000, amounts: [300000] });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  const second = await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(second.alreadyCancelled, true);
  assert.equal(db.state.refunds.length, 1);
  assert.equal(db.state.refunds[0].amount, 150000);
  assert.equal(db.state.payments.length, 1);
  assert.equal(db.state.booking.paymentStatus, 'PAID');
});

// ==============================================================================
// 2. TEST BẮT BUỘC NHÓM 2: SQL & CLOSEGROUP HẾT HẠN ĐỒNG BỘ
// ==============================================================================

test("Nhóm 2: Hết hạn đơn chưa trả giải phóng sân (EXPIRED), HLV (CANCELLED) và ưu đãi (RELEASED)", async () => {
  let bookingItemExpired = false;
  let coachBookingCancelled = false;
  let offerUsageReleased = false;

  const booking = {
    id: "b-unpaid-expire",
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    items: [{ id: "bi-1", date: new Date(), startMin: 600, endMin: 660 }],
  };

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-unpaid-expire",
        bookingId: booking.id,
        booking,
        shares: [],
        intents: [],
      }),
      update: async () => ({}),
    },
    payment: {
      findMany: async () => [], // Không có payment
    },
    groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
    bookingItem: {
      updateMany: async ({ data }) => {
        if (data.status === "EXPIRED") bookingItemExpired = true;
        return { count: 1 };
      },
    },
    coachBooking: {
      updateMany: async ({ data }) => {
        if (data.status === "CANCELLED") coachBookingCancelled = true;
        return { count: 1 };
      },
    },
    offerUsage: {
      updateMany: async ({ data }) => {
        if (data.state === "RELEASED") offerUsageReleased = true;
        return { count: 1 };
      },
    },
    booking: {
      update: async ({ data }) => Object.assign(booking, data),
    },
  };

  await closeGroup(mockTx, "g-unpaid-expire", true, "Hết hạn giữ chỗ");

  assert.equal(booking.status, "EXPIRED");
  assert.equal(bookingItemExpired, true, "BookingItem phải được giải phóng sang EXPIRED");
  assert.equal(coachBookingCancelled, true, "CoachBooking phải được hủy sang CANCELLED");
  assert.equal(offerUsageReleased, true, "OfferUsage phải được giải phóng sang RELEASED");
});

test("Nhóm 2: closeGroup không chuyển CONSUMED sang RELEASED một cách máy móc", async () => {
  let releasedCount = 0;

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-check-consumed",
        bookingId: "b-chk",
        booking: { id: "b-chk", status: "PENDING_PAYMENT", items: [] },
        shares: [],
        intents: [],
      }),
      update: async () => ({}),
    },
    payment: { findMany: async () => [] },
    groupPaymentIntent: { updateMany: async () => ({ count: 0 }) },
    bookingItem: { updateMany: async () => ({ count: 0 }) },
    coachBooking: { updateMany: async () => ({ count: 0 }) },
    offerUsage: {
      updateMany: async ({ where, data }) => {
        // Chỉ được release where state = RESERVED
        assert.equal(where.state, "RESERVED", "Chỉ được giải phóng OfferUsage ở trạng thái RESERVED");
        assert.equal(data.state, "RELEASED");
        releasedCount++;
        return { count: 1 };
      },
    },
    booking: { update: async () => ({}) },
  };

  await closeGroup(mockTx, "g-check-consumed", true, "Hết hạn");
  assert.equal(releasedCount, 1);
});

test("Nhóm 2: Chạy closeGroup hai lần là idempotent, không gây tác dụng phụ mới", async () => {
  let updateCalledCount = 0;
  const group = {
    id: "g-idempotent-close",
    bookingId: "b-idem",
    closedAt: new Date(), // Đã đóng từ lần 1
    booking: { id: "b-idem", status: "EXPIRED", items: [] },
    shares: [],
    intents: [],
  };

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => group,
      update: async () => {
        updateCalledCount++;
      },
    },
  };

  await closeGroup(mockTx, "g-idempotent-close", true, "Lần 2");
  assert.equal(updateCalledCount, 0, "Lần 2 gọi closeGroup trên nhóm đã closedAt phải return ngay");
});
