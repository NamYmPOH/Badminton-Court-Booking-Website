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

const {
  registerPartner,
  createPartnerOffer,
  submitPartnerOfferForReview,
  validateAndQuoteOffer,
} = require("../src/services/partner.service.ts");
const { createReservation, publicBooking } = require("../src/services/reservation.service.ts");
const { performAdminAction } = require("../src/services/admin.service.ts");

const future = new Date(Date.now() + 86400000);
const date = future.toISOString().slice(0, 10);

const baseVenue = {
  id: "venue-1",
  ownerId: "owner-1",
  status: "ACTIVE",
  openMin: 300,
  closeMin: 1320,
  advanceDays: 30,
  minBookingMin: 60,
  maxBookingMin: 240,
  courts: [{ id: "c1", name: "Sân 1", status: "ACTIVE" }],
  pricing: [
    {
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startMin: 300,
      endMin: 1320,
      walkInPrice: 150000,
    },
  ],
};

test("registerPartner creates PENDING partner with user as OWNER and rejects duplicate slug", async () => {
  let createdPartner = null;
  let createdMember = null;

  const mockDb = {
    $transaction: async (work) =>
      work({
        user: { findUnique: async () => ({ id: "user-1", status: "ACTIVE" }) },
        partner: {
          findUnique: async ({ where }) => (where.slug === "existing-slug" ? { id: "p-exist" } : null),
          create: async ({ data }) => {
            createdPartner = { id: "p-new", ...data };
            createdMember = data.members.create;
            return createdPartner;
          },
        },
      }),
  };

  const partner = await registerPartner(mockDb, "user-1", {
    name: "Yonex Official",
    slug: "yonex-official",
    description: "Nhà cung cấp thiết bị cầu lông",
    contactPhone: "0912345678",
    contactEmail: "contact@yonex.vn",
  });

  assert.equal(partner.status, "PENDING");
  assert.equal(partner.slug, "yonex-official");
  assert.equal(createdMember.userId, "user-1");
  assert.equal(createdMember.role, "OWNER");

  // Duplicate slug
  await assert.rejects(
    registerPartner(mockDb, "user-1", {
      name: "Yonex Replica",
      slug: "existing-slug",
    }),
    (e) => e.status === 409
  );
});

test("createPartnerOffer creates Voucher (inactive) and PartnerOffer (DRAFT), then submits", async () => {
  let createdVoucher = null;
  let createdOffer = null;

  const partner = { id: "partner-1", status: "ACTIVE" };
  const member = { id: "m-1", role: "OWNER" };

  const mockDb = {
    $transaction: async (work) =>
      work({
        partnerMember: { findUnique: async () => member },
        partner: { findUnique: async () => partner },
        voucher: {
          findUnique: async () => null,
          create: async ({ data }) => {
            createdVoucher = { id: "v-1", ...data };
            return createdVoucher;
          },
        },
        partnerOffer: {
          create: async ({ data }) => {
            createdOffer = { id: "po-1", ...data, voucher: createdVoucher, partner };
            return createdOffer;
          },
          findUnique: async () => createdOffer,
          update: async ({ data }) => Object.assign(createdOffer, data),
        },
      }),
  };

  const offer = await createPartnerOffer(mockDb, "user-1", {
    partnerId: "partner-1",
    title: "Giảm 30.000đ cho đơn từ 100k",
    budget: 3000000,
    maxUsage: 100,
    voucher: {
      code: "YONEX30K",
      type: "FIXED",
      value: 30000,
      minAmount: 100000,
      validFrom: "2026-10-15T00:00:00.000Z",
      validTo: "2026-11-15T23:59:59.000Z",
    },
  });

  assert.equal(offer.status, "DRAFT");
  assert.equal(createdVoucher.isActive, false); // Inactive until admin approval
  assert.equal(createdVoucher.code, "YONEX30K");

  // Submit for review
  const submitted = await submitPartnerOfferForReview(mockDb, "user-1", "po-1");
  assert.equal(submitted.status, "PENDING_REVIEW");
});

test("performAdminAction approves partner and offer with audit logging", async () => {
  let auditLogs = [];
  const partner = { id: "partner-1", name: "Yonex VN", status: "PENDING" };
  const offer = {
    id: "po-1",
    voucherId: "v-1",
    title: "Ưu đãi Yonex",
    status: "PENDING_REVIEW",
    partner,
    voucher: { id: "v-1", code: "YONEX30K", isActive: false },
  };

  const mockDb = {
    $transaction: async (work) =>
      work({
        user: {
          findUnique: async () => ({ id: "admin-1", name: "Quản Trị Viên", role: "ADMIN", status: "ACTIVE" }),
        },
        partner: {
          findUnique: async () => partner,
          update: async ({ data }) => Object.assign(partner, data),
        },
        partnerOffer: {
          findUnique: async () => offer,
          update: async ({ data }) => Object.assign(offer, data),
        },
        voucher: {
          update: async ({ data }) => Object.assign(offer.voucher, data),
        },
        adminAudit: {
          create: async ({ data }) => {
            auditLogs.push(data);
            return data;
          },
        },
      }),
  };

  // 1. Approve partner
  await performAdminAction(mockDb, "admin-1", {
    id: "partner-1",
    action: "PARTNER_STATUS",
    status: "ACTIVE",
    reason: "Thương hiệu chính hãng đầy đủ giấy phép",
  });
  assert.equal(partner.status, "ACTIVE");

  // 2. Approve offer -> activates voucher
  await performAdminAction(mockDb, "admin-1", {
    id: "po-1",
    action: "OFFER_STATUS",
    status: "ACTIVE",
    reason: "Ngân sách hợp lệ và điều kiện rõ ràng",
  });
  assert.equal(offer.status, "ACTIVE");
  assert.equal(offer.voucher.isActive, true);
  assert.equal(auditLogs.length, 2);
});

test("createReservation with voucher applies discount only to court and reserves offer budget", async () => {
  let createdBooking = null;
  const activeOffer = {
    id: "po-1",
    partnerId: "partner-1",
    title: "Yonex Giảm 30K",
    budget: 500000,
    usedBudget: 0,
    maxUsage: 50,
    currentUsage: 0,
    status: "ACTIVE",
    partner: { id: "partner-1", name: "Yonex VN", status: "ACTIVE" },
  };

  const validVoucher = {
    id: "v-1",
    code: "YONEX30K",
    type: "FIXED",
    value: 30000,
    minAmount: 100000,
    validFrom: new Date(Date.now() - 86400000),
    validTo: new Date(Date.now() + 86400000),
    isActive: true,
    partnerOffer: activeOffer,
  };

  const coach = {
    id: "coach-1",
    hourlyRate: 200000,
    status: "ACTIVE",
    user: { name: "HLV Minh Đức" },
  };

  const mockDb = {
    $transaction: async (work) =>
      work({
        booking: {
          findUnique: async () => null,
          count: async () => 0,
          create: async ({ data }) => {
            createdBooking = data;
            return {
              id: "b-offer",
              code: "DATSAN8888",
              ...data,
              items: data.items.create.map((item, idx) => ({
                id: `item-${idx}`,
                courtId: item.courtId,
                date: new Date(`${date}T00:00:00Z`),
                startMin: item.startMin,
                endMin: item.endMin,
                price: item.price,
                status: item.status,
                court: { name: "Sân 1" },
                coachBooking: item.coachBooking ? {
                  id: "cb-1",
                  coachId: item.coachBooking.create.coachId,
                  fee: item.coachBooking.create.fee,
                  status: "HELD",
                  coach: { user: { name: "HLV Minh Đức", phone: "0912345678" } },
                } : null,
              })),
              priceLines: data.priceLines.create.map((pl, idx) => ({ id: `pl-${idx}`, ...pl })),
              venue: { name: "Sân Cầu Lông Hà Nội", address: "123 Cầu Giấy", slug: "san-ha-noi" },
            };
          },
        },
        venue: { findUnique: async () => baseVenue },
        courtBlock: { findFirst: async () => null },
        bookingItem: { findFirst: async () => null },
        coachProfile: { findFirst: async () => coach },
        coachVenue: { findUnique: async () => ({ status: "ACTIVE" }) },
        coachAvailability: { findFirst: async () => ({ id: "avail-1" }) },
        coachBooking: { findFirst: async () => null },
        voucher: { findUnique: async () => validVoucher },
        offerUsage: { findMany: async () => [] },
      }),
  };

  const input = {
    requestId: "123e4567-e89b-12d3-a456-426614174999",
    venueId: "venue-1",
    coachId: "coach-1", // Phí HLV = 200.000đ
    voucherCode: "YONEX30K", // Giảm 30.000đ tiền sân
    date,
    customerName: "Khách VIP",
    customerPhone: "0912345678",
    slots: [
      { courtId: "c1", startMin: 600, endMin: 630 },
      { courtId: "c1", startMin: 630, endMin: 660 },
    ], // Tiền sân = 150.000đ
  };

  const booking = await createReservation(mockDb, "user-vip", input);

  // Subtotal = 150k (sân) + 200k (HLV) = 350.000đ
  assert.equal(createdBooking.subtotal, 350000);
  // Discount = 30.000đ (chỉ trừ vào tiền sân)
  assert.equal(createdBooking.discount, 30000);
  // Total = (150k - 30k) + 200k = 320.000đ
  assert.equal(createdBooking.total, 320000);

  // OfferUsage created with state RESERVED
  assert.equal(createdBooking.offerUsages.create.offerId, "po-1");
  assert.equal(createdBooking.offerUsages.create.discountAmount, 30000);
  assert.equal(createdBooking.offerUsages.create.state, "RESERVED");

  // PriceLines contains COURT, COACH, and DISCOUNT
  const lines = createdBooking.priceLines.create;
  assert.equal(lines.length, 3);
  assert.equal(lines.find((l) => l.type === "COURT").amount, 150000);
  assert.equal(lines.find((l) => l.type === "COACH").amount, 200000);
  assert.equal(lines.find((l) => l.type === "DISCOUNT").amount, 30000);
});

test("createReservation rejects voucher when offer budget is exhausted", async () => {
  const activeOffer = {
    id: "po-1",
    partnerId: "partner-1",
    title: "Yonex Giảm 50K",
    budget: 50000, // Budget only 50k
    status: "ACTIVE",
    partner: { status: "ACTIVE" },
  };

  const validVoucher = {
    id: "v-1",
    code: "YONEX50K",
    type: "FIXED",
    value: 50000,
    minAmount: 100000,
    validFrom: new Date(Date.now() - 86400000),
    validTo: new Date(Date.now() + 86400000),
    isActive: true,
    partnerOffer: activeOffer,
  };

  const mockDbExhausted = {
    $transaction: async (work) =>
      work({
        booking: { findUnique: async () => null, count: async () => 0 },
        venue: { findUnique: async () => baseVenue },
        courtBlock: { findFirst: async () => null },
        bookingItem: { findFirst: async () => null },
        voucher: { findUnique: async () => validVoucher },
        // Another reservation is already holding 50k -> budget exhausted!
        offerUsage: {
          findMany: async () => [{ discountAmount: 50000 }],
        },
      }),
  };

  const input = {
    requestId: "123e4567-e89b-12d3-a456-426614174888",
    venueId: "venue-1",
    voucherCode: "YONEX50K",
    date,
    customerName: "Khách Thử",
    customerPhone: "0912345678",
    slots: [
      { courtId: "c1", startMin: 600, endMin: 630 },
      { courtId: "c1", startMin: 630, endMin: 660 },
    ],
  };

  await assert.rejects(
    createReservation(mockDbExhausted, "user-test", input),
    (e) => e.status === 409 && e.message.includes("ngân sách")
  );
});
