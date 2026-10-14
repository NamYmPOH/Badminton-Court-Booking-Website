import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { cancelCoachBookingByCoach } from "@/services/coach.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cancelBodySchema = z.object({
  reason: z.string().trim().min(5, "Lý do hủy tối thiểu 5 ký tự.").max(500),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const coachBookingId = params.id;

    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = cancelBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Lý do hủy không hợp lệ.");
    }

    const result = await cancelCoachBookingByCoach(undefined, userId, coachBookingId, parsed.data.reason);
    return NextResponse.json(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
