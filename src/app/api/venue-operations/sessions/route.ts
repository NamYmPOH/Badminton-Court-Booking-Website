import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import {
  startCourtSession,
  completeCourtSession,
  addCourtSurcharge,
  payCourtSurcharge,
} from "@/services/session.service";
import { logAuditEvent } from "@/services/audit-log.service";
import { assertSameOrigin } from "@/lib/admin-policy";
import { operatorVenueScope } from "@/lib/venue-operations";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("START_SESSION"),
    bookingItemId: z.string().min(1),
    note: z.string().max(500).optional(),
  }).strict(),
  z.object({
    action: z.literal("COMPLETE_SESSION"),
    sessionId: z.string().min(1),
    note: z.string().max(500).optional(),
  }).strict(),
  z.object({
    action: z.literal("ADD_SURCHARGE"),
    sessionId: z.string().min(1),
    type: z.enum(["OVERTIME", "SERVICE", "DAMAGE", "OTHER"]),
    amount: z.number().int().positive().max(100000000),
    reason: z.string().trim().min(3).max(500),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "QR"]).optional(),
    isPaid: z.boolean().optional(),
  }).strict(),
  z.object({
    action: z.literal("PAY_SURCHARGE"),
    surchargeId: z.string().min(1),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "QR"]).default("CASH"),
  }).strict(),
]);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE" || actor.role === "CUSTOMER") {
      throw new PaymentError(403, "Bạn không có quyền thực hiện thao tác vận hành sân.");
    }

    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = sessionActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, "Dữ liệu yêu cầu phiên sân không hợp lệ.");
    }

    const input = parsed.data;

    if (input.action === "START_SESSION") {
      const session = await startCourtSession(db, {
        bookingItemId: input.bookingItemId,
        operatorId: actor.id,
        note: input.note,
      });

      await logAuditEvent(db, {
        actorId: actor.id,
        action: "START_COURT_SESSION",
        entityType: "CourtSession",
        entityId: session.id,
        details: { bookingItemId: input.bookingItemId, note: input.note },
      });

      return Response.json({ success: true, session });
    }

    if (input.action === "COMPLETE_SESSION") {
      const session = await completeCourtSession(db, {
        sessionId: input.sessionId,
        operatorId: actor.id,
        note: input.note,
      });

      await logAuditEvent(db, {
        actorId: actor.id,
        action: "COMPLETE_COURT_SESSION",
        entityType: "CourtSession",
        entityId: session.id,
        details: { note: input.note },
      });

      return Response.json({ success: true, session });
    }

    if (input.action === "ADD_SURCHARGE") {
      const surcharge = await addCourtSurcharge(db, {
        sessionId: input.sessionId,
        createdById: actor.id,
        type: input.type,
        amount: input.amount,
        reason: input.reason,
        paymentMethod: input.paymentMethod,
        isPaid: input.isPaid,
      });

      await logAuditEvent(db, {
        actorId: actor.id,
        action: "ADD_COURT_SURCHARGE",
        entityType: "CourtSurcharge",
        entityId: surcharge.id,
        details: { type: input.type, amount: input.amount, reason: input.reason },
      });

      return Response.json({ success: true, surcharge });
    }

    if (input.action === "PAY_SURCHARGE") {
      const surcharge = await payCourtSurcharge(db, input.surchargeId, input.paymentMethod);

      await logAuditEvent(db, {
        actorId: actor.id,
        action: "PAY_COURT_SURCHARGE",
        entityType: "CourtSurcharge",
        entityId: surcharge.id,
        details: { paymentMethod: input.paymentMethod },
      });

      return Response.json({ success: true, surcharge });
    }

    throw new PaymentError(400, "Thao tác không được hỗ trợ.");
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
