import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { validateAndQuoteOffer } from "@/services/partner.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validateOfferSchema = z.object({
  code: z.string().trim().min(3).max(30),
  venueId: z.string().min(1),
  courtSubtotal: z.number().int().min(0),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = validateOfferSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.");
    }

    const result = await validateAndQuoteOffer(
      undefined,
      parsed.data.code,
      parsed.data.venueId,
      parsed.data.courtSubtotal
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
