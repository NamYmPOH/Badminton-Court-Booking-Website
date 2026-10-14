import { z } from "zod";
import { PaymentError } from "./sepay";

export const MIN_PARTNER_BUDGET = 100_000;       // 100,000 VND
export const MAX_PARTNER_BUDGET = 1_000_000_000; // 1 tỷ VND

export const partnerProfileInputSchema = z.object({
  name: z.string().trim().min(2, "Tên thương hiệu tối thiểu 2 ký tự.").max(100, "Tên thương hiệu tối đa 100 ký tự."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug tối thiểu 2 ký tự.")
    .max(50, "Slug tối đa 50 ký tự.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang."),
  logoUrl: z.string().url("Đường dẫn logo không hợp lệ.").optional().nullable(),
  description: z.string().trim().max(1000, "Mô tả tối đa 1000 ký tự.").optional().nullable(),
  contactPhone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại không hợp lệ.")
    .optional()
    .nullable(),
  contactEmail: z.string().trim().email("Email không hợp lệ.").optional().nullable(),
}).strict();

export type PartnerProfileInput = z.infer<typeof partnerProfileInputSchema>;

export const partnerMemberInputSchema = z.object({
  partnerId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["OWNER", "MANAGER", "STAFF"]),
}).strict();

export type PartnerMemberInput = z.infer<typeof partnerMemberInputSchema>;

export const partnerOfferInputSchema = z.object({
  partnerId: z.string().min(1),
  title: z.string().trim().min(5, "Tiêu đề ưu đãi tối thiểu 5 ký tự.").max(120, "Tiêu đề tối đa 120 ký tự."),
  description: z.string().trim().max(1000, "Mô tả tối đa 1000 ký tự.").optional().nullable(),
  sponsor: z.enum(["PARTNER", "VENUE", "SYSTEM"]).default("PARTNER"),
  budget: z
    .number()
    .int("Ngân sách phải là số nguyên.")
    .min(MIN_PARTNER_BUDGET, `Ngân sách tối thiểu ${MIN_PARTNER_BUDGET.toLocaleString("vi-VN")}đ.`)
    .max(MAX_PARTNER_BUDGET, `Ngân sách tối đa ${MAX_PARTNER_BUDGET.toLocaleString("vi-VN")}đ.`),
  maxUsage: z.number().int().positive("Số lượt dùng tối đa phải lớn hơn 0.").optional().nullable(),
  voucher: z.object({
    code: z
      .string()
      .trim()
      .min(3, "Mã voucher từ 3 ký tự.")
      .max(20, "Mã voucher tối đa 20 ký tự.")
      .regex(/^[A-Z0-9_-]+$/, "Mã voucher chỉ gồm chữ hoa, số, dấu gạch ngang hoặc gạch dưới."),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.number().int().positive("Giá trị voucher phải lớn hơn 0."),
    maxDiscount: z.number().int().positive("Mức giảm tối đa phải lớn hơn 0.").optional().nullable(),
    minAmount: z.number().int().min(0, "Giá trị đơn tối thiểu không được âm.").default(0),
    validFrom: z.string().datetime({ message: "Ngày bắt đầu không hợp lệ (ISO 8601)." }),
    validTo: z.string().datetime({ message: "Ngày kết thúc không hợp lệ (ISO 8601)." }),
  }).refine((v) => {
    if (v.type === "PERCENT") return v.value >= 1 && v.value <= 100;
    return v.value >= 1_000 && v.value <= 10_000_000;
  }, {
    message: "Phần trăm giảm từ 1% đến 100%, hoặc số tiền giảm cố định từ 1.000đ đến 10.000.000đ.",
    path: ["value"],
  }).refine((v) => new Date(v.validTo).getTime() > new Date(v.validFrom).getTime(), {
    message: "Thời hạn kết thúc phải sau thời gian bắt đầu.",
    path: ["validTo"],
  }),
  terms: z.object({
    minTotal: z.number().int().min(0).optional(),
    maxDiscount: z.number().int().positive().optional(),
    applicableVenueIds: z.array(z.string()).optional(),
    daysOfWeek: z.array(z.number().int().min(1).max(7)).optional(),
  }).optional().nullable(),
}).strict();

export type PartnerOfferInput = z.infer<typeof partnerOfferInputSchema>;

export const partnerOfferStatusUpdateSchema = z.object({
  offerId: z.string().min(1),
  status: z.enum(["ACTIVE", "REJECTED", "PAUSED", "EXPIRED"]),
  reason: z.string().trim().min(5, "Ghi rõ lý do ít nhất 5 ký tự.").max(500),
}).strict();

export type PartnerOfferStatusUpdate = z.infer<typeof partnerOfferStatusUpdateSchema>;

// ───────────── Policy Check Functions ─────────────

export function assertPartnerActive(partner: { status: string } | null | undefined): asserts partner is { status: "ACTIVE" } {
  if (!partner || partner.status !== "ACTIVE") {
    throw new PaymentError(403, "Đối tác chưa được duyệt hoặc đang bị tạm ngưng.");
  }
}

export function assertPartnerMemberRole(
  member: { role: string } | null | undefined,
  allowedRoles: string[] = ["OWNER", "MANAGER"]
): void {
  if (!member || !allowedRoles.includes(member.role)) {
    throw new PaymentError(403, "Bạn không có quyền thực hiện thao tác này cho đối tác.");
  }
}

export function calculateOfferDiscount(
  voucher: { type: "PERCENT" | "FIXED"; value: number; maxDiscount?: number | null; minAmount: number },
  applicableCourtTotal: number
): number {
  if (applicableCourtTotal < voucher.minAmount) {
    return 0;
  }
  let discount = 0;
  if (voucher.type === "PERCENT") {
    discount = Math.floor((applicableCourtTotal * voucher.value) / 100);
    if (voucher.maxDiscount && voucher.maxDiscount > 0) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
  } else {
    discount = Math.min(voucher.value, applicableCourtTotal);
  }
  return Math.min(discount, applicableCourtTotal);
}
