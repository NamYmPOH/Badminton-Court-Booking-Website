import { getVenueEffectiveHours } from "@/services/schedule.service";
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
    const busy: { courtId: string; startMin: number; endMin: number; status: "HELD" | "CONFIRMED" | "BLOCKED" }[] = [];
    if (dateText) {
      const date = new Date(`${dateText}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dateText) throw new PaymentError(400, "Ngày không hợp lệ.");
      const [items, blocks] = await Promise.all([
        db.bookingItem.findMany({
          where: {
            court: { venueId: venue.id },
            date,
            status: { in: ["HELD", "CONFIRMED"] },
            booking: {
              OR: [
                { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW"] } },
                { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } },
              ],
            },
          },
          select: { courtId: true, startMin: true, endMin: true, status: true },
        }),
        db.courtBlock.findMany({ where: { court: { venueId: venue.id }, date }, select: { courtId: true, startMin: true, endMin: true } }),
      ]);
      for (const item of items) {
        busy.push({
          courtId: item.courtId,
          startMin: item.startMin,
          endMin: item.endMin,
          status: item.status === "HELD" ? "HELD" : "CONFIRMED",
        });
      }
      for (const block of blocks) {
        busy.push({
          courtId: block.courtId,
          startMin: block.startMin,
          endMin: block.endMin,
          status: "BLOCKED",
        });
      }
    }
    const hours = dateText ? await getVenueEffectiveHours(db, venue.id, dateText) : { isOpen: true, openMin: venue.openMin, closeMin: venue.closeMin };
    return Response.json({ busy, venue: {
      id: venue.id, slug: venue.slug, name: venue.name, description: venue.description || "",
      address: venue.address, district: venue.district, city: venue.province, lat: venue.lat, lng: venue.lng,
      openMin: hours.isOpen ? hours.openMin : 0, closeMin: hours.isOpen ? hours.closeMin : 0, priceFrom: venue.priceFrom,
      ratingAvg: venue.ratingAvg, ratingCount: venue.ratingCount, images: venue.images, amenities: venue.amenities,
      cancelBeforeHours: venue.cancelBeforeHours, paymentMode: venue.paymentMode, hasSlotTonight: false,
      courts: venue.courts.map((c, index) => {
        const defaultRow = Math.floor(index / 3) + 1;
        const defaultCol = (index % 3) + 1;
        return {
          id: c.id,
          name: c.name,
          surface: c.surface || "",
          status: c.status,
          isActive: c.status === "ACTIVE",
          description: c.description || null,
          sortOrder: c.sortOrder,
          positionRow: c.positionRow && c.positionRow > 0 ? c.positionRow : defaultRow,
          positionCol: c.positionCol && c.positionCol > 0 ? c.positionCol : defaultCol,
          orientation: c.orientation === "VERTICAL" ? "VERTICAL" : "HORIZONTAL",
          hasCustomPricing: venue.pricing.some(r => r.courtId === c.id),
        };
      }),
      pricingRules: venue.pricing, reviews: [],
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
