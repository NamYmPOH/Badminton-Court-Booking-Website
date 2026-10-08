type PaymentBooking = {
  status: string; paymentStatus: string; expiresAt: Date | null;
  items: { status: string; date: Date; startMin: number }[];
};

export function canPayBooking(booking: PaymentBooking, now = new Date()) {
  if (!["UNPAID", "PENDING"].includes(booking.paymentStatus) || !booking.items.length) return false;
  if (booking.status === "PENDING_PAYMENT") {
    return !!booking.expiresAt && booking.expiresAt > now && booking.items.every(i => i.status === "HELD");
  }
  // Existing confirmed reservations may also pay online before their first playing slot.
  return booking.status === "CONFIRMED" && booking.items.every(i => i.status === "CONFIRMED" &&
    new Date(i.date.toISOString().slice(0, 10) + "T00:00:00+07:00").getTime() + i.startMin * 60000 > now.getTime());
}

export function isCashBooking(booking: { paymentMethod?: string | null; venue: { paymentMode: string } }) {
  return booking.paymentMethod === "CASH" || (!booking.paymentMethod && booking.venue.paymentMode === "AT_VENUE");
}
