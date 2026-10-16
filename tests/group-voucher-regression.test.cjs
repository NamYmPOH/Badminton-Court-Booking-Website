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

const { sync, closeGroup } = require("../src/services/group-payment.service.ts");
const { validateAndQuoteOffer, auditOfferLedger } = require("../src/services/partner.service.ts");

test("Nhóm có cả HLV và voucher: trả online đủ tiền đồng bộ Booking PAID, CoachBooking CONFIRMED, OfferUsage CONSUMED và tăng bộ đếm", async () => {
  let coachBookingConfirmed = false;
  let offerUsageConsumed = false;
  let offerBudgetIncremented = 0;
  let offerUsageCountIncremented = 0;
  let voucherUsedCountIncremented = 0;

  const booking = {
    id: "b-group-combo",
    total: 300000,
    paymentStatus: "PENDING",
    status: "PENDING_PAYMENT",
    voucherId: "v-combo",
    items: [{ id: "item-1", courtId: "c1", date: new Date(), startMin: 600, endMin: 660 }],
  };

  const shares = [
    { id: "s-1", position: 1, amount: 150000, paymentId: "p-1", cashApprovedAt: null },
    { id: "s-2", position: 2, amount: 150000, paymentId: "p-2", cashApprovedAt: null },
  ];

  const offerUsage = {
    id: "ou-1",
    offerId: "po-combo",
    bookingId: "b-group-combo",
    discountAmount: 50000,
    state: "RESERVED",
    expiresAt: new Date(Date.now() + 300000),
  };

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-combo",
        bookingId: "b-group-combo",
        booking,
        shares,
        intents: [],
      }),
      update: async () => ({}),
    },
    booking: {
      update: async ({ data }) => {
        Object.assign(booking, data);
        return booking;
      },
    },
    bookingItem: { updateMany: async () => ({ count: 1 }) },
    coachBooking: {
      updateMany: async ({ data }) => {
        if (data.status === "CONFIRMED" && data.expiresAt === null) {
          coachBookingConfirmed = true;
        }
        return { count: 1 };
      },
    },
    offerUsage: {
      findMany: async ({ where }) => {
        if (where.state === "RESERVED" && offerUsage.state === "RESERVED") {
          return [offerUsage];
        }
        return [];
      },
      update: async ({ data }) => {
        if (data.state === "CONSUMED") {
          offerUsageConsumed = true;
          offerUsage.state = "CONSUMED";
        }
        return offerUsage;
      },
      updateMany: async () => ({ count: 1 }),
    },
    partnerOffer: {
      update: async ({ data }) => {
        if (data.usedBudget?.increment) offerBudgetIncremented += data.usedBudget.increment;
        if (data.currentUsage?.increment) offerUsageCountIncremented += data.currentUsage.increment;
        return {};
      },
    },
    voucher: {
      update: async ({ data }) => {
        if (data.usedCount?.increment) voucherUsedCountIncremented += data.usedCount.increment;
        return {};
      },
    },
    groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
  };

  // 1. Đồng bộ trả đủ tiền
  await sync(mockTx, "g-combo");

  // Khẳng định trạng thái
  assert.equal(booking.paymentStatus, "PAID");
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(coachBookingConfirmed, true, "CoachBooking phải chuyển sang CONFIRMED và bỏ expiresAt");
  assert.equal(offerUsageConsumed, true, "OfferUsage phải chuyển sang CONSUMED");
  assert.equal(offerBudgetIncremented, 50000, "usedBudget của PartnerOffer phải tăng đúng 50.000đ");
  assert.equal(offerUsageCountIncremented, 1, "currentUsage của PartnerOffer phải tăng đúng 1");
  assert.equal(voucherUsedCountIncremented, 1, "usedCount của Voucher phải tăng đúng 1");

  // 2. Retry / Webhook lặp: không tiêu thụ ưu đãi lần 2 (Idempotency)
  await sync(mockTx, "g-combo");
  assert.equal(offerBudgetIncremented, 50000, "Retry không được tăng thêm usedBudget");
  assert.equal(offerUsageCountIncremented, 1, "Retry không được tăng thêm currentUsage");
  assert.equal(voucherUsedCountIncremented, 1, "Retry không được tăng thêm usedCount");
});

test("Nhóm có voucher: duyệt tiền mặt giữ voucher vô thời hạn (expiresAt = null) và chưa tiêu thụ", async () => {
  let offerUsageExpiresNull = false;
  let coachBookingConfirmed = false;

  const booking = {
    id: "b-cash-group",
    total: 200000,
    paymentStatus: "PENDING",
    status: "PENDING_PAYMENT",
    voucherId: "v-cash",
    items: [{ id: "item-1", courtId: "c1", date: new Date(), startMin: 600, endMin: 660 }],
  };

  // 1 người đã trả online, 1 người được duyệt tiền mặt -> canConfirm = true
  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-1", cashApprovedAt: null },
    { id: "s-2", position: 2, amount: 100000, paymentId: null, cashApprovedAt: new Date() },
  ];

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-cash",
        bookingId: "b-cash-group",
        booking,
        shares,
        intents: [],
      }),
      update: async () => ({}),
    },
    booking: {
      update: async ({ data }) => {
        Object.assign(booking, data);
        return booking;
      },
    },
    bookingItem: { updateMany: async () => ({ count: 1 }) },
    coachBooking: {
      updateMany: async ({ data }) => {
        if (data.status === "CONFIRMED" && data.expiresAt === null) {
          coachBookingConfirmed = true;
        }
        return { count: 1 };
      },
    },
    offerUsage: {
      findMany: async () => [],
      updateMany: async ({ data }) => {
        if (data.expiresAt === null) offerUsageExpiresNull = true;
        return { count: 1 };
      },
    },
    groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
  };

  await sync(mockTx, "g-cash");

  // Duyệt tiền mặt: đơn được xác nhận nhưng chưa PAID
  assert.equal(booking.status, "CONFIRMED");
  assert.equal(booking.paymentStatus, "PARTIALLY_PAID");
  assert.equal(coachBookingConfirmed, true);
  assert.equal(offerUsageExpiresNull, true, "OfferUsage phải được giữ vô thời hạn (expiresAt = null)");
});

test("Nhóm có voucher: hết hạn hoặc hủy giải phóng toàn bộ OfferUsage (RELEASED) và lịch HLV (CANCELLED)", async () => {
  let offerUsageReleased = false;
  let coachBookingCancelled = false;

  const booking = {
    id: "b-expired-group",
    total: 200000,
    paymentStatus: "PENDING",
    status: "PENDING_PAYMENT",
    items: [],
  };

  const shares = [{ id: "s-1", amount: 200000, paymentId: null, cashApprovedAt: null }];

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-exp",
        bookingId: "b-expired-group",
        booking,
        shares,
        intents: [],
      }),
      update: async () => ({}),
    },
    booking: { update: async () => ({}) },
    bookingItem: { updateMany: async () => ({ count: 1 }) },
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
    payment: { findMany: async () => [] },
    groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
  };

  await closeGroup(mockTx, "g-exp", true, "Hết hạn giữ chỗ");
  assert.equal(coachBookingCancelled, true, "CoachBooking phải chuyển sang CANCELLED");
  assert.equal(offerUsageReleased, true, "OfferUsage phải chuyển sang RELEASED");
});

test("Quản lý ngân sách: Suất giữ tiền mặt (expiresAt = null) chiếm ngân sách, người sau xin giảm vượt phần còn lại bị từ chối 409", async () => {
  const offer = {
    id: "po-budget-test",
    title: "Ưu đãi 100K",
    budget: 100000, // Tổng ngân sách 100k
    usedBudget: 0,
    status: "ACTIVE",
    partner: { status: "ACTIVE" },
  };

  const voucher = {
    id: "v-budget-test",
    code: "GIAM60K",
    type: "FIXED",
    value: 60000,
    minAmount: 100000,
    validFrom: new Date(Date.now() - 86400000),
    validTo: new Date(Date.now() + 86400000),
    isActive: true,
    partnerOffer: offer,
  };

  // Đã có 1 suất duyệt tiền mặt (RESERVED với expiresAt = null) giữ 50.000đ
  const mockDbWithIndefiniteHold = {
    voucher: {
      findUnique: async () => voucher,
    },
    offerUsage: {
      findMany: async () => [
        { state: "RESERVED", discountAmount: 50000, expiresAt: null },
      ],
    },
  };

  // Người thứ 2 xin giảm 60.000đ -> 50.000đ (đang giữ) + 60.000đ = 110.000đ > 100.000đ ngân sách -> Bị từ chối 409!
  await assert.rejects(
    validateAndQuoteOffer(mockDbWithIndefiniteHold, "GIAM60K", "venue-1", 200000),
    (e) => e.status === 409 && e.message.includes("ngân sách")
  );
});

test("Quản lý ngân sách: Suất giữ hết hạn (expiresAt < now) không chiếm ngân sách", async () => {
  const offer = {
    id: "po-exp-budget",
    title: "Ưu đãi 100K",
    budget: 100000,
    usedBudget: 0,
    status: "ACTIVE",
    partner: { status: "ACTIVE" },
  };

  const voucher = {
    id: "v-exp-budget",
    code: "GIAM50K",
    type: "FIXED",
    value: 50000,
    minAmount: 100000,
    validFrom: new Date(Date.now() - 86400000),
    validTo: new Date(Date.now() + 86400000),
    isActive: true,
    partnerOffer: offer,
  };

  // Chỉ có 1 suất cũ đã hết hạn (expiresAt trong quá khứ)
  const mockDbWithExpiredHold = {
    voucher: {
      findUnique: async () => voucher,
    },
    offerUsage: {
      findMany: async () => [], // Prisma truy vấn expiresAt > now loại bỏ suất này
    },
  };

  // Người mới đặt vẫn được báo giá hợp lệ vì suất cũ đã hết hạn
  const quote = await validateAndQuoteOffer(mockDbWithExpiredHold, "GIAM50K", "venue-1", 150000);
  assert.equal(quote.valid, true);
  assert.equal(quote.discountAmount, 50000);
});

test("Đối soát chỉ đọc: auditOfferLedger phát hiện sự không đồng nhất giữa usedBudget và sổ OfferUsage mà không sửa dữ liệu", async () => {
  const offer = {
    id: "po-discrepancy",
    partnerId: "part-1",
    title: "Ưu đãi Đối soát",
    budget: 500000,
    usedBudget: 200000, // Bộ đếm ghi 200.000đ
    currentUsage: 2,
    status: "ACTIVE",
    partner: { name: "Thương hiệu ABC" },
    voucher: { code: "VOUCHER100K" },
  };

  // Sổ OfferUsage thực tế mới chỉ có 1 bản ghi CONSUMED 100.000đ -> Lệch 100.000đ
  const usages = [
    { state: "CONSUMED", discountAmount: 100000, expiresAt: null },
    { state: "RESERVED", discountAmount: 50000, expiresAt: null },
  ];

  const mockDb = {
    partnerOffer: {
      findUnique: async () => offer,
    },
    offerUsage: {
      findMany: async () => usages,
    },
  };

  const audit = await auditOfferLedger(mockDb, "po-discrepancy");
  assert.equal(audit.isConsistent, false);
  assert.equal(audit.budgetDiscrepancy, 100000, "Phát hiện lệch ngân sách 100.000đ");
  assert.equal(audit.usageDiscrepancy, 1, "Phát hiện lệch 1 lượt dùng");
  assert.equal(audit.activeReservedBudget, 50000);
  assert.equal(audit.availableBudget, 250000); // 500k - max(200k, 100k) - 50k = 250k
});
