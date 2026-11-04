import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { confirmBookingIncident } from "@/services/incident.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const confirmSchema = z.object({
  incidentId: z.string().min(1, "Thiếu ID sự cố."),
  action: z.enum(["APPROVE", "REJECT", "MANUAL_REVIEW"]),
  resolution: z.enum(["REFUND", "RESCHEDULE"]).optional(),
  adminNote: z.string().trim().min(5, "Ghi chú thẩm định ít nhất 5 ký tự.").max(1000),
}).strict();

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const incidents = await db.bookingIncidentRequest.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        booking: {
          select: {
            id: true,
            code: true,
            customerName: true,
            customerPhone: true,
            total: true,
            venue: { select: { name: true, forceMajeurePolicy: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, incidents });
  } catch (error) {
    return paymentErrorResponse(error);
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

    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin thẩm định không hợp lệ.");
    }

    const result = await confirmBookingIncident(db, {
      incidentId: parsed.data.incidentId,
      actorId: actor.id,
      action: parsed.data.action,
      resolution: parsed.data.resolution,
      adminNote: parsed.data.adminNote,
    });

    return NextResponse.json(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

