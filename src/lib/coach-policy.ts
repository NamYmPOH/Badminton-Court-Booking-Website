import { z } from "zod";
import { PaymentError } from "./sepay";

export const MIN_HOURLY_RATE = 50_000;      // 50,000 VND / giờ
export const MAX_HOURLY_RATE = 5_000_000;   // 5,000,000 VND / giờ
export const MIN_SLOT_MINUTES = 30;
export const MAX_SLOT_MINUTES = 480;        // Tối đa 8 tiếng 1 ca

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
    .min(MIN_HOURLY_RATE, `Giá tối thiểu ${MIN_HOURLY_RATE.toLocaleString("vi-VN")}đ/giờ.`)
    .max(MAX_HOURLY_RATE, `Giá tối đa ${MAX_HOURLY_RATE.toLocaleString("vi-VN")}đ/giờ.`),
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
  status: z.enum(["ACTIVE", "REJECTED"]),
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
