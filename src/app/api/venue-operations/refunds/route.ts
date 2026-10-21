import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import {
  approveRefundRequest,
  rejectRefundRequest,
  completeManualRefund,
} from "@/services/refund.service";
import { logAuditEvent } from "@/services/audit-log.service";
import { assertSameOrigin } from "@/lib/admin-policy";
import { operatorVenueScope } from "@/lib/venue-operations";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const refundActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("APPROVE"),
    requestId: z.string().min(1),
  }).strict(),
  z.object({
    action: z.literal("REJECT"),
    requestId: z.string().min(1),
    reason: z.string().trim().min(3).max(500),
  }).strict(),
  z.object({
    action: z.literal("COMPLETE_MANUAL"),
    requestId: z.string().min(1),
    bankRef: z.string().trim().min(3).max(100),
    proofImage: z.string().optional(),
    notes: z.string().max(500).optional(),
  }).strict(),
]);

export async function GET(request: Request) {
  try {
    const userId = await requirePaymentUser();
    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE" || actor.role === "CUSTOMER") {
      throw new PaymentError(403, "Bạn không có quyền xem danh sách hoàn tiền.");
    }

    const requests = await db.refundRequest.findMany({
      where: {
        booking: {
          venue: operatorVenueScope(actor),
        },
      },
      include: {
        booking: {
          select: { code: true, customerName: true, customerPhone: true, total: true, venue: { select: { name: true } } },
        },
        transactions: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json({ success: true, requests }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE" || actor.role === "CUSTOMER") {
      throw new PaymentError(403, "Bạn không có quyền xử lý hoàn tiền.");
    }

    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = refundActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, "Dữ liệu yêu cầu hoàn tiền không hợp lệ.");
    }

    const input = parsed.data;

    if (input.action === "APPROVE") {
      const res = await approveRefundRequest(db, input.requestId, actor.id);
      await logAuditEvent(db, {
        actorId: actor.id,
        action: "APPROVE_REFUND_REQUEST",
        entityType: "RefundRequest",
        entityId: input.requestId,
      });
      return Response.json({ success: true, request: res });
    }

    if (input.action === "REJECT") {
      const res = await rejectRefundRequest(db, input.requestId, actor.id, input.reason);
      await logAuditEvent(db, {
        actorId: actor.id,
        action: "REJECT_REFUND_REQUEST",
        entityType: "RefundRequest",
        entityId: input.requestId,
        details: { reason: input.reason },
      });
      return Response.json({ success: true, request: res });
    }

    if (input.action === "COMPLETE_MANUAL") {
      const res = await completeManualRefund(db, {
        requestId: input.requestId,
        processedById: actor.id,
        bankRef: input.bankRef,
        proofImage: input.proofImage,
        notes: input.notes,
      });

      await logAuditEvent(db, {
        actorId: actor.id,
        action: "COMPLETE_MANUAL_REFUND",
        entityType: "RefundRequest",
        entityId: input.requestId,
        details: { bankRef: input.bankRef, amount: res.transaction?.amount ?? res.request.amount },
      });

      return Response.json({ success: true, ...res });
    }

    throw new PaymentError(400, "Hành động không được hỗ trợ.");
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
