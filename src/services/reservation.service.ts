import { randomInt } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { type BookingRequest, priceBooking } from "../lib/booking-request";
import { createVietQrUrl, PaymentError, type SepayConfig } from "../lib/sepay";
import { serializable } from "./sepay.service";
import { canPayBooking } from "../lib/booking-payment";

export const bookingDetails = { venue: true, items: { include: { court: true } } } satisfies Prisma.BookingInclude;
type StoredBooking = Prisma.BookingGetPayload<{ include: typeof bookingDetails }>;

export function publicBooking(booking: StoredBooking, config?: SepayConfig) {
  const expired = booking.status === "PENDING_PAYMENT" && (!booking.expiresAt || booking.expiresAt <= new Date());
  const payable = canPayBooking(booking);
  return {
    id: booking.id, code: booking.code, venueId: booking.venueId, venueName: booking.venue.name,
    venueAddress: booking.venue.address, venueSlug: booking.venue.slug,
    status: expired ? "EXPIRED" : booking.status, paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod === "CASH" ? "AT_VENUE" : "BANK_TRANSFER",
    canChoosePayment: payable,
    subtotal: booking.subtotal, discount: booking.discount, total: booking.total,
    contactName: booking.customerName, contactPhone: booking.customerPhone, note: booking.note,
    expiresAt: booking.expiresAt?.toISOString() || "", createdAt: booking.createdAt.toISOString(),
    items: booking.items.map(item => ({ ...item, date: item.date.toISOString().slice(0, 10), courtName: item.court.name, court: undefined })),
    qrUrl: payable && config ? createVietQrUrl(booking.total, booking.code, config) : null,
    bank: payable && config ? { name: config.SEPAY_BANK_GATEWAY, accountNo: config.BANK_ACCOUNT_NO, accountName: config.BANK_ACCOUNT_NAME } : null,
  };
}

export async function createReservation(db: PrismaClient, userId: string, input: BookingRequest) {
  return serializable(db, async tx => {
    const previous = await tx.booking.findUnique({ where: { requestId: input.requestId }, include: bookingDetails });
    if (previous) {
      if (previous.userId !== userId) throw new PaymentError(409, "Yêu cầu đặt sân không hợp lệ.");
      return previous;
    }
    const venue = await tx.venue.findUnique({ where: { id: input.venueId }, include: { courts: true, pricing: true } });
    // Không tự đưa sân minh họa vào DB và thu tiền khi cơ sở chưa được xác nhận.
    if (!venue || venue.status !== "ACTIVE") throw new PaymentError(409, "Cơ sở này chưa mở đặt sân trực tuyến.");
    const now = new Date();
    const { slots, total, date } = priceBooking(input, venue, now);
    const courtId = slots[0].courtId;
    const startMin = slots[0].startMin;
    const endMin = slots[slots.length - 1].endMin;
    const blocked = await tx.courtBlock.findFirst({ where: { courtId, date, startMin: { lt: endMin }, endMin: { gt: startMin } } });
    const conflict = await tx.bookingItem.findFirst({ where: {
      courtId, date, startMin: { lt: endMin }, endMin: { gt: startMin },
      status: { in: ["HELD", "CONFIRMED"] }, booking: { OR: [
        { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW"] } },
        { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
      ] },
    } });
    if (blocked || conflict) throw new PaymentError(409, "Khung giờ vừa được đặt hoặc đã khóa. Vui lòng chọn giờ khác.");
    const pendingCount = await tx.booking.count({ where: { userId, status: "PENDING_PAYMENT", expiresAt: { gt: now } } });
    if (pendingCount >= 3) throw new PaymentError(429, "Bạn đang có 3 đơn chờ thanh toán. Vui lòng hoàn tất đơn đang có.");
    const startTime = new Date(`${input.date}T${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}:00+07:00`);
    return tx.booking.create({ data: {
      requestId: input.requestId, code: `DATSAN${randomInt(1000000000, 10000000000)}`,
      userId, venueId: venue.id, customerName: input.customerName, customerPhone: input.customerPhone, note: input.note,
      subtotal: total, total, status: "PENDING_PAYMENT", paymentStatus: "PENDING", paymentMethod: "BANK_TRANSFER",
      expiresAt: new Date(Math.min(now.getTime() + 10 * 60 * 1000, startTime.getTime())),
      items: { create: slots.map(slot => ({ courtId, date, startMin: slot.startMin, endMin: slot.endMin, price: slot.price, status: "HELD" })) },
    }, include: bookingDetails });
  });
}

export async function choosePaymentMethod(db: PrismaClient, userId: string, code: string, method: "CASH" | "BANK_TRANSFER") {
  return serializable(db, async tx => {
    const booking = await tx.booking.findFirst({ where: { code, userId }, include: bookingDetails });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    if (!canPayBooking(booking)) throw new PaymentError(409, "Đơn đã thanh toán, hết hạn hoặc không còn được giữ. Vui lòng kiểm tra lại.");
    // Switching methods never extends the hold or marks a booking paid.
    return tx.booking.update({ where: { id: booking.id }, data: { paymentMethod: method }, include: bookingDetails });
  });
}
