import { Prisma, type PrismaClient } from "@prisma/client";
import { PaymentError } from "../lib/sepay";

export interface CreateRefundRequestInput {
  bookingId: string;
  paymentId?: string;
  requestedById: string;
  amount: number;
  type: "FULL_CANCELLATION" | "PARTIAL_CANCELLATION" | "COACH_CANCELLATION" | "OVERPAYMENT" | "DISPUTE";
  reason: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bankName?: string;
}

export interface CompleteRefundInput {
  requestId: string;
  processedById: string;
  bankRef: string;
  proofImage?: string;
  notes?: string;
}

/**
 * Tạo yêu cầu hoàn tiền mới có kiểm tra giới hạn số tiền thực thu (Chống hoàn vượt mức)
 */
export async function createRefundRequest(
  tx: Prisma.TransactionClient | PrismaClient,
  input: CreateRefundRequestInput
) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new PaymentError(400, "Số tiền yêu cầu hoàn không hợp lệ.");
  }

  const booking = await tx.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      payments: { where: { status: { in: ["PAID", "REFUND_PENDING"] } } },
      refundRequests: { where: { status: { in: ["REQUESTED", "PROCESSING", "COMPLETED"] } } },
    },
  });

  if (!booking) {
    throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
  }

  // Tổng tiền thực thu từ khách
  const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);

  // Tổng tiền đã có yêu cầu hoặc đã hoàn
  const existingRefunds = booking.refundRequests.reduce((sum, r) => sum + r.amount, 0);

  const availableRefundable = totalPaid - existingRefunds;
  if (input.amount > availableRefundable) {
    throw new PaymentError(
      400,
      `Số tiền yêu cầu hoàn (${input.amount.toLocaleString("vi-VN")}đ) vượt quá hạn mức còn lại có thể hoàn (${Math.max(0, availableRefundable).toLocaleString("vi-VN")}đ).`
    );
  }

  return tx.refundRequest.create({
    data: {
      bookingId: booking.id,
      paymentId: input.paymentId,
      requestedById: input.requestedById,
      amount: input.amount,
      type: input.type,
      reason: input.reason.trim(),
      status: "REQUESTED",
      bankAccountNumber: input.bankAccountNumber,
      bankAccountName: input.bankAccountName,
      bankName: input.bankName,
    },
  });
}

/**
 * Nhân viên / Quản trị viên duyệt yêu cầu hoàn tiền -> Chuyển sang PROCESSING
 */
export async function approveRefundRequest(
  tx: Prisma.TransactionClient | PrismaClient,
  requestId: string,
  approvedById: string
) {
  const req = await tx.refundRequest.findUnique({
    where: { id: requestId },
  });

  if (!req) {
    throw new PaymentError(404, "Không tìm thấy yêu cầu hoàn tiền.");
  }

  if (req.status !== "REQUESTED") {
    throw new PaymentError(409, `Yêu cầu hoàn tiền đang ở trạng thái: ${req.status}`);
  }

  return tx.refundRequest.update({
    where: { id: req.id },
    data: {
      status: "PROCESSING",
      approvedById,
    },
  });
}

/**
 * Từ chối yêu cầu hoàn tiền
 */
export async function rejectRefundRequest(
  tx: Prisma.TransactionClient | PrismaClient,
  requestId: string,
  rejectedById: string,
  reason: string
) {
  const req = await tx.refundRequest.findUnique({
    where: { id: requestId },
  });

  if (!req) {
    throw new PaymentError(404, "Không tìm thấy yêu cầu hoàn tiền.");
  }

  if (["COMPLETED", "REJECTED"].includes(req.status)) {
    throw new PaymentError(409, `Không thể từ chối yêu cầu đã ở trạng thái: ${req.status}`);
  }

  return tx.refundRequest.update({
    where: { id: req.id },
    data: {
      status: "REJECTED",
      approvedById: rejectedById,
      rejectedReason: reason.trim(),
    },
  });
}

/**
 * Xác nhận đã hoàn tiền thủ công qua ngân hàng kèm mã tham chiếu chuyển khoản (Idempotent)
 */
export async function completeManualRefund(
  tx: Prisma.TransactionClient | PrismaClient,
  input: CompleteRefundInput
) {
  if (!input.bankRef || input.bankRef.trim().length < 3) {
    throw new PaymentError(400, "Vui lòng nhập mã tham chiếu giao dịch ngân hàng để đối soát.");
  }

  const req = await tx.refundRequest.findUnique({
    where: { id: input.requestId },
    include: {
      booking: {
        include: {
          payments: { where: { status: "PAID" } },
          refundRequests: { where: { status: "COMPLETED" } },
        },
      },
    },
  });

  if (!req) {
    throw new PaymentError(404, "Không tìm thấy yêu cầu hoàn tiền.");
  }

  if (req.status === "COMPLETED") {
    const existingTxn = await tx.refundTransaction.findFirst({
      where: { requestId: req.id },
      orderBy: { processedAt: "desc" },
    });
    return { request: req, transaction: existingTxn };
  }

  const now = new Date();

  // 1. Tạo bản ghi giao dịch hoàn tiền thực tế
  const txn = await tx.refundTransaction.create({
    data: {
      requestId: req.id,
      paymentId: req.paymentId,
      amount: req.amount,
      method: "MANUAL_BANK_TRANSFER",
      bankRef: input.bankRef.trim(),
      proofImage: input.proofImage,
      processedById: input.processedById,
      processedAt: now,
      status: "COMPLETED",
      notes: input.notes,
    },
  });

  // 2. Cập nhật RefundRequest sang COMPLETED
  const updatedReq = await tx.refundRequest.update({
    where: { id: req.id },
    data: {
      status: "COMPLETED",
      updatedAt: now,
    },
  });

  // 3. Đánh giá trạng thái PaymentStatus của Booking
  const totalPaid = req.booking.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCompletedRefunds =
    req.booking.refundRequests.reduce((sum, r) => sum + r.amount, 0) + req.amount;

  if (totalCompletedRefunds >= totalPaid && totalPaid > 0) {
    await tx.booking.update({
      where: { id: req.bookingId },
      data: { paymentStatus: "REFUNDED" },
    });
  }

  return { request: updatedReq, transaction: txn };
}
