import { summarizeVenueReviews } from "@/lib/review-summary";
import { requirePaymentUser } from "@/lib/payment-session";
import { heldBookingPaymentUrl } from "@/lib/held-booking";
import { db } from "@/lib/db";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("venueId");
    const slug = params.get("slug");
    if (!id && !slug) throw new PaymentError(400, "Thiếu cơ sở.");
    const venue = await db.venue.findFirst({ where: { ...(id ? { id } : { slug: slug! }), status: "ACTIVE" }, include: { courts: { orderBy: { sortOrder: "asc" } }, pricing: true } });
    if (!venue) throw new PaymentError(404, "Cơ sở này chưa mở đặt sân trực tuyến.");
    const dateText = params.get("date");
    const now = new Date();
    const serverTime = now.toISOString();

    const busy: { courtId: string; startMin: number; endMin: number }[] = [];
    const busySlots: {
      courtId: string;
      startMin: number;
      endMin: number;
      status: "HELD" | "BOOKED" | "BLOCKED";
      expiresAt: string | null;
      resumePaymentUrl?: string | null;
    }[] = [];

    if (dateText) {
      const date = new Date(`${dateText}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dateText) ||
        !Number.isFinite(date.getTime()) ||
        date.toISOString().slice(0, 10) !== dateText
      ) {
        throw new PaymentError(400, "Ngày không hợp lệ.");
      }

      let viewerId: string | null = null;
      try { viewerId = await requirePaymentUser(); } catch (error) {
        if (!(error instanceof PaymentError) || ![401, 503].includes(error.status)) throw error;
      }
      const [items, blocks] = await Promise.all([
        db.bookingItem.findMany({
          where: {
            court: { venueId: venue.id },
            date,
            status: { in: ["HELD", "CONFIRMED"] },
            booking: {
              OR: [
                { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW"] } },
                { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
              ],
            },
          },
          select: {
            courtId: true,
            startMin: true,
            endMin: true,
            status: true,
            booking: {
              select: {
                status: true,
                expiresAt: true,
                userId: true,
                code: true,
                group: { select: { inviteToken: true, closedAt: true } },
              },
            },
          },
        }),
        db.courtBlock.findMany({
          where: { court: { venueId: venue.id }, date },
          select: { courtId: true, startMin: true, endMin: true },
        }),
      ]);

      for (const item of items) {
        let slotStatus: "HELD" | "BOOKED" = "BOOKED";
        let expiresAtStr: string | null = null;

        if (item.booking.status === "PENDING_PAYMENT") {
          // Nếu đơn giữ chỗ đã hết hạn thì bỏ qua, coi là AVAILABLE
          if (!item.booking.expiresAt || item.booking.expiresAt <= now) {
            continue;
          }
          slotStatus = "HELD";
          expiresAtStr = item.booking.expiresAt.toISOString();
        }

        busy.push({
          courtId: item.courtId,
          startMin: item.startMin,
          endMin: item.endMin,
        });

        busySlots.push({
          courtId: item.courtId,
          startMin: item.startMin,
          endMin: item.endMin,
          status: slotStatus,
          expiresAt: expiresAtStr,
          resumePaymentUrl: heldBookingPaymentUrl(item.booking, viewerId, now),
        });
      }

      for (const block of blocks) {
        busy.push({
          courtId: block.courtId,
          startMin: block.startMin,
          endMin: block.endMin,
        });

        busySlots.push({
          courtId: block.courtId,
          startMin: block.startMin,
          endMin: block.endMin,
          status: "BLOCKED",
          expiresAt: null,
        });
      }
    }

    return Response.json(
      {
        serverTime,
        busy,
        busySlots,
        venue: {
          id: venue.id,
          slug: venue.slug,
          name: venue.name,
          description: venue.description || "",
          address: venue.address,
          district: venue.district,
          city: venue.province,
          lat: venue.lat,
          lng: venue.lng,
          openMin: venue.openMin,
          closeMin: venue.closeMin,
          priceFrom: venue.priceFrom,
          ratingAvg: summarizeVenueReviews(venue.id, venue.ratingAvg * venue.ratingCount, venue.ratingCount).average,
          ratingCount: venue.ratingCount + summarizeVenueReviews(venue.id, 0, 0).demoCount,
          demoRatingCount: summarizeVenueReviews(venue.id, 0, 0).demoCount,
          images: venue.images,
          amenities: venue.amenities,
          cancelBeforeHours: venue.cancelBeforeHours,
          paymentMode: venue.paymentMode,
          hasSlotTonight: false,
          courts: venue.courts.map((c) => ({
            id: c.id,
            name: c.name,
            surface: c.surface || "",
            isActive: c.status === "ACTIVE",
          })),
          pricingRules: venue.pricing,
          reviews: [],
        },
      },
      { headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } }
    );
  } catch (error) { return paymentErrorResponse(error); }
}
