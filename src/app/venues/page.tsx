import Link from "next/link";
import { getVenues } from "@/services/venue.service";
import { VenueCard } from "@/components/features/venues/VenueCard";
import { MapPin, List, SlidersHorizontal, Search } from "lucide-react";

interface VenuesPageProps {
  searchParams: {
    q?: string;
    district?: string;
    view?: string;
    sort?: "distance" | "rating" | "price_asc" | "price_desc";
    hasSlotTonight?: string;
    amenity?: string;
    maxPrice?: string;
  };
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const isMapView = searchParams.view === "map";
  const query = searchParams.q || "";
  const district = searchParams.district || "all";
  const sort = searchParams.sort || "distance";
  const hasSlotTonight = searchParams.hasSlotTonight === "true";
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined;
  const amenities = searchParams.amenity ? [searchParams.amenity] : undefined;

  const venues = await getVenues({
    q: query,
    district: district !== "all" ? district : undefined,
    sort,
    hasSlotTonight,
    maxPrice,
    amenities,
  });

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      {/* Tiêu đề & thanh công cụ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-3xl">
            {isMapView ? "Bản đồ sân cầu lông" : "Danh sách sân cầu lông"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tìm thấy {venues.length} cơ sở phù hợp với nhu cầu của bạn
          </p>
        </div>

        {/* Chuyển đổi Danh sách / Bản đồ */}
        <div className="flex items-center gap-2 self-start rounded-control border border-border bg-surface p-1">
          <Link
            href={`/venues?${new URLSearchParams({
              ...(query ? { q: query } : {}),
              ...(district !== "all" ? { district } : {}),
              ...(sort ? { sort } : {}),
            }).toString()}`}
            className={`inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold transition ${
              !isMapView
                ? "bg-court-600 text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            <List size={15} />
            <span>Danh sách</span>
          </Link>

          <Link
            href={`/venues?${new URLSearchParams({
              ...(query ? { q: query } : {}),
              ...(district !== "all" ? { district } : {}),
              view: "map",
            }).toString()}`}
            className={`inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold transition ${
              isMapView
                ? "bg-court-600 text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            <MapPin size={15} />
            <span>Bản đồ</span>
          </Link>
        </div>
      </div>

      {/* Dải bộ lọc nhanh */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-border pb-6">
        {/* Lọc theo quận */}
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <SlidersHorizontal size={15} className="text-court-600" />
          <span className="font-medium text-ink">Quận:</span>
        </div>
        {["all", "Thanh Xuân", "Tây Hồ", "Nam Từ Liêm", "Long Biên", "Hà Đông"].map(
          (d) => (
            <Link
              key={d}
              href={`/venues?${new URLSearchParams({
                ...(query ? { q: query } : {}),
                district: d,
                ...(isMapView ? { view: "map" } : {}),
                sort,
              }).toString()}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                district.toLowerCase() === d.toLowerCase()
                  ? "bg-court-600 text-white"
                  : "border border-border bg-surface text-muted hover:bg-court-50 dark:hover:bg-surface/80"
              }`}
            >
              {d === "all" ? "Tất cả" : d}
            </Link>
          )
        )}

        {/* Lọc Còn trống tối nay */}
        <Link
          href={`/venues?${new URLSearchParams({
            ...(query ? { q: query } : {}),
            ...(district !== "all" ? { district } : {}),
            hasSlotTonight: hasSlotTonight ? "false" : "true",
            ...(isMapView ? { view: "map" } : {}),
          }).toString()}`}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            hasSlotTonight
              ? "bg-racket-500 font-semibold text-court-900"
              : "border border-border bg-surface text-muted hover:bg-court-50"
          }`}
        >
          {hasSlotTonight ? "✓ Còn trống tối nay" : "+ Còn trống tối nay"}
        </Link>
      </div>

      {/* Nội dung: Chế độ Bản đồ hoặc Danh sách */}
      {isMapView ? (
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Cột trái: Giả lập bản đồ tương tác với các ghim sân */}
          <div className="relative min-h-[480px] flex-1 overflow-hidden rounded-card border border-border bg-court-950/10 p-6 dark:bg-court-950/40">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {/* Minh hoạ bản đồ với các điểm ghim */}
              <div className="relative h-64 w-full max-w-lg rounded-card border border-court-200/50 bg-court-100/50 p-4 shadow-inner dark:border-court-800/50 dark:bg-surface/40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-court-700 dark:text-court-300">
                    Bản đồ tương tác khu vực Hà Nội (OpenStreetMap)
                  </span>
                </div>
                {venues.map((v, idx) => (
                  <div
                    key={v.id}
                    style={{
                      top: `${25 + idx * 18}%`,
                      left: `${20 + idx * 16}%`,
                    }}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-1 rounded-full bg-court-600 px-2 py-1 text-[11px] font-bold text-white shadow-md transition hover:scale-110"
                  >
                    <MapPin size={12} />
                    <span>{v.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                Bấm vào từng sân bên phải để xem thông tin chi tiết và đặt lịch
              </p>
            </div>
          </div>

          {/* Cột phải: Danh sách các sân */}
          <div className="flex w-full flex-col gap-4 lg:w-96">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </div>
      ) : (
        /* Chế độ danh sách thẻ */
        <div className="mt-8">
          {venues.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-8 text-center">
              <span className="text-4xl">🏸</span>
              <h3 className="mt-3 text-lg font-bold text-ink">
                Không tìm thấy sân phù hợp
              </h3>
              <p className="mt-1 text-sm text-muted">
                Thử thay đổi bộ lọc quận huyện hoặc từ khoá tìm kiếm
              </p>
              <Link
                href="/venues"
                className="mt-4 inline-flex items-center rounded-control bg-court-600 px-4 py-2 text-xs font-semibold text-white hover:bg-court-700"
              >
                Xoá bộ lọc
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
