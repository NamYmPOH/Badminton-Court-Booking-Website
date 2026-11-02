import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processOverdueAndCompletions } from "@/services/venue-session.service";
import { cleanupExpiredBookings } from "@/services/booking-cleanup.service";
import { paymentErrorResponse } from "@/lib/sepay";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Xác thực cron secret nếu có cấu hình
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlSecret = new URL(request.url).searchParams.get("key");
      if (urlSecret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const [sessionResult, cleanupResult] = await Promise.all([
      processOverdueAndCompletions(db),
      cleanupExpiredBookings(db),
    ]);

    return NextResponse.json({
      success: true,
      ...sessionResult,
      cleanup: cleanupResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
