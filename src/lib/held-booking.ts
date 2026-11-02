type HeldBooking = {
  userId: string | null;
  code: string;
  status: string;
  expiresAt: Date | null;
  group?: { inviteToken: string; closedAt: Date | null } | null;
};

/** Chỉ gửi đường dẫn thanh toán cho chủ đơn còn thời hạn giữ chỗ. */
export function heldBookingPaymentUrl(booking: HeldBooking, viewerId: string | null, now = new Date()): string | null {
  if (!viewerId || booking.userId !== viewerId || booking.status !== "PENDING_PAYMENT" || !booking.expiresAt || booking.expiresAt <= now) return null;
  if (booking.group) return booking.group.closedAt ? null : `/groups/${encodeURIComponent(booking.group.inviteToken)}`;
  return `/payment/result?booking=${encodeURIComponent(booking.code)}`;
}
