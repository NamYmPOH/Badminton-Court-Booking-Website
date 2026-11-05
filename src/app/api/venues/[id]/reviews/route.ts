import { db } from "@/lib/db";
import { getDemoReviews } from "@/data/demo-reviews";
import { summarizeVenueReviews } from "@/lib/review-summary";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
import { z } from "zod";

export const dynamic = "force-dynamic";
const query = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1), rating: z.enum(["all", "1", "2", "3", "4", "5"]).default("all") });
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) throw new PaymentError(400, "Bộ lọc đánh giá không hợp lệ.");
    const venue = await db.venue.findFirst({ where: { slug: params.id, status: "ACTIVE" }, select: { id: true, name: true, slug: true } });
    if (!venue) throw new PaymentError(404, "Không tìm thấy cơ sở đang hoạt động.");
    // Dùng cùng snapshot cho điểm tổng hợp, số trang và danh sách.
    const result = await db.$transaction(async tx => {
      const groups = await tx.review.groupBy({ by: ["rating"], where: { venueId: venue.id }, _count: { _all: true } });
      const realCount = groups.reduce((sum, r) => sum + r._count._all, 0);
      const realSum = groups.reduce((sum, r) => sum + r.rating * r._count._all, 0);
      const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      for (const group of groups) distribution[String(group.rating)] = group._count._all;
      const demo = getDemoReviews(venue.id);
      for (const r of demo) distribution[String(r.rating)]++;
      const filteredDemo = demo.filter(r => parsed.data.rating === "all" || r.rating === Number(parsed.data.rating));
      const filteredCount = parsed.data.rating === "all" ? realCount + demo.length : distribution[parsed.data.rating];
      const totalPages = Math.max(1, Math.ceil(filteredCount / 12));
      const page = Math.min(parsed.data.page, totalPages);
      const real = await tx.review.findMany({
        where: { venueId: venue.id, ...(parsed.data.rating === "all" ? {} : { rating: Number(parsed.data.rating) }) },
        include: { user: { select: { name: true } }, images: { select: { id: true }, orderBy: { position: "asc" } } },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: page * 12,
      });
      const merged = [...real.map(r => ({ id: r.id, userName: r.user.name, rating: r.rating, comment: r.comment || "", createdAt: r.createdAt.toISOString(), isDemo: false, images: r.images.map(image => `/api/review-images/${image.id}`) })), ...filteredDemo]
        .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || a.id.localeCompare(b.id));
      return { summary: { ...summarizeVenueReviews(venue.id, realSum, realCount), distribution }, reviews: merged.slice((page-1)*12, page*12), page, totalPages };
    }, { isolationLevel: "RepeatableRead" });
    return Response.json({ venue, ...result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
