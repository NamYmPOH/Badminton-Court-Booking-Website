const fs = require("node:fs");
const ts = require("typescript");
const test = require("node:test");
const assert = require("node:assert/strict");

require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );

// Load các module cần kiểm thử
const { slotPrice } = require("../src/lib/booking.ts");
const { priceBooking } = require("../src/lib/booking-request.ts");
const { HOLD_TTL_SECONDS } = require("../src/lib/config/constants.ts");
const {
  calculateCancellationRefund,
  getVenueCancellationPolicy,
} = require("../src/services/policy.service.ts");
const {
  generateSingleTicketSignature,
  verifyTicketSignature,
  checkInWithTicket,
  issueBookingTicket,
} = require("../src/services/ticket.service.ts");
const {
  issueInternalInvoice,
  generateInvoiceNumber,
} = require("../src/services/invoice.service.ts");
const {
  startCourtSession,
  completeCourtSession,
  addCourtSurcharge,
  payCourtSurcharge,
} = require("../src/services/session.service.ts");
const {
  getVenueEffectiveHours,
  checkScheduleConflictWithBookings,
} = require("../src/services/schedule.service.ts");
const {
  createRefundRequest,
  completeManualRefund,
} = require("../src/services/refund.service.ts");
const { SepayGatewayAdapter } = require("../src/services/payment-gateway/sepay.adapter.ts");
const { splitAmounts } = require("../src/lib/group-payment.ts");

test("BR02: Thời gian giữ chỗ được cấu hình thống nhất 5 phút (300 giây)", () => {
  assert.equal(HOLD_TTL_SECONDS, 300, "HOLD_TTL_SECONDS phải chính xác là 300 giây (5 phút)");
});

test("BR03: Giá sân ưu tiên giá riêng từng sân (nếu có) trước giá chung cơ sở", () => {
  const venue = {
    openMin: 300,
    closeMin: 1320,
    pricingRules: [
      { courtId: null, daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startMin: 300, endMin: 1320, walkInPrice: 100000 },
      { courtId: "court-vip", daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startMin: 300, endMin: 1320, walkInPrice: 150000 },
    ],
  };

  const generalPrice = slotPrice(venue, "2026-10-25", 600, 630, "court-standard");
  assert.equal(generalPrice, 50000, "Sân thường áp dụng giá cơ sở 100.000đ/h -> 50.000đ/30p");

  const vipPrice = slotPrice(venue, "2026-10-25", 600, 630, "court-vip");
  assert.equal(vipPrice, 75000, "Sân VIP áp dụng giá riêng 150.000đ/h -> 75.000đ/30p");
});

test("BR04: Chính sách hoàn tiền theo phiên bản snapshot và mốc thời gian", () => {
  const booking = {
    total: 300000,
    subtotal: 300000,
    discount: 0,
    cancellationSnapshot: {
      freeCancelHours: 24,
      lateCancelHours: 4,
      partialRefundPercent: 50,
      allowCoachRefund: true,
    },
    items: [
      { date: "2026-10-25", startMin: 1080, coachBooking: { fee: 100000, status: "CONFIRMED" } }, // 18:00
    ],
    payments: [{ amount: 300000, status: "PAID" }],
    refundRequests: [],
  };

  // Mốc 1: Huỷ trước 25 tiếng (trước 24h) -> Hoàn 100% (cả tiền sân 200k và HLV 100k)
  const nowEarly = new Date("2026-10-24T17:00:00+07:00");
  const refundEarly = calculateCancellationRefund(booking, nowEarly);
  assert.equal(refundEarly.refundableAmount, 300000, "Hủy trước 24h hoàn 100%");
  assert.equal(refundEarly.courtRefund, 200000);
  assert.equal(refundEarly.coachRefund, 100000);
  assert.equal(refundEarly.refundPercent, 100);

  // Mốc 2: Huỷ trước 10 tiếng (trong khoảng 4h - 24h) -> Hoàn 50% tiền sân (100k), 0đ HLV
  const nowLate = new Date("2026-10-25T08:00:00+07:00");
  const refundLate = calculateCancellationRefund(booking, nowLate);
  assert.equal(refundLate.refundableAmount, 100000, "Hủy trong khoảng 4-24h hoàn 50% tiền sân");
  assert.equal(refundLate.courtRefund, 100000);
  assert.equal(refundLate.coachRefund, 0, "Hủy muộn không hoàn tiền HLV");
  assert.equal(refundLate.refundPercent, 50);

  // Mốc 3: Huỷ trước 2 tiếng (dưới 4h) -> Không hoàn tiền (0đ)
  const nowCritical = new Date("2026-10-25T16:00:00+07:00");
  const refundCritical = calculateCancellationRefund(booking, nowCritical);
  assert.equal(refundCritical.refundableAmount, 0, "Hủy dưới 4h không được hoàn tiền");
  assert.equal(refundCritical.isEligible, false);
});

test("BR04: Chống hoàn vượt mức thực thu (Partial Refund Cap)", async () => {
  const mockDb = {
    booking: {
      findUnique: async () => ({
        id: "b-1",
        code: "DATSAN123",
        payments: [{ amount: 200000, status: "PAID" }],
        refundRequests: [{ amount: 150000, status: "COMPLETED" }],
      }),
    },
  };

  // Yêu cầu hoàn 100k khi chỉ còn 50k hạn mức khả dụng -> Phải bị từ chối 400
  await assert.rejects(
    async () => {
      await createRefundRequest(mockDb, {
        bookingId: "b-1",
        requestedById: "u-1",
        amount: 100000,
        type: "PARTIAL_CANCELLATION",
        reason: "Yêu cầu hoàn tiền vượt hạn mức",
      });
    },
    (err) => err.status === 400 && err.message.includes("vượt quá hạn mức còn lại")
  );
});

test("BR05: Chia tiền nhóm (splitAmounts) bảo toàn tổng tiền", () => {
  const total = 350000;
  const count = 3;
  const shares = splitAmounts(total, count);
  assert.equal(shares.length, 3);
  assert.equal(shares.reduce((a, b) => a + b, 0), total);
  assert.deepEqual(shares, [116667, 116667, 116666]);
});

test("BR06: Vé điện tử QR có chữ ký HMAC, kiểm tra hiệu lực và chống quét lặp", async () => {
  const secret = "test-secret-hmac-key-for-ticket-123456789";
  const oldSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = secret;
  try {
    const ticket = { id: "tkt-1", ticketNonce: "nonce-xyz" };

    const sig = generateSingleTicketSignature(ticket.id, ticket.ticketNonce, secret);
    assert.ok(sig.startsWith("ST.tkt-1."));

    // Xác thực chữ ký hợp lệ
    assert.equal(verifyTicketSignature(sig, ticket, secret), true);

    // Chữ ký bị can thiệp -> Bị từ chối
    assert.equal(verifyTicketSignature(sig + "tampered", ticket, secret), false);

  // Quét vé: Chống quét lặp (Atomic condition update count = 0)
  let updatedCount = 1;
  const mockDb = {
    ticket: {
      findUnique: async () => ({
        id: "tkt-1",
        ticketCode: "TKT-20261025-ABCD",
        ticketNonce: "nonce-xyz",
        bookingId: "b-1",
        status: "UNUSED",
        validFrom: new Date(Date.now() - 10000),
        validTo: new Date(Date.now() + 60000),
        booking: { id: "b-1", venueId: "v-1", status: "CONFIRMED", items: [] },
      }),
      updateMany: async (args) => {
        if (args.where.status === "UNUSED") {
          const c = updatedCount;
          updatedCount = 0; // Sau lần đầu, không còn bản ghi UNUSED
          return { count: c };
        }
        return { count: 0 };
      },
      update: async () => ({}),
    },
    venue: { findFirst: async () => ({ id: "v-1" }) },
    courtSession: { findUnique: async () => null, create: async () => ({ id: "s-1" }) },
    booking: { update: async () => ({}) },
  };

  const operator = { id: "op-1", role: "STAFF", status: "ACTIVE" };

  // Lần 1: Thành công
  const res1 = await checkInWithTicket(mockDb, { qrPayload: sig, operator });
  assert.equal(res1.success, true);
  assert.equal(res1.ticket.status, "CHECKED_IN");

  // Lần 2 (quét lại hoặc đồng thời): Bị từ chối 409
  await assert.rejects(
    async () => {
      await checkInWithTicket(mockDb, { qrPayload: sig, operator });
    },
    (err) => err.status === 409 && err.message.includes("đã được quét")
  );
  } finally {
    process.env.AUTH_SECRET = oldSecret;
  }
});

test("Mục A: Hóa đơn nội bộ phát hành idempotent và lưu snapshot bất biến", async () => {
  let createdCount = 0;
  const mockDb = {
    internalInvoice: {
      findFirst: async () => (createdCount > 0 ? { id: "inv-1", invoiceNumber: "INV-20261021-123456", status: "ISSUED" } : null),
      create: async (args) => {
        createdCount++;
        return { id: "inv-1", ...args.data };
      },
    },
    booking: {
      findUnique: async () => ({
        id: "b-1",
        code: "DATSAN888",
        venueId: "v-1",
        customerName: "Nguyễn Văn Test",
        customerPhone: "0912345678",
        subtotal: 200000,
        discount: 20000,
        total: 180000,
        venue: { id: "v-1", name: "Sân Cầu Lông A", address: "Hà Nội", phone: "0900000000" },
        user: { email: "test@example.com" },
        voucher: { code: "GIAM20K" },
        items: [{ court: { name: "Sân 1" }, date: new Date("2026-10-25"), startMin: 600, endMin: 660, price: 200000 }],
        payments: [{ id: "p-1", provider: "BANK_TRANSFER", amount: 180000, status: "PAID", paidAt: new Date() }],
      }),
    },
  };

  // Lần 1: Tạo mới hóa đơn
  const inv1 = await issueInternalInvoice(mockDb, "b-1");
  assert.equal(createdCount, 1);
  assert.equal(inv1.status, "ISSUED");
  assert.equal(inv1.snapshot.disclaimer.includes("không thay thế hóa đơn điện tử GTGT"), true);

  // Lần 2: Trả về hóa đơn hiện tại, không tạo bản ghi mới (Idempotent)
  const inv2 = await issueInternalInvoice(mockDb, "b-1");
  assert.equal(createdCount, 1);
  assert.equal(inv2.id, "inv-1");
});

test("Mục B: Phiên sân (CourtSession) và phụ thu (Surcharge) tách biệt", async () => {
  let createdSessions = 0;
  let surcharges = [];
  const mockDb = {
    courtSession: {
      findUnique: async () =>
        createdSessions > 0
          ? {
              id: "sess-1",
              status: "ACTIVE",
              bookingId: "b-1",
              booking: { id: "b-1", venueId: "v-1" },
              surcharges,
            }
          : null,
      create: async (args) => {
        createdSessions++;
        return { id: "sess-1", ...args.data, surcharges: [] };
      },
      update: async (args) => ({ id: "sess-1", ...args.data }),
    },
    bookingItem: {
      findUnique: async () => ({ id: "bi-1", courtId: "c-1", bookingId: "b-1", status: "CONFIRMED", booking: { id: "b-1", venueId: "v-1", status: "CONFIRMED" } }),
      findMany: async () => [{ session: { status: "COMPLETED" } }],
    },
    booking: { update: async () => ({}) },
    courtSurcharge: {
      create: async (args) => {
        const row = { id: `sur-${surcharges.length + 1}`, ...args.data };
        surcharges.push(row);
        return row;
      },
      findUnique: async () => surcharges[0],
      update: async (args) => ({ ...surcharges[0], ...args.data }),
    },
  };

  // 1. Nhận sân
  const s1 = await startCourtSession(mockDb, { bookingItemId: "bi-1", operatorId: "op-1" });
  assert.equal(s1.status, "ACTIVE");

  // 2. Nhận sân lặp lại -> Trả về phiên hiện có (Idempotent)
  const s2 = await startCourtSession(mockDb, { bookingItemId: "bi-1", operatorId: "op-1" });
  assert.equal(s2.id, "sess-1");
  assert.equal(createdSessions, 1);

  // 3. Thêm phụ thu quá giờ 50.000đ
  const sur = await addCourtSurcharge(mockDb, {
    sessionId: "sess-1",
    createdById: "op-1",
    type: "OVERTIME",
    amount: 50000,
    reason: "Chơi quá giờ 30 phút",
  });
  assert.equal(sur.amount, 50000);
  assert.equal(sur.status, "UNPAID");

  // 4. Thu tiền phụ thu
  const paidSur = await payCourtSurcharge(mockDb, sur.id, "CASH");
  assert.equal(paidSur.status, "PAID");

  // 5. Kết thúc trả sân
  const completed = await completeCourtSession(mockDb, { sessionId: "sess-1", operatorId: "op-1" });
  assert.equal(completed.status, "COMPLETED");
  assert.ok(completed.checkOutAt);
});

test("Mục C: Lịch hoạt động ưu tiên Ngoại lệ > Lịch tuần > Giờ mặc định", async () => {
  const mockDb = {
    venue: { findUnique: async () => ({ id: "v-1", openMin: 360, closeMin: 1320 }) }, // 6:00 - 22:00
    venueDateException: {
      findUnique: async (args) => {
        if (args.where.venueId_date.date === "2026-12-25") {
          return { isClosed: true, reason: "Nghỉ lễ Giáng sinh" };
        }
        if (args.where.venueId_date.date === "2026-10-25") {
          return { isClosed: false, openMin: 480, closeMin: 1200 }; // Mở 8:00 - 20:00
        }
        return null;
      },
    },
    venueWeeklySchedule: {
      findUnique: async (args) => {
        if (args.where.venueId_dayOfWeek.dayOfWeek === 7) {
          // Chủ nhật
          return { isClosed: false, openMin: 420, closeMin: 1260 }; // 7:00 - 21:00
        }
        return null;
      },
    },
  };

  // Ca 1: Ngày nghỉ lễ ngoại lệ -> isOpen = false
  const h1 = await getVenueEffectiveHours(mockDb, "v-1", "2026-12-25");
  assert.equal(h1.isOpen, false);
  assert.equal(h1.source, "EXCEPTION");

  // Ca 2: Ngày có ngoại lệ mở đặc biệt -> openMin = 480
  const h2 = await getVenueEffectiveHours(mockDb, "v-1", "2026-10-25");
  assert.equal(h2.isOpen, true);
  assert.equal(h2.openMin, 480);
  assert.equal(h2.source, "EXCEPTION");

  // Ca 3: Ngày Chủ nhật không có ngoại lệ ngày nhưng có lịch tuần -> openMin = 420
  const h3 = await getVenueEffectiveHours(mockDb, "v-1", "2026-11-01"); // 2026-11-01 là Chủ nhật
  assert.equal(h3.isOpen, true);
  assert.equal(h3.openMin, 420);
  assert.equal(h3.source, "WEEKLY");

  // Ca 4: Ngày thường không có ngoại lệ cũng không có lịch tuần -> Giờ mặc định venue (360)
  const h4 = await getVenueEffectiveHours(mockDb, "v-1", "2026-11-02"); // 2026-11-02 là Thứ 2
  assert.equal(h4.isOpen, true);
  assert.equal(h4.openMin, 360);
  assert.equal(h4.source, "DEFAULT");
});

test("Mục D: Quy trình hoàn tiền thủ công kiểm soát (RefundRequest -> RefundTransaction)", async () => {
  let reqStatus = "REQUESTED";
  const mockDb = {
    refundRequest: {
      findUnique: async () => ({
        id: "rf-1",
        bookingId: "b-1",
        amount: 150000,
        status: reqStatus,
        booking: {
          payments: [{ amount: 150000, status: "PAID" }],
          refundRequests: [],
        },
      }),
      update: async (args) => {
        reqStatus = args.data.status;
        return { id: "rf-1", status: reqStatus };
      },
    },
    refundTransaction: {
      create: async (args) => ({ id: "tx-1", ...args.data }),
    },
    booking: { update: async () => ({}) },
  };

  const res = await completeManualRefund(mockDb, {
    requestId: "rf-1",
    processedById: "staff-1",
    bankRef: "FT261021998877",
    notes: "Đã hoàn tiền vào tài khoản Vietcombank",
  });

  assert.equal(res.request.status, "COMPLETED");
  assert.equal(res.transaction.bankRef, "FT261021998877");
  assert.equal(res.transaction.amount, 150000);
});

test("Mục E: SepayGatewayAdapter tuân thủ interface PaymentGateway và yêu cầu quy trình thủ công", async () => {
  process.env.SEPAY_WEBHOOK_SECRET = "0123456789abcdef0123456789abcdef";
  process.env.BANK_BIN = "970436";
  process.env.BANK_ACCOUNT_NO = "0123456789";
  process.env.BANK_ACCOUNT_NAME = "SMASHBOOK SPORT";
  process.env.SEPAY_BANK_GATEWAY = "Vietcombank";

  const adapter = new SepayGatewayAdapter();
  assert.equal(adapter.provider, "BANK_TRANSFER");
  assert.equal(adapter.supportsRefund(), false, "SePay chuyển khoản chưa hỗ trợ API refund tự động");

  const session = await adapter.createPaymentSession({
    bookingId: "b-1",
    bookingCode: "DATSAN123",
    amount: 150000,
    customerName: "Nguyễn Văn Test",
  });

  assert.ok(session.qrUrl.includes("vietqr.io"));
  assert.equal(session.bankInfo.bankName, "Vietcombank");

  const refundRes = await adapter.processRefund({
    bookingId: "b-1",
    bookingCode: "DATSAN123",
    amount: 150000,
    reason: "Khách hủy đơn",
  });

  assert.equal(refundRes.success, false);
  assert.equal(refundRes.status, "MANUAL_REQUIRED");
  assert.ok(refundRes.message.includes("hoàn thủ công"));
});
