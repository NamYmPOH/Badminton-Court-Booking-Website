import type { Venue, VenueFilterParams } from "@/types/venue";
import { MOCK_VENUES } from "../data/venues.data";

export { MOCK_VENUES };


export async function getVenues(params?: VenueFilterParams): Promise<Venue[]> {
  let list = [...MOCK_VENUES];

  if (params?.q) {
    const query = params.q.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.address.toLowerCase().includes(query) ||
        v.district.toLowerCase().includes(query)
    );
  }

  if (params?.district && params.district !== "all") {
    list = list.filter((v) => v.district.toLowerCase() === params.district?.toLowerCase());
  }

  if (params?.hasSlotTonight) {
    list = list.filter((v) => v.hasSlotTonight);
  }

  if (params?.maxPrice) {
    list = list.filter((v) => v.priceFrom <= (params.maxPrice ?? Infinity));
  }

  if (params?.amenities && params.amenities.length > 0) {
    list = list.filter((v) =>
      params.amenities?.every((a) => v.amenities.includes(a))
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
  const venue = MOCK_VENUES.find((v) => v.slug === slug);
  return venue ?? null;
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const venue = MOCK_VENUES.find((v) => v.id === id);
  return venue ?? null;
}

export async function getFeaturedVenues(): Promise<Venue[]> {
  // Trả về danh sách sân gần bạn nhất
  return [...MOCK_VENUES].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)).slice(0, 3);
}

export async function getTopRatedVenues(): Promise<Venue[]> {
  // Trả về danh sách sân đánh giá cao nhất
  return [...MOCK_VENUES].sort((a, b) => b.ratingAvg - a.ratingAvg).slice(0, 3);
}
