import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { reportBookingIncident, type IncidentType, type IncidentRequestType } from "@/services/incident.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const incidentSchema = z.object({
  incidentType: z.enum(["HEAVY_RAIN", "POWER_OUTAGE", "COURT_MAINTENANCE", "SYSTEM_ERROR", "OTHER"]),
  requestType: z.enum(["REFUND", "RESCHEDULE"]),
  description: z.string().trim().min(5, "Vui lòng mô tả ít nhất 5 ký tự.").max(1000),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();

    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = incidentSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin báo cáo sự cố không hợp lệ.");
    }

    const result = await reportBookingIncident(db, {
      bookingCode: params.code,
      actorId: userId,
      incidentType: parsed.data.incidentType as IncidentType,
      requestType: parsed.data.requestType as IncidentRequestType,
      description: parsed.data.description,
    });

    return NextResponse.json(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

