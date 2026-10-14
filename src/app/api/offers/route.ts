import { NextResponse } from "next/server";
import { getPublicOffers } from "@/services/partner.service";
import { paymentErrorResponse } from "@/lib/sepay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const venueId = url.searchParams.get("venueId") || undefined;
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 20;

    const offers = await getPublicOffers(undefined, { venueId, limit });
    return NextResponse.json(
      { success: true, offers },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
