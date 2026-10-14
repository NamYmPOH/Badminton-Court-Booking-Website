import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { getMyCoachProfile, upsertMyCoachProfile } from "@/services/coach.service";
import { coachProfileInputSchema } from "@/lib/coach-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requirePaymentUser();
    const profile = await getMyCoachProfile(undefined, userId);
    return NextResponse.json({ success: true, profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 8192);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = coachProfileInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin hồ sơ không hợp lệ.");
    }

    const profile = await upsertMyCoachProfile(undefined, userId, parsed.data);
    return NextResponse.json({ success: true, profile }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
