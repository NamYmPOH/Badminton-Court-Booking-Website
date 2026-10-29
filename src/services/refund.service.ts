import type { Prisma } from "@prisma/client";
import { PaymentError } from "../lib/sepay";

type Tx = Prisma.TransactionClient;

export function assertMoney(amount: number, allowZero = false) {
  if (!Number.isSafeInteger(amount) || amount < (allowZero ? 0 : 1)) {
    throw new PaymentError(400, "Số tiền phải là số nguyên VND hợp lệ.");
  }
}

/** Chỉ gọi trong transaction Serializable khi dùng kết quả để ghi sổ. */
export async function refundLedger(tx: Tx, bookingId: string) {
  const payments = await tx.payment.findMany({
    where: { bookingId, status: { in: ["PAID", "REFUND_PENDING", "REFUNDED"] } },
    include: { groupRefund: { include: { disbursements: true } } },
    orderBy: { id: "asc" },
  });
  // Bản ghi REFUND-COACH cũ là nghĩa vụ chi, tuyệt đối không phải tiền đã thu.
  const receipts = payments.filter((p) => !p.txnRef.startsWith("REFUND-"));
  const legacy = payments.filter((p) => p.txnRef.startsWith("REFUND-"));
  if (legacy.length || receipts.some((p) => p.status !== "PAID" && !p.groupRefund)) {
    throw new PaymentError(409, "Khoản hoàn cũ chưa có sổ chi tiết. Cần đối soát chứng từ trước khi tiếp tục.");
  }
  const refunds = payments.flatMap((p) => p.groupRefund ? [p.groupRefund] : []);
  const received = receipts.reduce((s, p) => s + p.amount, 0);
  const approved = refunds.reduce((s, r) => s + r.amount, 0);
  const completed = refunds.reduce((s, r) => s + r.completedAmount, 0);
  for (const p of receipts) assertMoney(p.amount);
  for (const r of refunds) {
    assertMoney(r.amount);
    assertMoney(r.completedAmount, true);
    if (r.completedAmount > r.amount) throw new PaymentError(409, "Sổ hoàn tiền không khớp, cần đối soát.");
    const payment = receipts.find((p) => p.id === r.paymentId);
    if (!payment || r.amount > payment.amount || !["PENDING", "COMPLETED"].includes(r.status)
      || (r.status === "COMPLETED") !== (r.completedAmount === r.amount)) {
      throw new PaymentError(409, "Khoản hoàn không khớp chứng từ thu, cần đối soát.");
    }
    if (r.disbursements.reduce((sum, d) => sum + d.amount, 0) !== r.completedAmount) {
      throw new PaymentError(409, "Tổng chứng từ chi không khớp tiền đã hoàn, cần đối soát.");
    }
  }
  assertMoney(received, true);
  assertMoney(approved, true);
  if (approved > received) throw new PaymentError(409, "Nghĩa vụ hoàn vượt tiền thực thu. Cần đối soát trước khi chi tiền.");
  return { payments, receipts, refunds, legacy, received, approved, completed,
    available: received - approved, pending: approved - completed };
}

/** Tăng nghĩa vụ hoàn, giữ nguyên chứng từ thu và các khoản đã chi. */
export async function reserveRefund(tx: Tx, bookingId: string, amount: number, reason: string) {
  assertMoney(amount, true);
  const ledger = await refundLedger(tx, bookingId);
  if (amount > ledger.available) throw new PaymentError(409, "Số tiền hoàn vượt số tiền thực thu còn được hoàn.");
  let remaining = amount;
  let weight = ledger.available;
  for (const p of ledger.receipts) {
    const existing = p.groupRefund;
    const capacity = p.amount - (existing?.amount || 0);
    // Chia theo tiền còn giữ của từng người trả, bảo toàn từng đồng lẻ.
    const allocated = weight > 0 ? Number(BigInt(remaining) * BigInt(capacity) / BigInt(weight)) : 0;
    weight -= capacity;
    if (allocated <= 0) continue;
    if (existing) {
      await tx.groupRefund.update({ where: { id: existing.id }, data: {
        amount: existing.amount + allocated, status: "PENDING", completedAt: null,
        reason: `${existing.reason}; ${reason}`,
      } });
    } else {
      await tx.groupRefund.create({ data: { paymentId: p.id, amount: allocated, reason, completedAmount: 0 } });
    }
    remaining -= allocated;
  }
  if (remaining !== 0) throw new PaymentError(409, "Không phân bổ được khoản hoàn theo chứng từ thu.");
  return refundLedger(tx, bookingId);
}

export async function releaseCancelledResources(tx: Tx, bookingId: string, reason: string, now: Date) {
  await tx.bookingItem.updateMany({ where: { bookingId, status: { in: ["HELD", "CONFIRMED"] } }, data: { status: "CANCELLED" } });
  await tx.coachBooking.updateMany({ where: { bookingItem: { bookingId }, status: { in: ["HELD", "CONFIRMED"] } },
    data: { status: "CANCELLED", cancelledAt: now, cancelReason: reason, expiresAt: null } });
  await tx.offerUsage.updateMany({ where: { bookingId, state: "RESERVED" }, data: { state: "RELEASED", expiresAt: null } });
  await tx.groupPaymentIntent.updateMany({ where: { group: { bookingId }, status: "OPEN" }, data: { status: "CLOSED" } });
  await tx.bookingGroup.updateMany({ where: { bookingId, closedAt: null }, data: { closedAt: now } });
}

export async function approveCancellationInTransaction(
  tx: Tx, booking: { id: string; status: string; paymentStatus: string; cancelApprovedAt: Date | null },
  amount: number, reason: string, now: Date,
) {
  if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) || booking.cancelApprovedAt) {
    throw new PaymentError(409, "Đơn không còn cho phép duyệt hủy. Không được duyệt lặp lại.");
  }
  const before = await refundLedger(tx, booking.id);
  if (before.received === 0 && ["PAID", "PARTIALLY_PAID", "REFUND_PENDING", "REFUNDED"].includes(booking.paymentStatus)) {
    throw new PaymentError(409, "Thiếu chứng từ thu tiền. Cần đối soát trước khi hủy và hoàn tiền.");
  }
  const ledger = await reserveRefund(tx, booking.id, amount, reason);
  await releaseCancelledResources(tx, booking.id, reason, now);
  await tx.booking.update({ where: { id: booking.id }, data: {
    status: "CANCELLED", cancelledAt: now, cancelApprovedAt: now, cancelReason: reason, expiresAt: null,
    refundAmountApproved: ledger.approved,
    paymentStatus: ledger.pending > 0 ? "REFUND_PENDING" : ledger.completed > 0 ? "REFUNDED" : booking.paymentStatus as Prisma.EnumPaymentStatusFieldUpdateOperationsInput["set"],
    refundCompletedAt: ledger.approved > 0 && ledger.pending === 0 ? now : null,
    ...(ledger.pending > 0 ? { refundCompletedById: null } : {}),
  } });
  return ledger;
}

/** Ghi nhận chứng từ chi thực tế; không thực hiện chuyển khoản ngân hàng. */
export async function completeRefund(
  tx: Tx, bookingId: string, refundId: string, amount: number, reference: string, actorId: string, now = new Date(),
) {
  assertMoney(amount);
  const cleanReference = reference?.trim().toUpperCase();
  if (!cleanReference || cleanReference.length < 5 || cleanReference.length > 160) {
    throw new PaymentError(400, "Cần mã giao dịch chi hoặc số phiếu chi riêng biệt (5–160 ký tự).");
  }
  const previous = await tx.refundDisbursement.findUnique({ where: { reference: cleanReference } });
  if (previous) {
    if (previous.refundId !== refundId || previous.amount !== amount) throw new PaymentError(409, "Chứng từ chi này đã được sử dụng.");
    const refund = await tx.groupRefund.findFirst({ where: { id: refundId, payment: { bookingId } } });
    if (!refund) throw new PaymentError(409, "Chứng từ không thuộc đơn này.");
    return { duplicate: true };
  }
  const ledger = await refundLedger(tx, bookingId);
  const refund = ledger.refunds.find((r) => r.id === refundId);
  if (!refund || refund.status !== "PENDING" || amount > refund.amount - refund.completedAmount) {
    throw new PaymentError(409, "Số tiền vượt khoản hoàn còn lại hoặc khoản hoàn đã đóng.");
  }
  const completedAmount = refund.completedAmount + amount;
  await tx.refundDisbursement.create({ data: { refundId, amount, reference: cleanReference, actorId } });
  await tx.groupRefund.update({ where: { id: refund.id }, data: {
    completedAmount, reference: cleanReference,
    status: completedAmount === refund.amount ? "COMPLETED" : "PENDING",
    completedAt: completedAmount === refund.amount ? now : null,
  } });
  const p = ledger.payments.find((p) => p.id === refund.paymentId)!;
  await tx.payment.update({ where: { id: p.id }, data: { status: completedAmount === p.amount ? "REFUNDED" : "PAID" } });
  const pending = ledger.pending - amount;
  const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
  await tx.booking.update({ where: { id: bookingId }, data: {
    // Hoàn riêng phí HLV không tước quyền nhận sân đã thanh toán.
    ...(["CANCELLED", "EXPIRED"].includes(booking.status) ? { paymentStatus: pending > 0 ? "REFUND_PENDING" as const : "REFUNDED" as const } : {}),
    refundAmountApproved: ledger.approved,
    refundCompletedAt: pending === 0 ? now : null,
    refundCompletedById: pending === 0 ? actorId : null,
  } });
  return { duplicate: false, remaining: refund.amount - completedAmount };
}
