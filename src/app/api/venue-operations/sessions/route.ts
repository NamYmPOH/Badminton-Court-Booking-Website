import { serializable } from "@/lib/transaction";
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
    requestId: z.string().uuid(),
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
    const raw = await readPaymentBody(request, 4096);
    return await serializable(db, async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE" || actor.role === "CUSTOMER") {
      throw new PaymentError(403, "Bạn không có quyền thực hiện thao tác vận hành sân.");
    }


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
    const scope = operatorVenueScope(actor);
    const target = input.action === "START_SESSION"
      ? await tx.bookingItem.findFirst({ where: { id: input.bookingItemId, booking: { venue: scope } }, select: { id: true } })
      : input.action === "PAY_SURCHARGE"
        ? await tx.courtSurcharge.findFirst({ where: { id: input.surchargeId, session: { booking: { venue: scope } } }, select: { id: true } })
        : await tx.courtSession.findFirst({ where: { id: input.sessionId, booking: { venue: scope } }, select: { id: true } });
    if (!target) throw new PaymentError(403, "Bạn không có quyền vận hành phiên sân này.");

    if (input.action === "START_SESSION") {
      const session = await startCourtSession(tx, {
        bookingItemId: input.bookingItemId,
        operatorId: actor.id,
        note: input.note,
      });

      await logAuditEvent(tx, {
        actorId: actor.id,
        action: "START_COURT_SESSION",
        entityType: "CourtSession",
        entityId: session.id,
        details: { bookingItemId: input.bookingItemId, note: input.note },
      });

      return Response.json({ success: true, session });
    }

    if (input.action === "COMPLETE_SESSION") {
      const session = await completeCourtSession(tx, {
        sessionId: input.sessionId,
        operatorId: actor.id,
        note: input.note,
      });

      await logAuditEvent(tx, {
        actorId: actor.id,
        action: "COMPLETE_COURT_SESSION",
        entityType: "CourtSession",
        entityId: session.id,
        details: { note: input.note },
      });

      return Response.json({ success: true, session });
    }

    if (input.action === "ADD_SURCHARGE") {
      const surcharge = await addCourtSurcharge(tx, {
        requestId: input.requestId,
        sessionId: input.sessionId,
        createdById: actor.id,
        type: input.type,
        amount: input.amount,
        reason: input.reason,
        paymentMethod: input.paymentMethod,
        isPaid: input.isPaid,
      });

      await logAuditEvent(tx, {
        actorId: actor.id,
        action: "ADD_COURT_SURCHARGE",
        entityType: "CourtSurcharge",
        entityId: surcharge.id,
        details: { type: input.type, amount: input.amount, reason: input.reason },
      });

      return Response.json({ success: true, surcharge });
    }

    if (input.action === "PAY_SURCHARGE") {
      const surcharge = await payCourtSurcharge(tx, input.surchargeId, input.paymentMethod);

      await logAuditEvent(tx, {
        actorId: actor.id,
        action: "PAY_COURT_SURCHARGE",
        entityType: "CourtSurcharge",
        entityId: surcharge.id,
        details: { paymentMethod: input.paymentMethod },
      });

      return Response.json({ success: true, surcharge });
    }

    throw new PaymentError(400, "Thao tác không được hỗ trợ.");
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function GET() {
  try {
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({ where: { id }, select: { id: true, role: true, status: true } });
    const scope = operatorVenueScope(actor);
    const [venues, items] = await Promise.all([
      db.venue.findMany({ where: scope, select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } }),
      db.bookingItem.findMany({
        where: { booking: { venue: scope, paymentStatus: "PAID", status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] } }, status: "CONFIRMED", OR: [{ session: null }, { session: { status: "ACTIVE" } }, { session: { surcharges: { some: { status: "UNPAID" } } } }] },
        include: { session: { include: { surcharges: true } }, court: { select: { name: true } }, booking: { select: { code: true, venueId: true } } },
        orderBy: [{ date: "asc" }, { startMin: "asc" }], take: 200,
      }),
    ]);
    return Response.json({ venues, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
