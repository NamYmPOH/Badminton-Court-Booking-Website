import { z } from "zod";
import { PaymentError } from "./sepay";
import { isCashBooking } from "./booking-payment";

export function assertAdmin(user: { role: string; status: string } | null) {
  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") {
    throw new PaymentError(403, "Bạn không có quyền quản trị hệ thống.");
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin && origin !== new URL(request.url).origin)
  ) {
    throw new PaymentError(403, "Yêu cầu không đến từ website này.");
  }
}

const base = {
  id: z.string().min(1).max(100),
  reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
};
export const adminActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...base,
      action: z.literal("VENUE_STATUS"),
      status: z.enum(["ACTIVE", "SUSPENDED", "PENDING"]),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("USER_ACCESS"),
      role: z.enum(["CUSTOMER", "STAFF", "OWNER", "ADMIN"]),
      status: z.enum(["ACTIVE", "BLOCKED"]),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.enum([
        "CONFIRM",
        "CHECK_IN",
        "COMPLETE",
        "CANCEL",
        "CASH_PAID",
      ]),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("MATCH_RECEIPT"),
      bookingCode: z.string().regex(/^DATSAN\d{1,10}$/),
    })
    .strict(),
]);
export type AdminAction = z.infer<typeof adminActionSchema>;

// Không cho quản trị viên biến một đơn online chưa trả tiền thành đã xác nhận.
export function checkBookingAction(
  booking: {
    status: string;
    paymentStatus: string;
    expiresAt: Date | null;
    paymentMethod?: string | null;
    venue: { paymentMode: string };
  },
  action: string,
  now = new Date(),
) {
  const pendingLive =
    booking.status === "PENDING_PAYMENT" &&
    !!booking.expiresAt &&
    booking.expiresAt > now;
  const confirmed = booking.status === "CONFIRMED";
  const paid = booking.paymentStatus === "PAID";
  const atVenue = isCashBooking(booking);
  const permitted =
    action === "CONFIRM"
      ? pendingLive && (paid || atVenue)
      : action === "CHECK_IN"
        ? confirmed && paid
        : action === "COMPLETE"
          ? booking.status === "CHECKED_IN" && paid
          : action === "CANCEL"
            ? pendingLive || confirmed
            : action === "CASH_PAID"
              ? atVenue &&
                confirmed &&
                ["UNPAID", "PENDING"].includes(booking.paymentStatus)
              : false;
  if (!permitted)
    throw new PaymentError(
      409,
      "Trạng thái đơn không cho phép thao tác này. Kiểm tra thanh toán và hạn giữ sân.",
    );
}
