import { NextResponse } from "next/server";
import { getPublicCoaches } from "@/services/coach.service";
import { paymentErrorResponse } from "@/lib/sepay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 12;
    const q = searchParams.get("q") || undefined;
    const specialty = searchParams.get("specialty") || undefined;
    const minRate = searchParams.get("minRate") ? parseInt(searchParams.get("minRate")!, 10) : undefined;
    const maxRate = searchParams.get("maxRate") ? parseInt(searchParams.get("maxRate")!, 10) : undefined;
    const venueId = searchParams.get("venueId") || undefined;
    const district = searchParams.get("district") || undefined;

    const result = await getPublicCoaches(undefined, {
      page,
      limit,
      q,
      specialty,
      minRate,
      maxRate,
      venueId,
      district,
    });

    return NextResponse.json(
      { success: true, ...result },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
