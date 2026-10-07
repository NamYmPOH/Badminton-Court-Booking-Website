import { Prisma, type PrismaClient } from "@prisma/client";
import { eventFingerprint, extractBookingCode, PaymentError, type SepayConfig, type SepayEvent } from "../lib/sepay";

// Retry transaction bị tranh chấp; không gọi dịch vụ ngoài khi đang giữ transaction.
export async function serializable<T>(db: PrismaClient, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 5000 });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (attempt >= 2 || !["P2034", "P2002"].includes(code || "")) throw error;
    }
  }
}

export async function receiveSepayPayment(db: PrismaClient, event: SepayEvent, config: SepayConfig) {
  const transactionId = String(event.id);
  const fingerprint = eventFingerprint(event);
  const code = extractBookingCode(event.content);
  return serializable(db, async tx => {
    const previous = await tx.sepayReceipt.findUnique({ where: { transactionId } });
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new PaymentError(409, "ID giao dịch trùng nhưng dữ liệu khác.");
      return { result: "DUPLICATE", originalResult: previous.result };
    }
    let result = "REVIEW_BOOKING_CODE";
    if (event.transferType !== "in") result = "IGNORED_OUTGOING";
    else if (event.accountNumber !== config.BANK_ACCOUNT_NO
      || event.gateway.toLowerCase() !== config.SEPAY_BANK_GATEWAY.toLowerCase()
      || (config.SEPAY_SUB_ACCOUNT && event.subAccount !== config.SEPAY_SUB_ACCOUNT)) result = "REVIEW_WRONG_ACCOUNT";
    else if (code) {
      const booking = await tx.booking.findUnique({ where: { code }, include: { items: true } });
      const now = new Date();
      if (!booking) result = "REVIEW_BOOKING_NOT_FOUND";
      else if (booking.status !== "PENDING_PAYMENT" || !["PENDING", "UNPAID"].includes(booking.paymentStatus)) result = "REVIEW_BOOKING_NOT_PENDING";
      else if (!booking.expiresAt || booking.expiresAt <= now) result = "REVIEW_EXPIRED";
      else if (booking.total !== event.transferAmount) result = "REVIEW_AMOUNT_MISMATCH";
      else if (!booking.items.length || booking.items.some(item => item.status !== "HELD")) result = "REVIEW_SLOT_RELEASED";
      else {
        // Cập nhật có điều kiện chống hai giao dịch cùng xác nhận một booking.
        const updated = await tx.booking.updateMany({
          where: { id: booking.id, status: "PENDING_PAYMENT", paymentStatus: { in: ["UNPAID", "PENDING"] }, expiresAt: { gt: now }, total: event.transferAmount },
          data: { status: "CONFIRMED", paymentStatus: "PAID", expiresAt: null },
        });
        if (updated.count !== 1) result = "REVIEW_BOOKING_NOT_PENDING";
        else {
          await tx.bookingItem.updateMany({ where: { bookingId: booking.id, status: "HELD" }, data: { status: "CONFIRMED" } });
          await tx.payment.create({ data: {
            bookingId: booking.id, provider: "BANK_TRANSFER", amount: booking.total,
            status: "PAID", txnRef: `SEPAY-${transactionId}`, providerTxnNo: transactionId,
            paidAt: now, rawPayload: event as Prisma.InputJsonObject,
          } });
          result = "PAID";
        }
      }
    }
    // Ghi nhận cả giao dịch cần đối soát; commit receipt và booking cùng lúc rồi mới ACK.
    await tx.sepayReceipt.create({ data: { transactionId, fingerprint, bookingCode: code, result, payload: event as Prisma.InputJsonObject } });
    return { result };
  });
}
