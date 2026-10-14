import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { getMyPartners, registerPartner } from "@/services/partner.service";
import { partnerProfileInputSchema } from "@/lib/partner-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requirePaymentUser();
    const partners = await getMyPartners(undefined, userId);
    return NextResponse.json({ success: true, partners }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
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

    const parsed = partnerProfileInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin thương hiệu không hợp lệ.");
    }

    const partner = await registerPartner(undefined, userId, parsed.data);
    return NextResponse.json({ success: true, partner }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
