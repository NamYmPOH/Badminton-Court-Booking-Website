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
const { sync } = require("../src/services/group-payment.service.ts");
const { getMyPartners } = require("../src/services/partner.service.ts");

// -------------------------------------------------------------
// CA 1: Tổng đơn 400k, HLV 200k, 4 phần x 100k, đã thanh toán 3 phần
// Sau hủy HLV: tổng mới 200k, tổng các phần kỳ vọng 200k (không phải 300k)
// -------------------------------------------------------------
test("Hồi quy Ca 1: Tổng đơn 400k, phí HLV 200k, 4 phần x 100k, đã trả 3 phần -> Bảng chia phải khớp tổng mới 200k", async () => {
  const db = fixture({ total: 400000, fee: 200000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(3).fill(100000), shares: Array.from({ length: 4 }, (_, i) => ({ amount: 100000, paymentId: i < 3 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.booking.total, 200000);
  assert.equal(db.state.shares.reduce((s, r) => s + r.amount, 0), 200000);
  assert.equal(db.state.refunds.reduce((s, r) => s + r.amount, 0), 100000);
});

// -------------------------------------------------------------
// CA 2: Tổng đơn 400k, HLV 100k, 2 phần x 200k, đã trả 1 phần
// Còn phải thu 100k từ 1 người, splitAmounts không được từ chối count=1
// -------------------------------------------------------------
test("Hồi quy Ca 2: Tổng đơn 400k, phí HLV 100k, 2 phần x 200k, đã trả 1 phần -> Người còn lại phải trả 100k (không crash count=1)", async () => {
  const db = fixture({ total: 400000, fee: 100000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(1).fill(200000), shares: Array.from({ length: 2 }, (_, i) => ({ amount: 200000, paymentId: i < 1 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.booking.total, 300000);
  assert.equal(db.state.shares[1].amount, 100000);
});

// -------------------------------------------------------------
// CA 3: Tổng đơn 400k, HLV 200k, 4 phần x 100k, đã trả 2 phần (200k)
// Số còn phải thu = 0, các phần chưa trả phải về 0đ (không giữ số cũ 100k)
// -------------------------------------------------------------
test("Hồi quy Ca 3: Tổng đơn 400k, phí HLV 200k, 4 phần x 100k, đã trả 2 phần -> Các phần chưa trả phải về 0đ, tổng khớp 200k", async () => {
  const db = fixture({ total: 400000, fee: 200000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(2).fill(100000), shares: Array.from({ length: 4 }, (_, i) => ({ amount: 100000, paymentId: i < 2 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.booking.total, 200000);
  assert.deepEqual(db.state.shares.map((s) => s.amount), [100000, 100000, 0, 0]);
});

// -------------------------------------------------------------
// CA 4: Tổng đơn 400k, HLV 250k, 4 phần x 100k, đã trả 2 phần (200k)
// Tổng mới 150k, tổng các phần kỳ vọng 150k (không phải 350k)
// -------------------------------------------------------------
test("Hồi quy Ca 4: Tổng đơn 400k, phí HLV 250k, 4 phần x 100k, đã trả 2 phần -> Tổng mới 150k, tổng bảng chia phải khớp 150k", async () => {
  const db = fixture({ total: 400000, fee: 250000, status: 'PENDING_PAYMENT', paymentStatus: 'PARTIALLY_PAID', amounts: Array(2).fill(100000), shares: Array.from({ length: 4 }, (_, i) => ({ amount: 100000, paymentId: i < 2 ? 'p' + i : null })) });
  await cancelCoachBookingByCoach(db, "coach-user", "cb", "Bận việc đột xuất");
  assert.equal(db.state.booking.total, 150000);
  assert.deepEqual(db.state.shares.map((s) => s.amount), [75000, 75000, 0, 0]);
  assert.equal(db.state.refunds.reduce((s, r) => s + r.amount, 0), 50000);
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
