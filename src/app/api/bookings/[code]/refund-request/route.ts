import { serializable } from "@/lib/transaction";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { createRefundRequest } from "@/services/refund.service";
import { calculateCancellationRefund } from "@/services/policy.service";
import { logAuditEvent } from "@/services/audit-log.service";
import { assertSameOrigin } from "@/lib/admin-policy";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestRefundSchema = z.object({
  reason: z.string().trim().min(5).max(500),
  bankAccountNumber: z.string().trim().min(6).max(30),
  bankAccountName: z.string().trim().min(2).max(100),
  bankName: z.string().trim().min(2).max(100),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 2048);
    return await serializable(db, async (tx) => {

    const booking = await tx.booking.findUnique({
      where: { code: params.code },
      include: {
        items: { include: { coachBooking: true } },
        payments: { where: { status: { in: ["PAID", "REFUND_PENDING", "REFUNDED"] } }, include: { groupRefund: true } },
        refundRequests: true,
        group: true,
      },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    }

    if (booking.userId !== userId) {
      throw new PaymentError(403, "Bạn không có quyền yêu cầu hoàn tiền cho đơn này.");
    }


    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = requestRefundSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, "Thông tin tài khoản nhận hoàn tiền không hợp lệ.");
    }

    if (booking.group) throw new PaymentError(409, "Hãy hủy và hoàn tiền tại trang nhóm để đối soát từng người thanh toán.");
    const previous = booking.refundRequests.find(r => r.type === "FULL_CANCELLATION" && ["REQUESTED", "PROCESSING", "COMPLETED"].includes(r.status));
    if (previous) return Response.json({ success: true, refundRequest: previous });
    if (!["CONFIRMED", "CANCELLED"].includes(booking.status)) throw new PaymentError(409, "Đơn không còn đủ điều kiện hủy hoàn tiền.");
    // Tính toán số tiền hoàn hợp lệ theo chính sách
    const calc = calculateCancellationRefund(booking, booking.cancelledAt || new Date());
    if (!calc.isEligible || calc.refundableAmount <= 0) {
      throw new PaymentError(
        400,
        `Đơn này không đủ điều kiện hoàn tiền: ${calc.reason}`
      );
    }

    const refundReq = await createRefundRequest(tx, {
      bookingId: booking.id,
      requestedById: userId,
      amount: calc.refundableAmount,
      type: "FULL_CANCELLATION",
      reason: `${parsed.data.reason} (${calc.reason})`,
      bankAccountNumber: parsed.data.bankAccountNumber,
      bankAccountName: parsed.data.bankAccountName,
      bankName: parsed.data.bankName,
    });

    // Hủy và giải phóng tài nguyên cùng transaction với nghĩa vụ hoàn tiền.
    const cancelledAt = new Date();
    await tx.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED", paymentStatus: "REFUND_PENDING", cancelledAt, cancelReason: parsed.data.reason, expiresAt: null } });
    await tx.bookingItem.updateMany({ where: { bookingId: booking.id, status: { in: ["HELD", "CONFIRMED"] } }, data: { status: "CANCELLED" } });
    await tx.coachBooking.updateMany({ where: { bookingItem: { bookingId: booking.id }, status: { in: ["HELD", "CONFIRMED"] } }, data: { status: "CANCELLED", cancelledAt, cancelReason: parsed.data.reason, expiresAt: null } });
    await tx.offerUsage.updateMany({ where: { bookingId: booking.id, state: "RESERVED" }, data: { state: "RELEASED" } });
    await tx.ticket.updateMany({ where: { bookingId: booking.id, status: "UNUSED" }, data: { status: "CANCELLED" } });
    await logAuditEvent(tx, {
      actorId: userId,
      action: "CREATE_REFUND_REQUEST",
      entityType: "RefundRequest",
      entityId: refundReq.id,
      details: {
        amount: calc.refundableAmount,
        bookingCode: booking.code,
        bankName: parsed.data.bankName,
      },
    });

    return Response.json(
      {
        success: true,
        message: "Yêu cầu hoàn tiền đã được ghi nhận và đang chờ quản trị viên xử lý chuyển khoản.",
        refundRequest: refundReq,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
