import { Prisma, type PrismaClient } from "@prisma/client";
import { eventFingerprint, extractBookingCode, PaymentError, type SepayConfig, type SepayEvent } from "../lib/sepay";
import { canPayBooking } from "../lib/booking-payment";

import { serializable } from "../lib/transaction";
import { extractGroupCode } from "../lib/group-payment";
import { settleGroupTransfer } from "./group-payment.service";
export { serializable } from "../lib/transaction";

export async function receiveSepayPayment(db: PrismaClient, event: SepayEvent, config: SepayConfig) {
  const transactionId = String(event.id);
  const fingerprint = eventFingerprint(event);
  const groupCode = extractGroupCode(event.content);
  const hasGroupReference = /GP[A-F0-9]{24}/i.test(event.content);
  const code = hasGroupReference ? null : extractBookingCode(event.content);
  let receiptBookingCode = code;
  return serializable(db, async tx => {
    const previous = await tx.sepayReceipt.findUnique({ where: { transactionId } });
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new PaymentError(409, "ID giao dịch trùng nhưng dữ liệu khác.");
      return { result: "DUPLICATE", originalResult: previous.result };
    }
    let result = "REVIEW_BOOKING_CODE";
    if (event.transferType !== "in") result = "IGNORED_OUTGOING";
    else if (groupCode) {
      const outcome = await settleGroupTransfer(tx, groupCode, event);
      result = outcome.result; receiptBookingCode = outcome.bookingCode;
    }
    else if (hasGroupReference) result = "REVIEW_GROUP_CODE";
    else if (event.accountNumber !== config.BANK_ACCOUNT_NO
      || event.gateway.toLowerCase() !== config.SEPAY_BANK_GATEWAY.toLowerCase()
      || (config.SEPAY_SUB_ACCOUNT && event.subAccount !== config.SEPAY_SUB_ACCOUNT)) result = "REVIEW_WRONG_ACCOUNT";
    else if (code) {
      const booking = await tx.booking.findUnique({ where: { code }, include: { items: true, group: true } });
      const now = new Date();
      if (!booking) result = "REVIEW_BOOKING_NOT_FOUND";
      else if (booking.group) result = "REVIEW_GROUP_LEGACY_QR";
      else if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) || !["PENDING", "UNPAID"].includes(booking.paymentStatus)) result = "REVIEW_BOOKING_NOT_PENDING";
      else if (booking.status === "PENDING_PAYMENT" && (!booking.expiresAt || booking.expiresAt <= now)) result = "REVIEW_EXPIRED";
      else if (booking.total !== event.transferAmount) result = "REVIEW_AMOUNT_MISMATCH";
      else if (!canPayBooking(booking, now)) result = "REVIEW_SLOT_RELEASED";
      else {
        // Cập nhật có điều kiện chống hai giao dịch cùng xác nhận một booking.
        const updated = await tx.booking.updateMany({
          where: { id: booking.id, status: booking.status, paymentStatus: { in: ["UNPAID", "PENDING"] }, ...(booking.status === "PENDING_PAYMENT" ? { expiresAt: { gt: now } } : {}), total: event.transferAmount },
          data: { status: "CONFIRMED", paymentStatus: "PAID", paymentMethod: "BANK_TRANSFER", expiresAt: null },
        });
        if (updated.count !== 1) result = "REVIEW_BOOKING_NOT_PENDING";
        else {
          await tx.bookingItem.updateMany({ where: { bookingId: booking.id, status: "HELD" }, data: { status: "CONFIRMED" } });
          if (tx.coachBooking) {
            await tx.coachBooking.updateMany({ where: { bookingItem: { bookingId: booking.id }, status: "HELD" }, data: { status: "CONFIRMED", expiresAt: null } });
          }
          if (tx.offerUsage) {
            const usages = await tx.offerUsage.findMany({ where: { bookingId: booking.id, state: "RESERVED" } });
            for (const usage of usages) {
              await tx.offerUsage.update({ where: { id: usage.id }, data: { state: "CONSUMED", expiresAt: null } });
              await tx.partnerOffer.update({ where: { id: usage.offerId }, data: { usedBudget: { increment: usage.discountAmount }, currentUsage: { increment: 1 } } });
            }
          }
          if (tx.voucher && booking.voucherId) {
            await tx.voucher.update({ where: { id: booking.voucherId }, data: { usedCount: { increment: 1 } } });
          }
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
    await tx.sepayReceipt.create({ data: { transactionId, fingerprint, bookingCode: receiptBookingCode, result, payload: event as Prisma.InputJsonObject } });
    return { result };
  });
}
