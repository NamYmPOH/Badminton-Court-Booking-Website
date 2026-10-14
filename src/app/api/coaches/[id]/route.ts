import { NextResponse } from "next/server";
import { getPublicCoachById, getPublicCoachAvailabilities } from "@/services/coach.service";
import { paymentErrorResponse } from "@/lib/sepay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const coachId = params.id;
    const coach = await getPublicCoachById(undefined, coachId);

    const url = new URL(request.url);
    const venueId = url.searchParams.get("venueId");
    const date = url.searchParams.get("date"); // YYYY-MM-DD

    let freeSlots: Array<{ id: string; startsAt: string; endsAt: string }> = [];
    if (venueId && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      freeSlots = await getPublicCoachAvailabilities(undefined, coachId, venueId, date);
    }

    return NextResponse.json(
      { success: true, coach, freeSlots },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
