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
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  CreditCard,
  Timer,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { VenueDetailActions } from "@/components/features/venues/VenueDetailActions";

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

  // Định dạng phút sang chuỗi giờ 24h chuẩn Việt Nam (HH:MM)
  const formatHour = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const amenityLabels: Record<string, string> = {
    AC: "Điều hoà nhiệt độ",
    AIRCON: "Điều hoà nhiệt độ",
    PARKING: "Chỗ đậu ô tô & xe máy",
    RACKET_RENTAL: "Cho thuê & đan vợt",
    CANTEEN: "Căng-tin nước uống",
    SHOWER: "Phòng tắm nóng lạnh",
    WIFI: "Wi-Fi tốc độ cao",
    SHUTTLE_SALE: "Bán cầu thi đấu",
    LOCKER: "Tủ đồ cá nhân",
  };

  const images = venue.images && venue.images.length > 0
    ? venue.images
    : ["/images/courts/court-1.svg"];

  return (
    <div className="mx-auto max-w-content px-4 py-8 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 md:pb-12">
      {/* Breadcrumb điều hướng phân cấp */}
      <nav className="mb-5 flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/venues" className="hover:text-ink">
          Sân cầu lông
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink line-clamp-1">{venue.name}</span>
      </nav>

      {/* Bộ sưu tập hình ảnh cơ sở */}
      <div className="grid gap-3 overflow-hidden rounded-container md:grid-cols-3">
        <div className={`relative h-[280px] w-full md:h-[380px] ${images.length > 1 ? "md:col-span-2" : "md:col-span-3"}`}>
          <Image
            src={images[0]}
            alt={venue.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
            className="object-cover"
          />
        </div>

        {images.length > 1 && (
          <div className="hidden flex-col gap-3 md:flex">
            {images.slice(1, 3).map((img, i) => (
              <div key={i} className="relative h-[184px] w-full overflow-hidden">
                <Image
                  src={img}
                  alt={`${venue.name} - Ảnh ${i + 2}`}
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thông tin chính & Cột đặt sân */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cột trái (2 cột): Thông tin, Bảng giá, Danh sách sân, Đánh giá */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header cơ sở */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {venue.name}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm text-muted">
                  {venue.ratingCount > 0 ? (
                    <div className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star size={16} className="fill-amber-400 text-amber-400" />
                      <span>{venue.ratingAvg.toFixed(1)}</span>
                      <span className="font-normal text-muted">({venue.ratingCount} đánh giá)</span>
                    </div>
                  ) : (
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Sân mới chưa có đánh giá
                    </span>
                  )}
                  <span>•</span>
                  <div className="flex items-center gap-1 text-ink">
                    <MapPin size={15} className="text-court-500 shrink-0" />
                    <span>{venue.address}, {venue.district}</span>
                  </div>
                </div>
              </div>

              {/* Nút chia sẻ & Lưu yêu thích hoạt động thực tế */}
              <VenueDetailActions venueId={venue.id} venueName={venue.name} />
            </div>

            {/* Các huy hiệu trạng thái & đặc tính */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-court-50 px-3 py-1 text-xs font-semibold text-court-700 dark:bg-court-950/60 dark:text-court-300">
                <Clock size={13} />
                Giờ mở cửa: {formatHour(venue.openMin)} – {formatHour(venue.closeMin)}
              </span>
              {venue.hasSlotTonight && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Còn lịch trống tối nay
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
                <Layers size={13} className="text-court-500" />
                {venue.courts.length} sân thi đấu
              </span>
            </div>
          </div>

          {/* Giới thiệu & Tiện ích */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Tổng quan cơ sở</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {venue.description}
            </p>

            <h3 className="mt-6 text-sm font-bold text-ink">Tiện ích sân bãi</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {venue.amenities.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-control border border-border/80 bg-court-50/40 p-2.5 text-xs font-medium text-ink dark:bg-surface/50"
                >
                  <CheckCircle2 size={15} className="shrink-0 text-court-600 dark:text-court-400" />
                  <span>{amenityLabels[item] || item}</span>
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-bold text-ink">Chính sách huỷ đặt</h3>
            <div className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>
                Miễn phí huỷ lịch trước giờ chơi tối thiểu <strong>{venue.cancelBeforeHours} giờ</strong>. Vui lòng liên hệ trực tiếp ban quản lý cơ sở để được hỗ trợ xác nhận huỷ và đối soát thanh toán.
              </span>
            </div>
          </div>

          {/* Bảng giá tham khảo theo khung giờ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-ink">Bảng giá tham khảo</h2>
              <span className="text-xs text-muted">Đơn vị: VNĐ / giờ</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Giá thực tế được tính tự động theo ô 30 phút trong quá trình chọn lịch.
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
                      <tr key={rule.id} className="hover:bg-court-50/30 transition-colors">
                        <td className="p-3 font-medium text-ink">{days}</td>
                        <td className="p-3 text-muted">
                          {formatHour(rule.startMin)} – {formatHour(rule.endMin)}
                        </td>
                        <td className="p-3 font-bold text-court-600 dark:text-court-400">
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
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Danh sách các sân ({venue.courts.length})</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {venue.courts.map((court) => (
                <div
                  key={court.id}
                  className="flex items-center justify-between rounded-control border border-border p-3 transition-colors hover:border-court-300"
                >
                  <div>
                    <h4 className="text-sm font-bold text-ink">{court.name}</h4>
                    <p className="text-xs text-muted">{court.surface || "Thảm cao su tiêu chuẩn BWF"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {court.isActive ? "Hoạt động" : "Bảo trì"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Đánh giá từ người chơi */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">
              Đánh giá từ người chơi ({venue.reviews.length})
            </h2>

            {venue.reviews.length > 0 ? (
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
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center rounded-control border border-dashed border-border/80 p-8 text-center">
                <MessageSquare size={32} className="text-muted/60" />
                <p className="mt-2 text-sm font-medium text-ink">Chưa có đánh giá nào</p>
                <p className="mt-1 text-xs text-muted">
                  Hãy đặt sân và trải nghiệm để trở thành người đầu tiên để lại nhận xét!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải (Desktop): Thẻ đặt sân cố định (Sticky Booking Card) */}
        <div className="hidden lg:block">
          <div className="sticky top-20 rounded-card border border-border bg-surface p-6 shadow-md">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-muted">Giá thuê từ</span>
                <div className="text-2xl font-black text-court-600 dark:text-court-400">
                  {formatVND(venue.priceFrom)}
                  <span className="text-xs font-normal text-muted">/giờ</span>
                </div>
              </div>
              {venue.ratingCount > 0 && (
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>{venue.ratingAvg.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Thông tin quy tắc giữ chỗ trung thực theo PRODUCT.md */}
            <div className="mt-6 space-y-3 rounded-control border border-border bg-court-50/40 p-4 dark:bg-court-950/20">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted">
                  <CreditCard size={14} className="text-court-500" />
                  <span>Phương thức:</span>
                </div>
                <span className="font-semibold text-ink">
                  {venue.paymentMode === "AT_VENUE"
                    ? "QR ngân hàng / Tiền mặt"
                    : "Chuyển khoản QR ngân hàng"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted">
                  <Timer size={14} className="text-court-500" />
                  <span>Thời hạn giữ chỗ:</span>
                </div>
                <span className="font-semibold text-ink">Tối đa 5 phút</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted">
                  <Layers size={14} className="text-court-500" />
                  <span>Quy cách chọn:</span>
                </div>
                <span className="font-semibold text-ink">Ô 30 phút liên tiếp</span>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-1.5 text-[11px] text-muted">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-court-500" />
              <span>
                Lịch trống được cập nhật liên tục. Đơn giữ chỗ chỉ có hiệu lực sau khi hoàn tất bước Tạo đơn.
              </span>
            </div>

            {/* Nút chuyển sang màn hình chọn sân và giờ */}
            <Link
              href={`/venues/${venue.slug}/book`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-control bg-racket-500 py-3.5 text-center text-sm font-bold text-court-950 shadow-sm transition-all hover:bg-racket-600 active:scale-95"
            >
              <Calendar size={18} />
              <span>Xem lịch trống và đặt sân</span>
            </Link>

            <p className="mt-3 text-center text-xs text-muted">
              Không thu bất kỳ phụ phí dịch vụ nào
            </p>
          </div>
        </div>
      </div>

      {/* Thanh neo điều hướng phía dưới dành riêng cho điện thoại (Mobile Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-xl backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-muted block leading-none">Giá thuê từ</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-base font-extrabold text-court-600 dark:text-court-400">
                {formatVND(venue.priceFrom)}
              </span>
              <span className="text-xs text-muted">/h</span>
            </div>
          </div>

          <Link
            id="mobile-book-now-button"
            href={`/venues/${venue.slug}/book`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-control bg-racket-500 py-3 px-5 text-xs font-bold text-court-950 shadow-md transition-all hover:bg-racket-600 active:scale-95 sm:flex-initial"
          >
            <Calendar size={16} />
            <span>Xem lịch & đặt sân</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
