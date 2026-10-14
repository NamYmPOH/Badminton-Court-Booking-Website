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
  partnerProfileInputSchema,
  partnerOfferInputSchema,
  partnerMemberInputSchema,
  assertPartnerActive,
  assertPartnerMemberRole,
  calculateOfferDiscount,
  MIN_PARTNER_BUDGET,
} = require("../src/lib/partner-policy.ts");

test("partnerProfileInputSchema enforces valid slug and format", () => {
  const valid = {
    name: "Yonex Vietnam",
    slug: "yonex-vietnam",
    logoUrl: "https://example.com/yonex.png",
    description: "Nhà tài trợ thiết bị cầu lông chính thức",
    contactPhone: "0912345678",
    contactEmail: "contact@yonex.vn",
  };
  assert.equal(partnerProfileInputSchema.safeParse(valid).success, true);

  // Invalid slug with uppercase or spaces
  assert.equal(
    partnerProfileInputSchema.safeParse({ ...valid, slug: "Yonex Vietnam" }).success,
    false
  );
  // Invalid phone
  assert.equal(
    partnerProfileInputSchema.safeParse({ ...valid, contactPhone: "12345" }).success,
    false
  );
  // Invalid email
  assert.equal(
    partnerProfileInputSchema.safeParse({ ...valid, contactEmail: "not-an-email" }).success,
    false
  );
});

test("partnerOfferInputSchema validates sponsor, budget and voucher definitions", () => {
  const validOffer = {
    partnerId: "partner-yonex",
    title: "Giảm 20% tiền sân cho hội viên Yonex",
    description: "Áp dụng cho mọi khung giờ tại hệ thống SmashBook",
    sponsor: "PARTNER",
    budget: 5000000,
    maxUsage: 100,
    voucher: {
      code: "YONEX20",
      type: "PERCENT",
      value: 20,
      maxDiscount: 50000,
      minAmount: 100000,
      validFrom: "2026-10-15T00:00:00.000Z",
      validTo: "2026-11-15T23:59:59.000Z",
    },
    terms: {
      minTotal: 100000,
      maxDiscount: 50000,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  };
  assert.equal(partnerOfferInputSchema.safeParse(validOffer).success, true);

  // Budget below MIN_PARTNER_BUDGET
  assert.equal(
    partnerOfferInputSchema.safeParse({ ...validOffer, budget: MIN_PARTNER_BUDGET - 1 }).success,
    false
  );

  // Percentage over 100%
  const invalidPercent = JSON.parse(JSON.stringify(validOffer));
  invalidPercent.voucher.value = 120;
  assert.equal(partnerOfferInputSchema.safeParse(invalidPercent).success, false);

  // Inverted valid dates
  const invalidDates = JSON.parse(JSON.stringify(validOffer));
  invalidDates.voucher.validFrom = "2026-11-15T00:00:00.000Z";
  invalidDates.voucher.validTo = "2026-10-15T00:00:00.000Z";
  assert.equal(partnerOfferInputSchema.safeParse(invalidDates).success, false);
});

test("assertPartnerActive and assertPartnerMemberRole enforce authorization", () => {
  assert.doesNotThrow(() => assertPartnerActive({ status: "ACTIVE" }));
  assert.throws(() => assertPartnerActive({ status: "PENDING" }), (e) => e.status === 403);
  assert.throws(() => assertPartnerActive({ status: "SUSPENDED" }), (e) => e.status === 403);
  assert.throws(() => assertPartnerActive(null), (e) => e.status === 403);

  assert.doesNotThrow(() => assertPartnerMemberRole({ role: "OWNER" }));
  assert.doesNotThrow(() => assertPartnerMemberRole({ role: "MANAGER" }));
  assert.throws(() => assertPartnerMemberRole({ role: "STAFF" }), (e) => e.status === 403);
  assert.throws(() => assertPartnerMemberRole(null), (e) => e.status === 403);
});

test("calculateOfferDiscount correctly computes percent, cap, and minimum threshold", () => {
  const percentVoucher = {
    type: "PERCENT",
    value: 20, // 20%
    maxDiscount: 40000, // Capped at 40k
    minAmount: 100000,  // Min bill 100k
  };

  // Bill under minAmount -> 0 discount
  assert.equal(calculateOfferDiscount(percentVoucher, 80000), 0);

  // Bill 150k -> 20% = 30k (< 40k cap)
  assert.equal(calculateOfferDiscount(percentVoucher, 150000), 30000);

  // Bill 300k -> 20% = 60k -> Capped at 40k
  assert.equal(calculateOfferDiscount(percentVoucher, 300000), 40000);

  // Fixed voucher 50k
  const fixedVoucher = {
    type: "FIXED",
    value: 50000,
    minAmount: 100000,
  };
  assert.equal(calculateOfferDiscount(fixedVoucher, 150000), 50000);
  // Total bill less than fixed voucher
  assert.equal(calculateOfferDiscount({ type: "FIXED", value: 50000, minAmount: 0 }, 30000), 30000);
});
