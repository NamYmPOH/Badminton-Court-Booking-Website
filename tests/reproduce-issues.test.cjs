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

// --------------------------------------------------------------------------
// TÁI HIỆN LỖI 1A: HLV hủy đơn nhóm làm đơn đủ tiền nhưng BookingItem vẫn HELD
// --------------------------------------------------------------------------
test("TÁI HIỆN LỖI 1A: HLV hủy đơn nhóm làm đơn đủ tiền nhưng BookingItem vẫn HELD", async () => {
  const db = fixture({ total: 400000, fee: 200000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(3).fill(100000), shares: Array.from({ length: 4 }, (_, i) => ({ amount: 100000, paymentId: i < 3 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.items[0].status, 'CONFIRMED');
  assert.equal(db.state.booking.status, 'CONFIRMED');
  assert.equal(db.state.booking.paymentStatus, 'PAID');
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
  const db = fixture({ amounts: [200000], paymentStatus: 'PARTIALLY_PAID', status: 'PENDING_PAYMENT', shares: [{ amount: 150000, paymentId: 'p0' }], refunds: [{ id: 'r', paymentId: 'p0', amount: 50000, completedAmount: 0, status: 'PENDING', reason: 'Hoàn phí HLV' }] });
  db.state.payments[0].status = 'REFUND_PENDING';
  await db.$transaction((tx) => closeGroup(tx, 'g', true, 'Hết hạn thanh toán nhóm'), { isolationLevel: 'Serializable' });
  assert.equal(db.state.refunds.length, 1);
  assert.equal(db.state.refunds[0].amount, 200000);
  assert.equal(db.state.refunds[0].completedAmount, 0);
  assert.equal(db.state.booking.paymentStatus, 'REFUND_PENDING');
});
