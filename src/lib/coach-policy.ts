import { z } from "zod";
import { PaymentError } from "./payment-error";

export const MIN_HOURLY_RATE = 50_000;      // 50,000 VND / giờ
export const MAX_HOURLY_RATE = 5_000_000;   // 5,000,000 VND / giờ
export const MIN_SLOT_MINUTES = 30;
export const MAX_SLOT_MINUTES = 480;        // Tối đa 8 tiếng 1 ca

// Hằng số nhận diện hồ sơ HLV Demo thử nghiệm
export const DEMO_COACH_ID = "smashbook-demo-2000-coach";
export const DEMO_COACH_USER_ID = "smashbook-demo-2000-coach-user";
export const DEMO_COACH_NAME = "HLV Demo SmashBook — 2.000đ/giờ";
export const DEMO_COACH_HOURLY_RATE = 2_000; // 2,000 VND / giờ

/**
 * Kiểm tra xem một đối tượng hoặc ID có phải là HLV Demo được hệ thống bảo chứng không
 */
export function isDemoCoach(coach: { id?: string; userId?: string; name?: string } | string | null | undefined): boolean {
  if (!coach) return false;
  if (typeof coach === "string") {
    return coach === DEMO_COACH_ID || coach === DEMO_COACH_USER_ID;
  }
  return coach.id === DEMO_COACH_ID || coach.userId === DEMO_COACH_USER_ID || (!!coach.name && coach.name.includes("HLV Demo SmashBook"));
}

/** Danh mục 7 chuyên môn huấn luyện chuẩn dùng chung toàn hệ thống */
export const COACH_SPECIALTIES = [
  "Kỹ thuật cơ bản",
  "Nâng cao & Chiến thuật",
  "Đơn nam / Đơn nữ",
  "Đôi nam / Đôi nữ",
  "Đôi nam nữ phối hợp",
  "Rèn luyện thể lực",
  "Đào tạo thiếu nhi & thanh thiếu niên",
] as const;

export type CoachSpecialty = (typeof COACH_SPECIALTIES)[number];

export const COACH_SPECIALTY_ALIASES: Record<string, CoachSpecialty> = {
  "cơ bản": "Kỹ thuật cơ bản",
  "kỹ thuật cơ bản": "Kỹ thuật cơ bản",
  "nâng cao": "Nâng cao & Chiến thuật",
  "chiến thuật": "Nâng cao & Chiến thuật",
  "nâng cao & chiến thuật": "Nâng cao & Chiến thuật",
  "đơn nam": "Đơn nam / Đơn nữ",
  "đơn nữ": "Đơn nam / Đơn nữ",
  "đơn nam / đơn nữ": "Đơn nam / Đơn nữ",
  "đôi nam": "Đôi nam / Đôi nữ",
  "đôi nữ": "Đôi nam / Đôi nữ",
  "đôi nam / đôi nữ": "Đôi nam / Đôi nữ",
  "đôi nam nữ": "Đôi nam nữ phối hợp",
  "đôi nam nữ phối hợp": "Đôi nam nữ phối hợp",
  "thể lực": "Rèn luyện thể lực",
  "rèn luyện thể lực": "Rèn luyện thể lực",
  "thiếu nhi": "Đào tạo thiếu nhi & thanh thiếu niên",
  "thanh thiếu niên": "Đào tạo thiếu nhi & thanh thiếu niên",
  "đào tạo thiếu nhi & thanh thiếu niên": "Đào tạo thiếu nhi & thanh thiếu niên",
};

export function normalizeCoachSpecialty(item: string): string {
  if (!item || typeof item !== "string") return "";
  const clean = item.trim().toLowerCase();
  return COACH_SPECIALTY_ALIASES[clean] || item.trim();
}

export function normalizeCoachSpecialties(rawList: string[]): string[] {
  if (!Array.isArray(rawList)) return [];
  const set = new Set<string>();
  for (const s of rawList) {
    const norm = normalizeCoachSpecialty(s);
    if (norm) set.add(norm);
  }
  return Array.from(set);
}

export const coachProfileInputSchema = z.object({
  bio: z.string().trim().max(2000, "Giới thiệu tối đa 2000 ký tự.").optional().nullable(),
  specialties: z
    .array(z.string().trim().min(2, "Chuyên môn tối thiểu 2 ký tự.").max(50, "Chuyên môn tối đa 50 ký tự."))
    .min(1, "Hãy chọn ít nhất 1 chuyên môn.")
    .max(10, "Tối đa 10 chuyên môn."),
  experienceYears: z
    .number()
    .int("Số năm kinh nghiệm phải là số nguyên.")
    .min(0, "Kinh nghiệm tối thiểu 0 năm.")
    .max(50, "Kinh nghiệm tối đa 50 năm."),
  hourlyRate: z
    .number()
    .int("Giá theo giờ phải là số nguyên.")
    .refine(
      (val) => val === DEMO_COACH_HOURLY_RATE || (val >= MIN_HOURLY_RATE && val <= MAX_HOURLY_RATE),
      `Giá theo giờ phải từ ${MIN_HOURLY_RATE.toLocaleString("vi-VN")}đ đến ${MAX_HOURLY_RATE.toLocaleString("vi-VN")}đ/giờ (hoặc ${DEMO_COACH_HOURLY_RATE.toLocaleString("vi-VN")}đ cho tài khoản Demo).`
    ),
}).strict();

export type CoachProfileInput = z.infer<typeof coachProfileInputSchema>;

export const coachCertificateInputSchema = z.object({
  title: z.string().trim().min(2, "Tên chứng chỉ từ 2 ký tự.").max(100, "Tên chứng chỉ tối đa 100 ký tự."),
  fileKey: z.string().trim().min(5, "Đường dẫn tệp không hợp lệ.").max(255),
}).strict();

export type CoachCertificateInput = z.infer<typeof coachCertificateInputSchema>;

export const coachAvailabilityInputSchema = z.object({
  venueId: z.string().min(1, "Vui lòng chọn cơ sở hoạt động."),
  startsAt: z.string().datetime({ message: "Thời gian bắt đầu không hợp lệ (ISO 8601)." }),
  endsAt: z.string().datetime({ message: "Thời gian kết thúc không hợp lệ (ISO 8601)." }),
}).strict().refine((data) => {
  const start = new Date(data.startsAt).getTime();
  const end = new Date(data.endsAt).getTime();
  const diffMinutes = (end - start) / (1000 * 60);
  return diffMinutes >= MIN_SLOT_MINUTES && diffMinutes <= MAX_SLOT_MINUTES;
}, {
  message: `Thời lượng ca dạy phải từ ${MIN_SLOT_MINUTES} phút đến ${MAX_SLOT_MINUTES} phút.`,
  path: ["endsAt"],
});

export type CoachAvailabilityInput = z.infer<typeof coachAvailabilityInputSchema>;

export const coachStatusUpdateSchema = z.object({
  coachId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "REJECTED"]),
  reason: z.string().trim().min(5, "Lý do phê duyệt/từ chối tối thiểu 5 ký tự.").max(500),
}).strict();

export type CoachStatusUpdate = z.infer<typeof coachStatusUpdateSchema>;

export const coachVenueApprovalSchema = z.object({
  coachId: z.string().min(1),
  venueId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "REJECTED"]),
  reason: z.string().trim().min(5, "Lý do phê duyệt/từ chối/tạm ngừng tối thiểu 5 ký tự.").max(500),
}).strict();

export type CoachVenueApproval = z.infer<typeof coachVenueApprovalSchema>;

// ───────────── Policy Check Functions ─────────────

export function assertCoachActive(coach: { status: string } | null | undefined): asserts coach is { status: "ACTIVE" } {
  if (!coach || coach.status !== "ACTIVE") {
    throw new PaymentError(403, "Huấn luyện viên chưa được duyệt hoặc đang tạm ngưng hoạt động.");
  }
}

export function assertCoachOwner(
  coach: { userId: string } | null | undefined,
  currentUserId: string
): asserts coach is { userId: string } {
  if (!coach || coach.userId !== currentUserId) {
    throw new PaymentError(403, "Bạn không có quyền quản lý hồ sơ huấn luyện viên này.");
  }
}

export function assertNoOverlappingIntervals(
  intervals: Array<{ startsAt: Date | string; endsAt: Date | string }>
): void {
  const sorted = [...intervals].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = new Date(sorted[i].endsAt).getTime();
    const nextStart = new Date(sorted[i + 1].startsAt).getTime();
    if (currentEnd > nextStart) {
      throw new PaymentError(409, "Khung giờ bị chồng chéo với một khung giờ khác.");
    }
  }
}
