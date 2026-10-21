import { logAuditEvent } from "@/services/audit-log.service";
import { serializable } from "@/lib/transaction";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { checkInWithTicket } from "@/services/ticket.service";
import { assertSameOrigin } from "@/lib/admin-policy";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkInSchema = z.object({
  qrPayload: z.string().trim().min(10).max(500),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 2048);
    return await serializable(db, async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn không có quyền thực hiện thao tác này.");
    }

    if (actor.role === "CUSTOMER") {
      throw new PaymentError(403, "Chỉ nhân viên sân hoặc quản trị viên mới có quyền quét vé.");
    }


    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, "Mã vé không hợp lệ.");
    }

    const result = await checkInWithTicket(tx, {
      qrPayload: parsed.data.qrPayload,
      operator: actor,
    });

    await logAuditEvent(tx, { actorId: actor.id, action: "CHECK_IN_SINGLE_TICKET", entityId: result.ticket.id, entityType: "Ticket" });
    return Response.json(
      {
        success: true,
        message: `Check-in vé ${result.ticket.ticketCode} thành công.`,
        ticket: {
          code: result.ticket.ticketCode,
          holderName: result.ticket.holderName,
          status: result.ticket.status,
          checkedInAt: result.ticket.checkedInAt,
        },
        sessionsCount: result.sessions.length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
