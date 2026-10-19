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

// --------------------------------------------------------------------------
// TÁI HIỆN LỖI 1A: HLV hủy đơn nhóm làm đơn đủ tiền nhưng BookingItem vẫn HELD
// --------------------------------------------------------------------------
test("TÁI HIỆN LỖI 1A: HLV hủy đơn nhóm làm đơn đủ tiền nhưng BookingItem vẫn HELD", async () => {
  const booking = {
    id: "b-repro-1a",
    code: "DATSAN-1A",
    userId: "lead-1a",
    paymentStatus: "PARTIALLY_PAID",
    status: "PENDING_PAYMENT",
    subtotal: 400000,
    total: 400000,
  };

  const bookingItems = [
    { id: "bi-1a", bookingId: booking.id, status: "HELD" },
  ];

  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-1" },
    { id: "s-2", position: 2, amount: 100000, paymentId: "p-2" },
    { id: "s-3", position: 3, amount: 100000, paymentId: "p-3" },
    { id: "s-4", position: 4, amount: 100000, paymentId: null },
  ];

  const coachBooking = {
    id: "cb-1a",
    coachId: "c-1a",
    fee: 200000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const payments = [
    { id: "p-1", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-1" },
    { id: "p-2", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-2" },
    { id: "p-3", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-3" },
  ];

  let bookingItemConfirmed = false;

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-1a", userId: "u-coach" }) },
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
        bookingGroup: { findUnique: async () => ({ id: "g-1a", bookingId: booking.id, shares }) },
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
          update: async () => ({}),
        },
        groupRefund: { create: async ({ data }) => data },
        notification: { create: async () => ({ id: "n-1a" }) },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-1a", "Bận đột xuất");
  assert.equal(res.success, true);
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(booking.paymentStatus, "PAID");

  // Kiểm tra BookingItem có được xác nhận không:
  // Trên code cũ: bookingItemConfirmed là FALSE!
  assert.equal(bookingItemConfirmed, true, "LỖI A: BookingItem phải được cập nhật sang CONFIRMED khi đơn đủ tiền sau hủy HLV");
});

// --------------------------------------------------------------------------
// TÁI HIỆN LỖI 1B: sync bỏ qua voucher thường khi booking.paymentStatus đã là PAID
// --------------------------------------------------------------------------
test("TÁI HIỆN LỖI 1B: sync bỏ qua voucher thường chưa được ghi nhận nếu booking đã có paymentStatus = PAID", async () => {
  let voucherIncrementCount = 0;

  const booking = {
    id: "b-repro-1b",
    code: "DATSAN-1B",
    total: 200000,
    paymentStatus: "PAID", // Đã bị đánh dấu PAID bởi luồng hủy HLV
    status: "CONFIRMED",
    voucherId: "v-regular-1b",
    items: [],
  };

  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-1", cashApprovedAt: null },
    { id: "s-2", position: 2, amount: 100000, paymentId: "p-2", cashApprovedAt: null },
  ];

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-1b",
        bookingId: booking.id,
        booking,
        shares,
        intents: [],
      }),
      update: async () => ({}),
    },
    booking: {
      update: async ({ data }) => Object.assign(booking, data),
    },
    bookingItem: { updateMany: async () => ({ count: 0 }) },
    coachBooking: { updateMany: async () => ({ count: 0 }) },
    offerUsage: {
      findMany: async () => [],
      updateMany: async () => ({ count: 0 }),
    },
    adminAudit: {
      findFirst: async () => null, // Chưa từng có marker ghi nhận
      create: async () => ({ id: "aud-1" }),
    },
    voucher: {
      update: async ({ data }) => {
        if (data.usedCount?.increment) {
          voucherIncrementCount += data.usedCount.increment;
        }
        return {};
      },
    },
    groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
  };

  // Gọi sync
  await sync(mockTx, "g-1b");

  // Trên code cũ: voucherIncrementCount là 0 do wasAlreadyPaid = true
  assert.equal(voucherIncrementCount, 1, "LỖI B: Voucher thường chưa từng được ghi nhận phải được tăng usedCount kể cả khi booking đã là PAID");
});

// --------------------------------------------------------------------------
// TÁI HIỆN LỖI 2B: closeGroup bỏ sót phần hoàn tiền còn lại khi Payment đã ở REFUND_PENDING do HLV hủy
// --------------------------------------------------------------------------
test("TÁI HIỆN LỖI 2B: closeGroup bỏ sót hoàn tiền còn lại của Payment đang REFUND_PENDING do HLV hủy một phần", async () => {
  const booking = {
    id: "b-repro-2b",
    status: "PENDING_PAYMENT",
    paymentStatus: "PARTIALLY_PAID",
    total: 300000,
    items: [{ id: "i-1", date: new Date(Date.now() + 86400000), startMin: 600, endMin: 660 }],
  };

  // Payment p-1 ban đầu 200k, HLV hủy đã hoàn 50k -> status thành REFUND_PENDING, đã có GroupRefund 50k
  const payments = [
    { id: "p-1", bookingId: booking.id, amount: 200000, status: "REFUND_PENDING" },
  ];

  const existingRefunds = [
    { id: "gr-coach-cancel", paymentId: "p-1", amount: 50000, status: "PENDING", reason: "Hoàn phí HLV" },
  ];

  const createdRefunds = [];
  let updatedRefundAmount = 0;

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-2b",
        bookingId: booking.id,
        booking,
        shares: [],
        intents: [],
      }),
      update: async () => ({}),
    },
    payment: {
      // Code cũ: where: { bookingId: g.bookingId, status: "PAID" } -> Trả về [] vì p-1 là REFUND_PENDING!
      findMany: async ({ where }) => {
        if (where.status === "PAID") return [];
        return payments;
      },
      update: async () => ({}),
    },
    groupRefund: {
      findUnique: async ({ where }) => existingRefunds.find((r) => r.paymentId === where.paymentId) || null,
      create: async ({ data }) => {
        createdRefunds.push(data);
        return data;
      },
      update: async ({ where, data }) => {
        if (data.amount) updatedRefundAmount = data.amount;
        return data;
      },
    },
    groupPaymentIntent: { updateMany: async () => ({ count: 0 }) },
    bookingItem: { updateMany: async () => ({ count: 1 }) },
    coachBooking: { updateMany: async () => ({ count: 0 }) },
    offerUsage: { updateMany: async () => ({ count: 0 }) },
    booking: { update: async ({ data }) => Object.assign(booking, data) },
  };

  // Gọi closeGroup khi đơn hết hạn (rate = 1.0)
  await closeGroup(mockTx, "g-2b", true, "Hết hạn giữ sân");

  // Khách đã nạp 200.000đ, đã có refund 50.000đ, khi đơn hết hạn phải được hoàn nốt 150.000đ còn lại (tổng hoàn là 200.000đ)
  // Nhưng trên code cũ: do payment status là REFUND_PENDING, findMany({ where: { status: "PAID" } }) trả về rỗng!
  // Hoàn tiền bị bỏ qua hoàn toàn!
  const totalRefundForP1 = updatedRefundAmount || (createdRefunds.find((r) => r.paymentId === "p-1")?.amount || 0);
  assert.equal(totalRefundForP1, 200000, "LỖI 2B: Payment đã bị trừ 1 phần do HLV hủy phải được hoàn nốt phần còn lại khi hết hạn (tổng 200k)");
});
