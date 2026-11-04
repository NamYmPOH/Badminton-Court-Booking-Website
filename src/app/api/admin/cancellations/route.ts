import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { refundLedger } from "@/services/refund.service";
import { approveBookingCancellation, recordManualRefund } from "@/services/venue-session.service";
import { serializable } from "@/lib/transaction";
import { z } from "zod";

export const dynamic = "force-dynamic";

const input = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("approve"),
      id: z.string().min(1),
      amount: z.number().int().nonnegative().optional(),
      reason: z.string().trim().min(5).max(500),
      override: z.boolean().optional(),
      overrideReason: z.string().trim().max(500).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("refund"),
      id: z.string().min(1),
      amount: z.number().int().positive(),
      reason: z.string().trim().min(5).max(500),
      refundId: z.string().min(1),
      reference: z.string().trim().min(5).max(160),
    })
    .strict(),
]);

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new PaymentError(400, "Thiếu mã đơn.");

    const data = await serializable(db, async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        select: {
          id: true,
          code: true,
          status: true,
          paymentStatus: true,
          customerName: true,
          customerPhone: true,
          cancelRequestedAt: true,
          cancelApprovedAt: true,
          cancelReason: true,
          cancelExpectedRate: true,
          cancelExpectedAmount: true,
          cancelNonRefundable: true,
          cancelPolicyVersion: true,
          cancelCalculation: true,
          cancelFirstSlotStartsAt: true,
          refundAmountApproved: true,
          refundCompletedAt: true,
          transfereeName: true,
          transfereePhone: true,
        },
      });
      if (!booking) throw new PaymentError(404, "Không tìm thấy đơn.");

      const ledger = await refundLedger(tx, id);

      // Phân biệt 4 giai đoạn rõ ràng theo yêu cầu:
      // 1. Chờ duyệt hủy
      // 2. Đã duyệt, chờ hoàn
      // 3. Đã hoàn tiền
      // 4. Đã hủy, không được hoàn tiền
      let cancellationStage: "PENDING_APPROVAL" | "APPROVED_WAITING_REFUND" | "REFUNDED" | "CANCELLED_NO_REFUND";
      if (!booking.cancelApprovedAt && booking.cancelRequestedAt) {
        cancellationStage = "PENDING_APPROVAL";
      } else if (booking.cancelApprovedAt) {
        if (booking.refundAmountApproved === 0 || (ledger.received === 0 && !ledger.approved)) {
          cancellationStage = "CANCELLED_NO_REFUND";
        } else if (ledger.pending > 0) {
          cancellationStage = "APPROVED_WAITING_REFUND";
        } else {
          cancellationStage = "REFUNDED";
        }
      } else {
        cancellationStage = "CANCELLED_NO_REFUND";
      }

      return {
        booking,
        cancellationStage,
        available: ledger.available,
        received: ledger.received,
        approved: ledger.approved,
        completed: ledger.completed,
        pendingDisbursement: ledger.pending,
        refunds: ledger.refunds.map((r) => ({
          id: r.id,
          amount: r.amount,
          completedAmount: r.completedAmount,
          status: r.status,
          reference: r.reference,
          txnRef: ledger.payments.find((p) => p.id === r.paymentId)?.txnRef,
        })),
      };
    });

    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return paymentErrorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = input.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, "Kiểm tra số tiền, lý do và mã chứng từ (ít nhất 5 ký tự).");
    }

    const d = parsed.data;
    const result =
      d.action === "approve"
        ? await approveBookingCancellation(
            db,
            actor,
            d.id,
            d.amount,
            d.reason,
            d.override || false,
            d.overrideReason
          )
        : await recordManualRefund(db, actor, d.id, d.amount, d.reason, d.refundId, d.reference);

    return Response.json(result);
  } catch (e) {
    return paymentErrorResponse(e);
  }
}
