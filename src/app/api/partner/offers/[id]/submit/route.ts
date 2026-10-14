import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse } from "@/lib/sepay";
import { submitPartnerOfferForReview } from "@/services/partner.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const offerId = params.id;

    const offer = await submitPartnerOfferForReview(undefined, userId, offerId);
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
