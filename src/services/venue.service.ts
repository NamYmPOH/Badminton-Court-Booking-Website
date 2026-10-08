import type { Venue, VenueFilterParams } from "@/types/venue";
import { db } from "../lib/db";

// Catalogue công khai chỉ gồm cơ sở đã được quản trị viên duyệt trong database.
async function loadVenues(): Promise<Venue[]> {
  const rows = await db.venue.findMany({
    where: { status: "ACTIVE" },
    include: { courts: { orderBy: { sortOrder: "asc" } }, pricing: true },
    orderBy: { name: "asc" },
  });
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
    images: v.images.length ? v.images : ["/images/courts/court-1.svg"],
    amenities: v.amenities,
    cancelBeforeHours: v.cancelBeforeHours,
    paymentMode: v.paymentMode,
    hasSlotTonight: false,
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

export async function getVenues(params?: VenueFilterParams): Promise<Venue[]> {
  let list = [...(await loadVenues())];

  if (params?.q) {
    const query = params.q.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.address.toLowerCase().includes(query) ||
        v.district.toLowerCase().includes(query),
    );
  }

  if (params?.district && params.district !== "all") {
    list = list.filter(
      (v) => v.district.toLowerCase() === params.district?.toLowerCase(),
    );
  }

  if (params?.hasSlotTonight) {
    list = list.filter((v) => v.hasSlotTonight);
  }

  if (params?.maxPrice) {
    list = list.filter((v) => v.priceFrom <= (params.maxPrice ?? Infinity));
  }

  if (params?.amenities && params.amenities.length > 0) {
    list = list.filter((v) =>
      params.amenities?.every((a) => v.amenities.includes(a)),
    );
  }

  if (params?.sort === "rating") {
    list.sort((a, b) => b.ratingAvg - a.ratingAvg);
  } else if (params?.sort === "price_asc") {
    list.sort((a, b) => a.priceFrom - b.priceFrom);
  } else if (params?.sort === "price_desc") {
    list.sort((a, b) => b.priceFrom - a.priceFrom);
  } else {
    // Mặc định khoảng cách
    list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  return list;
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
