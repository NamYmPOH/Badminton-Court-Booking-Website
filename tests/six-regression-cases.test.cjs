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
const { sync } = require("../src/services/group-payment.service.ts");
const { getMyPartners } = require("../src/services/partner.service.ts");

// -------------------------------------------------------------
// CA 1: Tổng đơn 400k, HLV 200k, 4 phần x 100k, đã thanh toán 3 phần
// Sau hủy HLV: tổng mới 200k, tổng các phần kỳ vọng 200k (không phải 300k)
// -------------------------------------------------------------
test("Hồi quy Ca 1: Tổng đơn 400k, phí HLV 200k, 4 phần x 100k, đã trả 3 phần -> Bảng chia phải khớp tổng mới 200k", async () => {
  const booking = {
    id: "b-ca-1",
    code: "DATSAN-CA-1",
    userId: "lead-1",
    paymentStatus: "PARTIALLY_PAID",
    subtotal: 400000,
    total: 400000,
  };

  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-1" },
    { id: "s-2", position: 2, amount: 100000, paymentId: "p-2" },
    { id: "s-3", position: 3, amount: 100000, paymentId: "p-3" },
    { id: "s-4", position: 4, amount: 100000, paymentId: null },
  ];

  const coachBooking = {
    id: "cb-1",
    coachId: "c-1",
    fee: 200000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const payments = [
    { id: "p-1", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-1" },
    { id: "p-2", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-2" },
    { id: "p-3", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-3" },
  ];
  const groupRefunds = [];

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-1", userId: "u-coach" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-1", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        notification: { create: async () => ({ id: "n-1" }) },
        payment: {
          findUnique: async ({ where }) => payments.find((p) => p.txnRef === where.txnRef) || null,
          findMany: async () => payments,
          create: async ({ data }) => {
            payments.push(data);
            return data;
          },
          update: async ({ where, data }) => {
            const p = payments.find((item) => item.id === where.id);
            if (p) Object.assign(p, data);
            return p;
          },
        },
        groupRefund: {
          create: async ({ data }) => {
            groupRefunds.push(data);
            return data;
          },
        },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-1", "Bận đột xuất");
  assert.equal(res.success, true);
  assert.equal(booking.total, 200000);

  const sumShares = shares.reduce((sum, s) => sum + s.amount, 0);
  // Khi lỗi tồn tại: sumShares = 300000
  assert.equal(sumShares, 200000, `Tổng các phần (${sumShares}) phải bằng tổng mới 200.000đ`);
});

// -------------------------------------------------------------
// CA 2: Tổng đơn 400k, HLV 100k, 2 phần x 200k, đã trả 1 phần
// Còn phải thu 100k từ 1 người, splitAmounts không được từ chối count=1
// -------------------------------------------------------------
test("Hồi quy Ca 2: Tổng đơn 400k, phí HLV 100k, 2 phần x 200k, đã trả 1 phần -> Người còn lại phải trả 100k (không crash count=1)", async () => {
  const booking = {
    id: "b-ca-2",
    code: "DATSAN-CA-2",
    userId: "lead-2",
    paymentStatus: "PARTIALLY_PAID",
    subtotal: 400000,
    total: 400000,
  };

  const shares = [
    { id: "s-1", position: 1, amount: 200000, paymentId: "p-1" },
    { id: "s-2", position: 2, amount: 200000, paymentId: null },
  ];

  const coachBooking = {
    id: "cb-2",
    coachId: "c-2",
    fee: 100000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-2", userId: "u-coach" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-2", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        notification: { create: async () => ({ id: "n-2" }) },
      }),
  };

  // Khi lỗi tồn tại: splitAmounts ném 400 "Số người hoặc tổng tiền không hợp lệ" do count=1
  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-2", "Bận đột xuất");
  assert.equal(res.success, true);
  assert.equal(booking.total, 300000);
  assert.equal(shares[1].amount, 100000, "Phần chưa trả còn lại phải được điều chỉnh về 100.000đ");
});

// -------------------------------------------------------------
// CA 3: Tổng đơn 400k, HLV 200k, 4 phần x 100k, đã trả 2 phần (200k)
// Số còn phải thu = 0, các phần chưa trả phải về 0đ (không giữ số cũ 100k)
// -------------------------------------------------------------
test("Hồi quy Ca 3: Tổng đơn 400k, phí HLV 200k, 4 phần x 100k, đã trả 2 phần -> Các phần chưa trả phải về 0đ, tổng khớp 200k", async () => {
  const booking = {
    id: "b-ca-3",
    code: "DATSAN-CA-3",
    userId: "lead-3",
    paymentStatus: "PARTIALLY_PAID",
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
    id: "cb-3",
    coachId: "c-3",
    fee: 200000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-3", userId: "u-coach" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-3", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        notification: { create: async () => ({ id: "n-3" }) },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-3", "Bận đột xuất");
  assert.equal(res.success, true);
  assert.equal(booking.total, 200000);

  const sumShares = shares.reduce((sum, s) => sum + s.amount, 0);
  // Khi lỗi tồn tại: sumShares = 400.000đ (s-3, s-4 vẫn giữ 100.000đ)
  assert.equal(sumShares, 200000, `Tổng các phần (${sumShares}) phải bằng tổng mới 200.000đ`);
  assert.equal(shares[2].amount, 0, "Phần s-3 chưa trả phải về 0đ");
  assert.equal(shares[3].amount, 0, "Phần s-4 chưa trả phải về 0đ");
});

// -------------------------------------------------------------
// CA 4: Tổng đơn 400k, HLV 250k, 4 phần x 100k, đã trả 2 phần (200k)
// Tổng mới 150k, tổng các phần kỳ vọng 150k (không phải 350k)
// -------------------------------------------------------------
test("Hồi quy Ca 4: Tổng đơn 400k, phí HLV 250k, 4 phần x 100k, đã trả 2 phần -> Tổng mới 150k, tổng bảng chia phải khớp 150k", async () => {
  const booking = {
    id: "b-ca-4",
    code: "DATSAN-CA-4",
    userId: "lead-4",
    paymentStatus: "PARTIALLY_PAID",
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
    id: "cb-4",
    coachId: "c-4",
    fee: 250000,
    status: "CONFIRMED",
    bookingItem: { booking },
  };

  const payments = [
    { id: "p-1", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-1" },
    { id: "p-2", bookingId: booking.id, amount: 100000, status: "PAID", txnRef: "TX-2" },
  ];

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "c-4", userId: "u-coach" }) },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        booking: { update: async ({ data }) => Object.assign(booking, data) },
        bookingPriceLine: { deleteMany: async () => {} },
        bookingGroup: { findUnique: async () => ({ id: "g-4", bookingId: booking.id, shares }) },
        groupShare: {
          update: async ({ where, data }) => {
            const s = shares.find((item) => item.id === where.id);
            if (s) Object.assign(s, data);
            return s;
          },
        },
        groupPaymentIntent: { updateMany: async () => ({ count: 1 }) },
        notification: { create: async () => ({ id: "n-4" }) },
        payment: {
          findUnique: async ({ where }) => payments.find((p) => p.txnRef === where.txnRef) || null,
          findMany: async () => payments,
          create: async ({ data }) => {
            payments.push(data);
            return data;
          },
          update: async ({ where, data }) => {
            const p = payments.find((item) => item.id === where.id);
            if (p) Object.assign(p, data);
            return p;
          },
        },
        groupRefund: { create: async ({ data }) => data },
      }),
  };

  const res = await cancelCoachBookingByCoach(mockDb, "u-coach", "cb-4", "Bận đột xuất");
  assert.equal(res.success, true);
  assert.equal(booking.total, 150000);

  const sumShares = shares.reduce((sum, s) => sum + s.amount, 0);
  // Khi lỗi tồn tại: sumShares = 350000 (s-1, s-2 giảm xuống 75k, nhưng s-3, s-4 vẫn 100k!)
  assert.equal(sumShares, 150000, `Tổng các phần (${sumShares}) phải bằng tổng mới 150.000đ`);
});

// -------------------------------------------------------------
// CA 5: Đơn nhóm có voucherId thường (không OfferUsage) thanh toán đủ
// Gọi sync 2 lần -> Voucher.usedCount phải tăng đúng 1 lần (idempotent)
// -------------------------------------------------------------
test("Hồi quy Ca 5: Đơn nhóm có voucher thường (không có OfferUsage) trả đủ -> Voucher.usedCount tăng đúng 1 lần sau nhiều lần sync", async () => {
  let voucherIncrementCount = 0;

  const booking = {
    id: "b-voucher-regular",
    total: 200000,
    paymentStatus: "PENDING",
    status: "PENDING_PAYMENT",
    voucherId: "v-reg-1",
    items: [],
  };

  const shares = [
    { id: "s-1", position: 1, amount: 100000, paymentId: "p-1", cashApprovedAt: null },
    { id: "s-2", position: 2, amount: 100000, paymentId: "p-2", cashApprovedAt: null },
  ];

  const mockTx = {
    bookingGroup: {
      findUniqueOrThrow: async () => ({
        id: "g-vreg",
        bookingId: "b-voucher-regular",
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
    coachBooking: { updateMany: async () => ({ count: 0 }) },
    offerUsage: {
      findMany: async () => [], // Không có ưu đãi đối tác (OfferUsage)
      updateMany: async () => ({ count: 0 }),
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

  // Sync lần 1: Đủ tiền
  await sync(mockTx, "g-vreg");
  // Khi lỗi tồn tại: voucherIncrementCount = 0 do phụ thuộc usages.length > 0
  assert.equal(voucherIncrementCount, 1, "Voucher thường phải được tăng usedCount đúng 1 lần khi đơn nhóm trả đủ");

  // Sync lần 2 (Webhook/retry): Không được tăng lặp
  await sync(mockTx, "g-vreg");
  assert.equal(voucherIncrementCount, 1, "Gọi sync lặp lại không được tăng usedCount lần 2 (Idempotent)");
});

// -------------------------------------------------------------
// CA 6: getMyPartners trả { memberId, role, partner: { id, status } }
// Giao diện đọc p.id, p.status, p.myRole -> Hợp đồng dữ liệu phải khớp
// -------------------------------------------------------------
test("Hồi quy Ca 6: getMyPartners và GET /api/partner/profile phải cung cấp id, status, myRole trực tiếp khớp giao diện", async () => {
  const mockPartners = [
    {
      id: "pm-1",
      userId: "u-1",
      role: "OWNER",
      partner: {
        id: "part-123",
        name: "Yonex Vietnam",
        slug: "yonex-vn",
        logoUrl: "https://example.com/logo.png",
        description: "Đối tác chính thức",
        contactEmail: "yonex@example.com",
        contactPhone: "0901234567",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];

  const mockDb = {
    partnerMember: {
      findMany: async () => mockPartners,
    },
  };

  const partners = await getMyPartners(mockDb, "u-1");
  assert.ok(Array.isArray(partners) && partners.length > 0);

  // Khi lỗi tồn tại: partners[0] là { memberId, role, partner }, không có partners[0].id hay partners[0].status hay partners[0].myRole
  const p = partners[0];
  assert.equal(p.id, "part-123", "p.id phải là partnerId để frontend chọn và truyền API đúng");
  assert.equal(p.status, "ACTIVE", "p.status phải là partner.status để frontend nhận biết ACTIVE");
  assert.equal(p.myRole, "OWNER", "p.myRole phải là vai trò của thành viên");
});
