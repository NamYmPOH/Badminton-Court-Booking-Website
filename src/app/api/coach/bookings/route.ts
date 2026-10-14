import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse } from "@/lib/sepay";
import { getMyCoachBookings } from "@/services/coach.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requirePaymentUser();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const fromDate = url.searchParams.get("fromDate") || undefined;
    const toDate = url.searchParams.get("toDate") || undefined;

    const bookings = await getMyCoachBookings(undefined, userId, { status, fromDate, toDate });
    return NextResponse.json({ success: true, bookings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
