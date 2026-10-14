import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { getMyPartnerOffers, createPartnerOffer } from "@/services/partner.service";
import { partnerOfferInputSchema } from "@/lib/partner-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requirePaymentUser();
    const url = new URL(request.url);
    const partnerId = url.searchParams.get("partnerId");
    if (!partnerId) throw new PaymentError(400, "Vui lòng chỉ định mã đối tác (partnerId).");

    const offers = await getMyPartnerOffers(undefined, userId, partnerId);
    return NextResponse.json({ success: true, offers }, { headers: { "Cache-Control": "no-store" } });
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

    const parsed = partnerOfferInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin ưu đãi không hợp lệ.");
    }

    const offer = await createPartnerOffer(undefined, userId, parsed.data);
    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
