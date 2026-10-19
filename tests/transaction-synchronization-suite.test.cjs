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
  // Tổng 500k, HLV 100k -> tổng mới 400k. Đã trả 200k. Còn thiếu 200k.
  const booking = {
    id: "b-less-than-new-total",
    code: "DATSAN-LESS",
    userId: "lead-less",
    paymentStatus: "PARTIALLY_PAID",
    status: "PENDING_PAYMENT",
    subtotal: 500000,
    total: 500000,
  };

  const shares = [
    { id: "s-1", position: 1, amount: 250000, paymentId: "p-1" },
    { id: "s-2", position: 2, amount: 250000, paymentId: null },
  ];

  const coachBooking = {
    id: "cb-less",
    coachId: "c-less",
    fee: 100000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  let bookingItemUpdated = false;

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-less", userId: "u-coach" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingItem: {
          updateMany: async () => {
            bookingItemUpdated = true;
            return { count: 1 };
          },
        },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-less", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        notification: { create: async () => ({ id: "n-less" }) },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-less", "Bận đột xuất");
  assert.equal(res.success, true);
  assert.equal(booking.total, 400000);
  assert.equal(booking.status, "PENDING_PAYMENT");
  assert.equal(booking.paymentStatus, "PARTIALLY_PAID");
  assert.equal(bookingItemUpdated, false, "BookingItem chưa được confirm vì tiền chưa đủ");
  assert.equal(shares[1].amount, 150000, "Phần còn lại phải là 400k - 250k = 150k");
});

test("Nhóm 1: Tiền đã thu bằng tổng mới sau hủy HLV -> Sân CONFIRMED, không tạo refund dư", async () => {
  // Tổng 400k, HLV 200k -> tổng mới 200k. Đã trả 200k (2 phần x 100k).
  const booking = {
    id: "b-equal-new-total",
    code: "DATSAN-EQ",
    userId: "lead-eq",
    paymentStatus: "PARTIALLY_PAID",
    status: "PENDING_PAYMENT",
    subtotal: 400000,
    total: 400000,
  };

  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-1" },
    { id: "s-2", position: 2, amount: 100000, paymentId: "p-2" },
    { id: "s-3", position: 3, amount: 100000, paymentId: null },
    { id: "s-4", position: 4, amount: 100000, paymentId: null },
  ];

  const coachBooking = {
    id: "cb-eq",
    coachId: "c-eq",
    fee: 200000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  let bookingItemConfirmed = false;
  let refundCreated = false;

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-eq", userId: "u-coach" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
          updateMany: async () => ({ count: 0 }),
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingItem: {
          updateMany: async ({ data }) => {
            if (data.status === "CONFIRMED") bookingItemConfirmed = true;
            return { count: 1 };
          },
        },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-eq", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        groupRefund: {
          create: async () => {
            refundCreated = true;
          },
        },
        notification: { create: async () => ({ id: "n-eq" }) },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-eq", "Bận việc");
  assert.equal(res.success, true);
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(booking.paymentStatus, "PAID");
  assert.equal(bookingItemConfirmed, true, "BookingItem phải được CONFIRMED khi tiền vừa đủ");
  assert.equal(refundCreated, false, "Không tạo khoản hoàn vì tiền đã thu vừa bằng tổng mới");
  assert.equal(shares[2].amount, 0);
  assert.equal(shares[3].amount, 0);
});

test("Nhóm 1: Tiền đã thu lớn hơn tổng mới sau hủy HLV -> Sân CONFIRMED và tạo GroupRefund gắn với Payment gốc", async () => {
  // Tổng 500k, HLV 300k -> tổng mới 200k. Đã trả 3 phần = 300k (dư 100k).
  const booking = {
    id: "b-greater-new-total",
    code: "DATSAN-GT",
    userId: "lead-gt",
    paymentStatus: "PARTIALLY_PAID",
    status: "PENDING_PAYMENT",
    subtotal: 500000,
    total: 500000,
  };

  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-1" },
    { id: "s-2", position: 2, amount: 100000, paymentId: "p-2" },
    { id: "s-3", position: 3, amount: 100000, paymentId: "p-3" },
    { id: "s-4", position: 4, amount: 100000, paymentId: null },
    { id: "s-5", position: 5, amount: 100000, paymentId: null },
  ];

  const coachBooking = {
    id: "cb-gt",
    coachId: "c-gt",
    fee: 300000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const payments = [
    { id: "p-1", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-1" },
    { id: "p-2", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-2" },
    { id: "p-3", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-3" },
  ];

  const refundsCreated = [];
  let bookingItemConfirmed = false;

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-gt", userId: "u-coach" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
          updateMany: async () => ({ count: 0 }),
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingItem: {
          updateMany: async ({ data }) => {
            if (data.status === "CONFIRMED") bookingItemConfirmed = true;
            return { count: 1 };
          },
        },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-gt", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        payment: {
          findMany: async () => payments,
          update: async ({ where, data }) => {
            const p = payments.find((item) => item.id === where.id);
            if (p) Object.assign(p, data);
            return p;
          },
        },
        groupRefund: {
          create: async ({ data }) => {
            refundsCreated.push(data);
            return data;
          },
        },
        notification: { create: async () => ({ id: "n-gt" }) },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-gt", "Bận đột xuất");
  assert.equal(res.success, true);
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(booking.paymentStatus, "PAID");
  assert.equal(bookingItemConfirmed, true);

  // Tổng refund phải đúng bằng excess = 300k - 200k = 100k
  const totalRefundAmount = refundsCreated.reduce((sum, r) => sum + r.amount, 0);
  assert.equal(totalRefundAmount, 100000, `Tổng khoản hoàn (${totalRefundAmount}) phải đúng bằng 100.000đ excess`);
  assert.ok(refundsCreated.every((r) => r.paymentId && r.paymentId.startsWith("p-")), "Khoản hoàn phải gắn với Payment gốc");
});

test("Nhóm 1: HLV vừa hủy vẫn CANCELLED và lịch HLV khác còn hiệu lực chuyển sang CONFIRMED", async () => {
  const booking = {
    id: "b-multi-coach",
    code: "DATSAN-MC",
    userId: "lead-mc",
    paymentStatus: "PARTIALLY_PAID",
    status: "PENDING_PAYMENT",
    subtotal: 600000,
    total: 600000,
  };

  const shares = [
    { id: "s-1", position: 1, amount: 200000, paymentId: "p-1" },
    { id: "s-2", position: 2, amount: 200000, paymentId: "p-2" },
  ];

  // Ca 1 bị hủy
  const coachBooking1 = {
    id: "cb-cancel-me",
    coachId: "c-1",
    fee: 200000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  let otherCoachBookingConfirmed = false;

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-1", userId: "u-coach-1" }) },
        coachBooking: {
          findUnique: async () => coachBooking1,
          update: async ({ data }) => Object.assign(coachBooking1, data),
          updateMany: async ({ where, data }) => {
            // where không được chứa ca cb-cancel-me
            if (data.status === "CONFIRMED") {
              assert.notEqual(where.id, "cb-cancel-me", "Không được xác nhận lại ca vừa bị hủy");
              otherCoachBookingConfirmed = true;
            }
            return { count: 1 };
          },
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingItem: { updateMany: async () => ({ count: 1 }) },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-mc", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        payment: { findMany: async () => [{ id: "p-1", amount: 200000, status: "PAID" }, { id: "p-2", amount: 200000, status: "PAID" }] },
        notification: { create: async () => ({ id: "n-mc" }) },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach-1", "cb-cancel-me", "Bận");
  assert.equal(res.success, true);
  assert.equal(coachBooking1.status, "CANCELLED", "Ca vừa hủy phải giữ nguyên trạng thái CANCELLED");
  assert.equal(otherCoachBookingConfirmed, true, "Các ca HLV còn lại phải được xác nhận");
});

test("Nhóm 1: Retry cùng yêu cầu hủy HLV là idempotent và không tạo refund trùng", async () => {
  const booking = {
    id: "b-retry-cancel",
    status: "CONFIRMED",
    paymentStatus: "PAID",
  };

  const coachBooking = {
    id: "cb-already-cancelled",
    coachId: "c-1",
    fee: 150000,
    status: "CANCELLED", // Đã hủy từ trước
    bookingItem: { booking },
  };

  let refundCreateCalled = false;

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-1", userId: "u-coach" }) },
        coachBooking: { findUnique: async () => coachBooking },
        payment: {
          create: async () => {
            refundCreateCalled = true;
          },
        },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-already-cancelled", "Hủy lại");
  assert.equal(res.success, true);
  assert.equal(res.alreadyCancelled, true);
  assert.equal(refundCreateCalled, false, "Retry yêu cầu hủy đã xong không được tạo thêm refund");
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
