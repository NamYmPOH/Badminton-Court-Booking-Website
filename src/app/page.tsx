import Link from "next/link";
export const dynamic = "force-dynamic";
import { BRAND } from "@/lib/config/brand";
import { HeroSearch } from "@/components/features/home/HeroSearch";
import { QuickFilters } from "@/components/features/home/QuickFilters";
import { VenueCard } from "@/components/features/venues/VenueCard";
import { getFeaturedVenues, getTopRatedVenues } from "@/services/venue.service";

export default async function HomePage() {
  const [featuredVenues, topRatedVenues] = await Promise.all([
    getFeaturedVenues(),
    getTopRatedVenues(),
  ]);

  return (
    <div className="relative overflow-hidden pb-16">
      {/* Hero section — nền court-700 với vạch sân SVG (§12.4) */}
      <section className="relative flex min-h-[480px] items-center bg-court-700">
        {/* SVG vạch sân — lệch phải, cắt mép, opacity 20% */}
        <svg
          viewBox="0 0 1340 610"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute -right-20 top-1/2 h-[400px] w-auto -translate-y-1/2 opacity-20 lg:h-[500px]"
          aria-hidden="true"
        >
          <rect x="0" y="0" width="1340" height="610" stroke="white" strokeWidth="6" />
          <line x1="670" y1="0" x2="670" y2="610" stroke="white" strokeWidth="6" />
          <line x1="0" y1="46" x2="1340" y2="46" stroke="white" strokeWidth="6" />
          <line x1="0" y1="564" x2="1340" y2="564" stroke="white" strokeWidth="6" />
          <line x1="472" y1="0" x2="472" y2="610" stroke="white" strokeWidth="6" />
          <line x1="868" y1="0" x2="868" y2="610" stroke="white" strokeWidth="6" />
          <line x1="76" y1="0" x2="76" y2="610" stroke="white" strokeWidth="6" />
          <line x1="1264" y1="0" x2="1264" y2="610" stroke="white" strokeWidth="6" />
          <line x1="0" y1="305" x2="472" y2="305" stroke="white" strokeWidth="6" />
          <line x1="868" y1="305" x2="1340" y2="305" stroke="white" strokeWidth="6" />
        </svg>

        <div className="relative z-10 mx-auto w-full max-w-content px-6 py-16">
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-white lg:text-5xl">
            {BRAND.tagline}
          </h1>
          <p className="mt-4 max-w-md text-lg text-court-200">
            Xem lịch trống theo thời gian thực, đặt sân nhanh chóng, thanh toán an toàn.
          </p>

          {/* Ô tìm kiếm tương tác */}
          <HeroSearch />

          {/* Chip lọc nhanh */}
          <QuickFilters />
        </div>
      </section>

      {/* Gần bạn — Danh sách VenueCard thực tế */}
      <section className="mx-auto max-w-content px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">Gần bạn</h2>
            <p className="mt-1 text-sm text-muted">
              Các sân cầu lông được tìm thấy theo vị trí xung quanh bạn
            </p>
          </div>
          <Link
            href="/venues"
            className="text-sm font-semibold text-court-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      {/* Đánh giá cao nhất — Danh sách VenueCard thực tế */}
      <section className="mx-auto max-w-content px-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">Đánh giá cao nhất</h2>
            <p className="mt-1 text-sm text-muted">
              Cơ sở đạt chuẩn thi đấu và được người chơi khen ngợi nhiều nhất
            </p>
          </div>
          <Link
            href="/venues?sort=rating"
            className="text-sm font-semibold text-court-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topRatedVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-content flex-col gap-4 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {BRAND.name}. Tất cả quyền được bảo lưu.</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/venues" className="hover:text-ink">
              Danh sách sân
            </Link>
            <Link href="/venues?view=map" className="hover:text-ink">
              Bản đồ sân
            </Link>
            <Link href="/account" className="hover:text-ink">
              Hỗ trợ
            </Link>
            <Link href="/login" className="hover:text-ink">
              Dành cho chủ sân
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
