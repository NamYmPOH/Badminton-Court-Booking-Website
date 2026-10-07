import { db } from "@/lib/db";
import { getSepayConfig, parseSepayEvent, paymentErrorResponse, PaymentError, readPaymentBody, verifySepaySignature } from "@/lib/sepay";
import { receiveSepayPayment } from "@/services/sepay.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const config = getSepayConfig();
    const raw = await readPaymentBody(request);
    if (!verifySepaySignature(raw, request.headers, config.SEPAY_WEBHOOK_SECRET)) throw new PaymentError(401, "Invalid signature");
    const outcome = await receiveSepayPayment(db, parseSepayEvent(raw), config);
    return Response.json({ success: true, ...outcome }, { status: 200 });
  } catch (error) { return paymentErrorResponse(error); }
}
