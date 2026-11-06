import type { Venue, VenueFilterParams, VenueSearchSuggestion } from "@/types/venue";
import { db } from "@/lib/db";
import { matchesVietnamese } from "@/lib/utils/vietnamese";
import { calculateMatchScore } from "@/lib/utils/search-ranker";
import { summarizeVenueReviews } from "../lib/review-summary";
import { MOCK_VENUES } from "@/data/venues.data";
import { cachedPublicData, recordPublicCacheDbQueries } from "../lib/public-cache";
import { PaymentError } from "../lib/payment-error";

/**
 * Chỉ cache catalog dùng chung; lọc theo thời gian và ưu tiên chủ sân chạy sau cache.
 * Dữ liệu demo khi database lỗi/rỗng không được ghi vào Redis.
 */
async function loadVenues(): Promise<Venue[]> {
  try {
    const venues = await cachedPublicData("venues", loadDatabaseVenues, {
      shouldCache: (value) => value.length > 0,
    });
    if (venues.length > 0) return venues;
  } catch (err) {
    // Giữ giới hạn tải của cache, không che lỗi quá tải bằng dữ liệu demo.
    if (err instanceof PaymentError) throw err;
    console.warn("[VENUE_SERVICE_DB_FALLBACK] Database unavailable; using demo catalog.");
  }

  return MOCK_VENUES.map(venue => { const summary = summarizeVenueReviews(venue.id, venue.reviews.reduce((sum, r) => sum + r.rating, 0), venue.reviews.length); return { ...venue, ratingAvg: summary.average, ratingCount: summary.count, demoRatingCount: summary.demoCount }; });
}

async function loadDatabaseVenues(): Promise<Venue[]> {
  recordPublicCacheDbQueries(1);
  const rows = await db.venue.findMany({
    where: { status: "ACTIVE" },
    include: { courts: { orderBy: { sortOrder: "asc" } }, pricing: true },
    orderBy: { name: "asc" },
  });

  if (rows && rows.length > 0) {
    recordPublicCacheDbQueries(1);
    const ratings = await db.review.groupBy({ by: ["venueId"], where: { venueId: { in: rows.map(v => v.id) } }, _avg: { rating: true }, _count: { _all: true } });
    const ratingByVenue = new Map(ratings.map(r => [r.venueId, r]));
    return rows.map((v) => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      description: v.description || "",
      address: v.address,
      district: v.district,
      city: v.province,
      lat: v.lat,
      lng: v.lng,
      openMin: v.openMin,
      closeMin: v.closeMin,
      priceFrom: v.priceFrom,
      ratingAvg: summarizeVenueReviews(v.id, (ratingByVenue.get(v.id)?._avg.rating || 0) * (ratingByVenue.get(v.id)?._count._all || 0), ratingByVenue.get(v.id)?._count._all || 0).average,
      ratingCount: summarizeVenueReviews(v.id, 0, ratingByVenue.get(v.id)?._count._all || 0).count,
      demoRatingCount: summarizeVenueReviews(v.id, 0, 0).demoCount,
      images: v.images && v.images.length ? v.images : ["/images/courts/court-1.svg"],
      amenities: v.amenities,
      cancelBeforeHours: v.cancelBeforeHours,
      paymentMode: v.paymentMode,
      hasSlotTonight: v.courts.some((c) => c.status === "ACTIVE"),
      courts: v.courts.map((c) => ({
        id: c.id,
        name: c.name,
        surface: c.surface || "",
        isActive: c.status === "ACTIVE",
      })),
      pricingRules: v.pricing.map((rule) => ({
        id: rule.id,
        daysOfWeek: rule.daysOfWeek,
        startMin: rule.startMin,
        endMin: rule.endMin,
        walkInPrice: rule.walkInPrice,
        fixedPrice: rule.fixedPrice,
      })),
      reviews: [],
      ownerId: v.ownerId,
      status: v.status,
    }));
  }
  return [];
}

/**
 * Lọc và tìm kiếm sân cầu lông đa tiêu chí (Tên sân, Quận/Huyện, Khoảng giá, Sân trống, Tiện ích, Sắp xếp)
 * Hỗ trợ tiếng Việt có dấu và không dấu hoàn chỉnh.
 */
export async function getVenues(params?: VenueFilterParams, ownerUserId?: string): Promise<Venue[]> {
  let list = [...(await loadVenues())];

  // 1. Tìm kiếm theo từ khóa (Tên sân, Địa chỉ, Quận/Huyện, Mô tả)
  if (params?.q && params.q.trim()) {
    const query = params.q.trim();
    list = list.filter(
      (v) =>
        matchesVietnamese(v.name, query) ||
        matchesVietnamese(v.address, query) ||
        matchesVietnamese(v.district, query) ||
        matchesVietnamese(v.description, query),
    );
  }

  // 2. Lọc theo Quận/Huyện
  if (params?.district && params.district !== "all") {
    list = list.filter((v) =>
      matchesVietnamese(v.district, params.district as string),
    );
  }

  // 3. Lọc theo Khoảng giá (minPrice, maxPrice)
  if (params?.minPrice !== undefined) {
    list = list.filter((v) => v.priceFrom >= (params.minPrice as number));
  }
  if (params?.maxPrice !== undefined) {
    list = list.filter((v) => v.priceFrom <= (params.maxPrice as number));
  }

  // 4. Lọc theo Còn sân trống tối nay
  if (params?.hasSlotTonight) {
    list = list.filter((v) => v.hasSlotTonight);
  }

  // 5. Lọc Đang mở cửa
  if (params?.isOpenNow) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    list = list.filter(
      (v) => currentMinutes >= v.openMin && currentMinutes < v.closeMin,
    );
  }

  // 6. Lọc theo Tiện ích
  if (params?.amenities && params.amenities.length > 0) {
    list = list.filter((v) =>
      params.amenities?.every((a) => v.amenities.includes(a)),
    );
  }

  // 7. Sắp xếp kết quả
  if (params?.sort === "rating") {
    list.sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (params?.sort === "price_asc") {
    list.sort((a, b) => a.priceFrom - b.priceFrom);
  } else if (params?.sort === "price_desc") {
    list.sort((a, b) => b.priceFrom - a.priceFrom);
  } else {
    // Mặc định: Ưu tiên khoảng cách gần hoặc đánh giá cao
    list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    // Ưu tiên các sân thuộc sở hữu của chủ sân trên danh sách mặc định (không phá bộ lọc/tìm kiếm)
    if (ownerUserId && !params?.q && (!params?.district || params?.district === "all")) {
      list.sort((a, b) => (b.ownerId === ownerUserId ? 1 : 0) - (a.ownerId === ownerUserId ? 1 : 0));
    }
  }

  return list;
}

/**
 * Gợi ý tìm kiếm nhanh (Autocomplete Suggestions) cho ô search
 * Hỗ trợ tìm kiếm gần đúng (Fuzzy), không phân biệt hoa/thường, dấu/không dấu,
 * xếp hạng theo độ liên quan và phân biệt ưu tiên khu vực (district) vs tên sân (venue).
 */
export async function searchVenueSuggestions(
  keyword: string,
  limit: number = 6,
  priority: "district" | "venue" = "venue"
): Promise<VenueSearchSuggestion[]> {
  if (!keyword || !keyword.trim()) return [];

  const trimmedQuery = keyword.trim();
  const allVenues = await loadVenues();

  // 1. Tập hợp các khu vực quận/huyện độc nhất và thống kê số sân
  const districtMap = new Map<string, { count: number; sampleImage: string }>();
  for (const v of allVenues) {
    if (!v.district) continue;
    const existing = districtMap.get(v.district);
    if (existing) {
      existing.count += 1;
    } else {
      districtMap.set(v.district, {
        count: 1,
        sampleImage: v.images[0] || "/images/courts/court-1.svg",
      });
    }
  }

  type ScoredSuggestion = VenueSearchSuggestion & { _score: number };
  const candidates: ScoredSuggestion[] = [];

  // 2. Tính điểm độ liên quan cho các khu vực (districts)
  for (const [districtName, meta] of Array.from(districtMap.entries())) {
    const match = calculateMatchScore(districtName, trimmedQuery);
    if (match.matched && match.score >= 150) {
      // Nếu ưu tiên khu vực (HeroSearch), tăng trọng số để khu vực nổi lên đầu
      const priorityBonus = priority === "district" ? 400 : 0;
      candidates.push({
        type: "district",
        id: `district-${districtName}`,
        name: `Khu vực ${districtName}`,
        slug: `district-${encodeURIComponent(districtName)}`,
        address: `${meta.count} cơ sở sân cầu lông đang hoạt động`,
        district: districtName,
        priceFrom: 0,
        ratingAvg: 0,
        images: [meta.sampleImage],
        venueCount: meta.count,
        _score: match.score + priorityBonus,
      });
    }
  }

  // 3. Tính điểm độ liên quan cho từng sân (venues)
  for (const v of allVenues) {
    const nameMatch = calculateMatchScore(v.name, trimmedQuery);
    const districtMatch = calculateMatchScore(v.district, trimmedQuery);
    const addressMatch = calculateMatchScore(v.address, trimmedQuery);

    let bestScore = 0;
    if (nameMatch.matched) {
      bestScore = Math.max(bestScore, nameMatch.score);
    }
    if (districtMatch.matched) {
      bestScore = Math.max(bestScore, districtMatch.score * 0.85);
    }
    if (addressMatch.matched) {
      bestScore = Math.max(bestScore, addressMatch.score * 0.7);
    }

    if (bestScore >= 150) {
      // Nếu ưu tiên tên sân (NavbarSearch), cộng điểm thưởng lớn khi khớp tên sân
      const priorityBonus = priority === "venue" && nameMatch.matched ? 450 : 0;
      candidates.push({
        type: "venue",
        id: v.id,
        name: v.name,
        slug: v.slug,
        address: v.address,
        district: v.district,
        priceFrom: v.priceFrom,
        ratingAvg: v.ratingAvg,
        demoRatingCount: v.demoRatingCount,
        images: v.images,
        _score: bestScore + priorityBonus,
      });
    }
  }

  // 4. Xếp hạng toàn bộ theo điểm độ liên quan giảm dần (Exact -> Prefix -> Substring -> Fuzzy)
  candidates.sort((a, b) => {
    if (b._score !== a._score) {
      return b._score - a._score;
    }
    return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
  });

  return candidates.slice(0, limit).map(({ _score, ...item }) => item);
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const venue = (await loadVenues()).find((v) => v.slug === slug);
  if (!venue) return null;
  if (!process.env.DATABASE_URL) return venue;
  try {
  const reviews = await db.review.findMany({ where: { venueId: venue.id }, include: { user: { select: { name: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 100 });
  return { ...venue, reviews: reviews.map(r => ({ id: r.id, userName: r.user.name, rating: r.rating, comment: r.comment || "", createdAt: r.createdAt.toISOString().slice(0, 10) })) };
  } catch { return { ...venue, reviewsUnavailable: true }; }
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const venue = (await loadVenues()).find((v) => v.id === id);
  return venue ?? null;
}

export async function getFeaturedVenues(): Promise<Venue[]> {
  // Trả về danh sách sân gần bạn nhất
  return [...(await loadVenues())]
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 3);
}

export async function getTopRatedVenues(): Promise<Venue[]> {
  // Trả về danh sách sân đánh giá cao nhất
  return [...(await loadVenues())]
    .sort((a, b) => b.ratingAvg - a.ratingAvg)
    .slice(0, 3);
}
