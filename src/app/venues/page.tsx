import Link from "next/link";
import { getVenues } from "@/services/venue.service";
import { VenueCard } from "@/components/features/venues/VenueCard";
import { VenuesMap } from "@/components/features/venues/VenuesMap";
import { VenueSearchFilter } from "@/components/features/venues/VenueSearchFilter";

interface VenuesPageProps {
  searchParams: {
    q?: string;
    district?: string;
    view?: string;
    sort?: "distance" | "rating" | "price_asc" | "price_desc";
    hasSlotTonight?: string;
    isOpenNow?: string;
    amenity?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const isMapView = searchParams.view === "map";
  const query = searchParams.q || "";
  const district = searchParams.district || "all";
  const sort = searchParams.sort || "distance";
  const hasSlotTonight = searchParams.hasSlotTonight === "true";
  const isOpenNow = searchParams.isOpenNow === "true";
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice, 10) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined;
  const amenities = searchParams.amenity ? [searchParams.amenity] : undefined;

  const venues = await getVenues({
    q: query,
    district: district !== "all" ? district : undefined,
    sort,
    hasSlotTonight,
    isOpenNow,
    minPrice,
    maxPrice,
    amenities,
  });

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      {/* Bộ lọc tìm kiếm toàn diện */}
      <VenueSearchFilter totalResults={venues.length} />

      {/* Nội dung: Chế độ Bản đồ hoặc Danh sách */}
      {isMapView ? (
        <div className="mt-6">
          <VenuesMap venues={venues} />
        </div>
      ) : (
        /* Chế độ danh sách thẻ sân */
        <div className="mt-8">
          {venues.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[340px] flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-8 text-center shadow-sm">
              <span className="text-5xl">🏸</span>
              <h3 className="mt-4 text-lg font-bold text-ink">
                Không tìm thấy sân phù hợp
              </h3>
              <p className="mt-1.5 max-w-md text-sm text-muted">
                {query
                  ? `Không có sân cầu lông nào khớp với từ khóa "${query}". Thử tìm theo quận huyện khác hoặc xóa bớt tiêu chí lọc.`
                  : "Không có sân cầu lông nào khớp với các bộ lọc bạn đã chọn. Vui lòng mở rộng khoảng giá hoặc chọn quận khác."}
              </p>
              <Link
                href="/venues"
                className="mt-5 inline-flex items-center rounded-control bg-court-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-court-700"
              >
                Xóa tất cả bộ lọc
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
