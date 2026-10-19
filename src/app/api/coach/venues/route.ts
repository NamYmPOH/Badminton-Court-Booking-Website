import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { registerCoachVenue, reviewCoachVenue } from "@/services/coach.service";
import { coachVenueApprovalSchema } from "@/lib/coach-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerVenueSchema = z.object({
  venueId: z.string().min(1, "Vui lòng chọn cơ sở."),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = registerVenueSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, "Dữ liệu không hợp lệ.");
    }

    const result = await registerCoachVenue(undefined, userId, parsed.data.venueId);
    return NextResponse.json({ success: true, venueLink: result }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
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

    const parsed = coachVenueApprovalSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu duyệt không hợp lệ.");
    }

    const result = await reviewCoachVenue(undefined, userId, parsed.data);
    return NextResponse.json({ success: true, venueLink: result });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
