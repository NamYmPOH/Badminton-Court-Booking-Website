import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError } from "@/lib/sepay";
import { getPartnerReport } from "@/services/partner.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requirePaymentUser();
    const url = new URL(request.url);
    const partnerId = url.searchParams.get("partnerId");
    if (!partnerId) throw new PaymentError(400, "Vui lòng chỉ định mã đối tác (partnerId).");

    const report = await getPartnerReport(undefined, userId, partnerId);
    return NextResponse.json({ success: true, ...report }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
