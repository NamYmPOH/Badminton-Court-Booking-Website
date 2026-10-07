import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import { getVenueBySlug } from "@/services/venue.service";
import { formatVND } from "@/lib/utils";
import {
  Star,
  MapPin,
  Clock,
  Heart,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface VenueDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const venue = await getVenueBySlug(params.slug);

  if (!venue) {
    notFound();
  }

  const formatHour = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const amenityLabels: Record<string, string> = {
    AC: "Điều hoà nhiệt độ",
    PARKING: "Chỗ đậu ô tô & xe máy",
    RACKET_RENTAL: "Cho thuê & đan vợt",
    CANTEEN: "Căng-tin nước uống",
    SHOWER: "Phòng tắm nóng lạnh",
    WIFI: "Wi-Fi miễn phí",
  };

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      {/* Breadcrumb điều hướng */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/venues" className="hover:text-ink">
          Sân cầu lông
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{venue.name}</span>
      </nav>

      {/* Bộ sưu tập hình ảnh */}
      <div className="grid gap-3 overflow-hidden rounded-container md:grid-cols-3">
        <div className="relative h-[320px] w-full md:col-span-2 md:h-[400px]">
          <Image
            src={venue.images[0]}
            alt={venue.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
          />
        </div>
        <div className="hidden flex-col gap-3 md:flex">
          {venue.images.slice(1, 3).map((img, i) => (
            <div key={i} className="relative h-[194px] w-full">
              <Image
                src={img}
                alt={`${venue.name} ${i + 2}`}
                fill
                sizes="33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Thông tin chính & Cột đặt sân */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cột trái (2 phần): Thông tin, Bảng giá, Sân, Đánh giá */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header cơ sở */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {venue.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span>{venue.ratingAvg.toFixed(1)}</span>
                    <span className="text-muted">({venue.ratingCount} đánh giá)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin size={15} className="text-court-500" />
                    <span>{venue.address}, {venue.district}</span>
                  </div>
                </div>
              </div>

              {/* Nút chia sẻ & Lưu */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-muted transition hover:bg-court-50"
                  aria-label="Chia sẻ"
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-muted transition hover:bg-court-50"
                  aria-label="Yêu thích"
                >
                  <Heart size={16} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-court-50 px-3 py-1 text-xs font-semibold text-court-700 dark:bg-court-950/60 dark:text-court-300">
                <Clock size={13} />
                Mở cửa: {formatHour(venue.openMin)} – {formatHour(venue.closeMin)}
              </span>
              {venue.hasSlotTonight && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ✓ Còn lịch trống tối nay
                </span>
              )}
              <span className="rounded-full bg-surface border border-border px-3 py-1 text-xs font-medium text-muted">
                {venue.courts.length} sân tiêu chuẩn
              </span>
            </div>
          </div>

          {/* Giới thiệu */}
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-ink">Tổng quan cơ sở</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {venue.description}
            </p>

            <h3 className="mt-6 text-sm font-bold text-ink">Tiện ích sân bãi</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {venue.amenities.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-control border border-border/80 bg-court-50/50 p-2.5 text-xs font-medium text-ink dark:bg-surface/50"
                >
                  <CheckCircle2 size={15} className="text-court-600" />
                  <span>{amenityLabels[item] || item}</span>
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-bold text-ink">Chính sách huỷ đặt</h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>
                Miễn phí huỷ lịch trước giờ chơi tối thiểu {venue.cancelBeforeHours} giờ.
              </span>
            </div>
          </div>

          {/* Bảng giá theo khung giờ */}
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-ink">Bảng giá tham khảo</h2>
            <p className="mt-1 text-xs text-muted">
              Giá tính theo đơn vị giờ (VNĐ/giờ). Đặt trực tuyến hỗ trợ ô 30 phút.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-court-50/60 text-muted dark:bg-surface/60">
                    <th className="p-3 font-semibold">Khung ngày</th>
                    <th className="p-3 font-semibold">Khung giờ</th>
                    <th className="p-3 font-semibold">Giá vãng lai</th>
                    <th className="p-3 font-semibold">Giá cố định</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {venue.pricingRules.map((rule) => {
                    const days =
                      rule.daysOfWeek.length === 5
                        ? "Thứ 2 – Thứ 6"
                        : "Thứ 7 – Chủ nhật";
                    return (
                      <tr key={rule.id} className="hover:bg-court-50/30">
                        <td className="p-3 font-medium text-ink">{days}</td>
                        <td className="p-3 text-muted">
                          {formatHour(rule.startMin)} – {formatHour(rule.endMin)}
                        </td>
                        <td className="p-3 font-bold text-court-600">
                          {formatVND(rule.walkInPrice)}
                        </td>
                        <td className="p-3 font-medium text-ink">
                          {formatVND(rule.fixedPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Danh sách sân thi đấu */}
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-ink">Danh sách các sân</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {venue.courts.map((court) => (
                <div
                  key={court.id}
                  className="flex items-center justify-between rounded-control border border-border p-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-ink">{court.name}</h4>
                    <p className="text-xs text-muted">{court.surface}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Sẵn sàng
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Đánh giá từ người chơi */}
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-ink">
              Đánh giá từ người chơi ({venue.reviews.length})
            </h2>
            <div className="mt-4 space-y-4">
              {venue.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="border-b border-border/60 pb-4 last:border-none last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink">
                      {rev.userName}
                    </span>
                    <span className="text-xs text-muted">{rev.createdAt}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Thẻ đặt sân cố định (Sticky Booking Card) */}
        <div>
          <div className="sticky top-20 rounded-card border border-border bg-surface p-6 shadow-md">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-muted">Giá từ</span>
                <div className="text-2xl font-black text-court-600">
                  {formatVND(venue.priceFrom)}
                  <span className="text-xs font-normal text-muted">/giờ</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{venue.ratingAvg.toFixed(1)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-control border border-border bg-court-50/40 p-3.5 dark:bg-court-950/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Phương thức:</span>
                <span className="font-semibold text-ink">
                  {venue.paymentMode === "AT_VENUE"
                    ? "VNPAY hoặc Trả tại sân"
                    : "Thanh toán VNPAY"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Thời gian giữ chỗ:</span>
                <span className="font-semibold text-ink">10 phút</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Quy cách ô:</span>
                <span className="font-semibold text-ink">30 phút / ô</span>
              </div>
            </div>

            <Link
              href={`/venues/${venue.slug}/book`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-control bg-racket-500 py-3.5 text-center text-sm font-bold text-court-900 transition-colors hover:bg-racket-600"
            >
              <Calendar size={18} />
              <span>Xem lịch trống và đặt sân</span>
            </Link>

            <p className="mt-3 text-center text-xs text-muted">
              Không thu thêm bất kỳ phụ phí nào
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
