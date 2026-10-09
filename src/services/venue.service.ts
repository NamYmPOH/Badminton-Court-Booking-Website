import type { Venue, VenueFilterParams, VenueSearchSuggestion } from "@/types/venue";
import { db } from "@/lib/db";
import { matchesVietnamese } from "@/lib/utils/vietnamese";
import { MOCK_VENUES } from "@/data/venues.data";

/**
 * Tải danh sách sân từ Database.
 * Nếu cơ sở dữ liệu chưa sẵn sàng hoặc rỗng, tự động kích hoạt fallback sang MOCK_VENUES (100 sân).
 */
async function loadVenues(): Promise<Venue[]> {
  try {
    const rows = await db.venue.findMany({
      where: { status: "ACTIVE" },
      include: { courts: { orderBy: { sortOrder: "asc" } }, pricing: true },
      orderBy: { name: "asc" },
    });

    if (rows && rows.length > 0) {
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
        ratingAvg: v.ratingAvg,
        ratingCount: v.ratingCount,
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
        pricingRules: v.pricing,
        reviews: [],
      }));
    }
  } catch (err) {
    // Database chưa kết nối, sử dụng MOCK_VENUES để đảm bảo trải nghiệm người dùng
    console.warn("[VENUE_SERVICE_DB_FALLBACK] Database offline, using MOCK_VENUES:", err instanceof Error ? err.message : String(err));
  }

  return MOCK_VENUES;
}

/**
 * Lọc và tìm kiếm sân cầu lông đa tiêu chí (Tên sân, Quận/Huyện, Khoảng giá, Sân trống, Tiện ích, Sắp xếp)
 * Hỗ trợ tiếng Việt có dấu và không dấu hoàn chỉnh.
 */
export async function getVenues(params?: VenueFilterParams): Promise<Venue[]> {
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
      (v) => currentMinutes >= v.openMin && currentMinutes <= v.closeMin,
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
  }

  return list;
}

/**
 * Gợi ý tìm kiếm nhanh (Autocomplete Suggestions) cho ô search
 */
export async function searchVenueSuggestions(
  keyword: string,
  limit: number = 6,
): Promise<VenueSearchSuggestion[]> {
  if (!keyword || !keyword.trim()) return [];

  const venues = await getVenues({ q: keyword.trim() });

  return venues.slice(0, limit).map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    address: v.address,
    district: v.district,
    priceFrom: v.priceFrom,
    ratingAvg: v.ratingAvg,
    images: v.images,
  }));
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const venue = (await loadVenues()).find((v) => v.slug === slug);
  return venue ?? null;
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
