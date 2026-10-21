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

    const booking = await db.booking.findUnique({
      where: { code: params.code },
      include: {
        items: { include: { coachBooking: true } },
        payments: { where: { status: "PAID" } },
        refundRequests: true,
      },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    }

    if (booking.userId !== userId) {
      throw new PaymentError(403, "Bạn không có quyền yêu cầu hoàn tiền cho đơn này.");
    }

    const raw = await readPaymentBody(request, 2048);
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

    // Tính toán số tiền hoàn hợp lệ theo chính sách
    const calc = calculateCancellationRefund(booking);
    if (!calc.isEligible || calc.refundableAmount <= 0) {
      throw new PaymentError(
        400,
        `Đơn này không đủ điều kiện hoàn tiền: ${calc.reason}`
      );
    }

    const refundReq = await createRefundRequest(db, {
      bookingId: booking.id,
      requestedById: userId,
      amount: calc.refundableAmount,
      type: "FULL_CANCELLATION",
      reason: `${parsed.data.reason} (${calc.reason})`,
      bankAccountNumber: parsed.data.bankAccountNumber,
      bankAccountName: parsed.data.bankAccountName,
      bankName: parsed.data.bankName,
    });

    await logAuditEvent(db, {
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
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
