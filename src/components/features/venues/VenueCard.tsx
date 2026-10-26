"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Star,
  MapPin,
  Clock,
  Heart,
  Wind,
  Car,
  Wifi,
  Coffee,
  Droplets,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Venue } from "@/types/venue";
import { formatVND } from "@/lib/utils";
import { useState, useEffect } from "react";

interface VenueCardProps {
  venue: Venue;
  className?: string;
}

// Key lưu trữ danh sách id cơ sở yêu thích trong localStorage để duy trì trạng thái khi người dùng tải lại trang
const FAVORITES_STORAGE_KEY = "smashbook_favorite_venues";

// Bản đồ ánh xạ tiện ích sang nhãn ngắn và icon tương ứng để hiển thị trực quan trên thẻ
interface AmenityMeta {
  label: string;
  icon: LucideIcon;
}

const AMENITY_MAP: Record<string, AmenityMeta> = {
  AC: { label: "Điều hoà", icon: Wind },
  AIRCON: { label: "Điều hoà", icon: Wind },
  PARKING: { label: "Bãi xe", icon: Car },
  WIFI: { label: "Wi-Fi", icon: Wifi },
  CANTEEN: { label: "Căng-tin", icon: Coffee },
  SHOWER: { label: "Phòng tắm", icon: Droplets },
};

export function VenueCard({ venue, className = "" }: VenueCardProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string>(
    venue.images?.[0] || "/images/courts/court-1.svg"
  );
  const [imageError, setImageError] = useState<boolean>(false);

  // Đồng bộ trạng thái yêu thích từ localStorage sau khi mount phía client để tránh Hydration Mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes(venue.id)) {
          setIsFavorite(true);
        }
      }
    } catch {
      // Bỏ qua lỗi parsing nếu localStorage bị tắt hoặc dữ liệu không hợp lệ
    }
  }, [venue.id]);

  const handleToggleFavorite = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      if (nextState) {
        if (!list.includes(venue.id)) list.push(venue.id);
      } else {
        list = list.filter((id) => id !== venue.id);
      }
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Xử lý an toàn nếu localStorage gặp sự cố hạn ngạch bộ nhớ
    }
  };

  // Định dạng phút sang chuỗi giờ chuẩn HH:MM theo quy chuẩn 24h tại Việt Nam
  const formatHour = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Lọc lấy tối đa 3 tiện ích quan trọng để hiển thị thẻ gọn gàng, tránh tràn dòng trên thiết bị di động
  const visibleAmenities = (venue.amenities || [])
    .filter((a) => AMENITY_MAP[a])
    .slice(0, 3);
  const remainingAmenitiesCount = Math.max(
    0,
    (venue.amenities || []).length - visibleAmenities.length
  );

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-court-300 hover:shadow-md dark:hover:border-court-700 ${className}`}
    >
      {/* Vùng ảnh 16:9 với fallback đồ họa vector đạt chuẩn BWF */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-court-100 dark:bg-court-950">
        {!imageError && imgSrc ? (
          <Image
            src={imgSrc}
            alt={venue.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => {
              if (imgSrc !== "/images/courts/court-1.svg") {
                setImgSrc("/images/courts/court-1.svg");
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-court-700 to-court-900 text-white">
            <svg
              viewBox="0 0 100 60"
              fill="none"
              className="absolute inset-0 h-full w-full opacity-15"
              aria-hidden="true"
            >
              <rect x="5" y="5" width="90" height="50" stroke="white" strokeWidth="1.5" />
              <line x1="50" y1="5" x2="50" y2="55" stroke="white" strokeWidth="1.5" />
              <line x1="5" y1="20" x2="95" y2="20" stroke="white" strokeWidth="1" />
              <line x1="5" y1="40" x2="95" y2="40" stroke="white" strokeWidth="1" />
            </svg>
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span className="text-3xl">🏸</span>
              <span className="text-xs font-semibold tracking-wider text-court-100">
                {venue.district || "SmashBook"}
              </span>
            </div>
          </div>
        )}

        {/* Nút lưu yêu thích cục bộ */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur transition hover:scale-110 active:scale-95 dark:bg-surface/85"
          aria-label={isFavorite ? `Bỏ lưu ${venue.name}` : `Lưu ${venue.name} vào danh sách yêu thích`}
          title={isFavorite ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
        >
          <Heart
            size={17}
            className={
              isFavorite
                ? "fill-rose-500 text-rose-500 transition-colors"
                : "text-muted transition-colors hover:text-rose-500"
            }
          />
        </button>

        {/* Nhãn "Còn trống tối nay" — chỉ hiển thị khi có dữ liệu cờ xác nhận tin cậy */}
        {venue.hasSlotTonight && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span>Còn trống tối nay</span>
          </div>
        )}
      </div>

      {/* Nội dung thông tin chi tiết */}
      <div className="flex flex-1 flex-col p-4">
        {/* Hàng 1: Đánh giá & Vị trí / Khoảng cách */}
        <div className="flex items-center justify-between text-xs text-muted">
          {venue.ratingCount > 0 ? (
            <div className="flex items-center gap-1 font-semibold text-amber-500">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>{venue.ratingAvg.toFixed(1)}</span>
              <span className="font-normal text-muted">({venue.ratingCount})</span>
            </div>
          ) : (
            <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
              Sân mới
            </span>
          )}

          {/* Khoảng cách nếu có hoặc Quận nếu không có tọa độ GPS */}
          {venue.distanceKm !== undefined ? (
            <span className="font-medium text-ink">~{venue.distanceKm} km</span>
          ) : (
            <span className="rounded bg-muted/10 px-1.5 py-0.5 font-medium text-muted">
              {venue.district}
            </span>
          )}
        </div>

        {/* Tên cơ sở sân */}
        <Link href={`/venues/${venue.slug}`} className="group-hover:text-court-600">
          <h3 className="mt-2 line-clamp-1 text-base font-bold text-ink transition-colors group-hover:text-court-600">
            {venue.name}
          </h3>
        </Link>

        {/* Địa chỉ rút gọn */}
        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted">
          <MapPin size={13} className="mt-0.5 shrink-0 text-court-500" />
          <span className="line-clamp-1">{venue.address}</span>
        </div>

        {/* Giờ mở cửa & Quy mô số sân */}
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="shrink-0 text-court-500" />
            <span>
              {formatHour(venue.openMin)} – {formatHour(venue.closeMin)}
            </span>
          </div>

          {venue.courts && venue.courts.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted">
              <Layers size={12} className="shrink-0 text-court-500" />
              <span>{venue.courts.length} sân</span>
            </div>
          )}
        </div>

        {/* Tiện ích nổi bật: Giúp người chơi so sánh nhanh chóng */}
        {visibleAmenities.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {visibleAmenities.map((amenityKey) => {
              const meta = AMENITY_MAP[amenityKey];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span
                  key={amenityKey}
                  className="inline-flex items-center gap-1 rounded bg-muted/10 px-2 py-0.5 text-[11px] font-medium text-ink"
                >
                  <Icon size={11} className="text-court-600 dark:text-court-400" />
                  <span>{meta.label}</span>
                </span>
              );
            })}
            {remainingAmenitiesCount > 0 && (
              <span className="text-[11px] font-medium text-muted">
                +{remainingAmenitiesCount}
              </span>
            )}
          </div>
        )}

        {/* Chân thẻ: Giá từ theo giờ & Lời kêu gọi hành động (CTA) */}
        <div className="mt-auto border-t border-border/60 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted">Giá thuê từ</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-bold text-court-600 dark:text-court-400">
                  {formatVND(venue.priceFrom)}
                </span>
                <span className="text-xs text-muted">/h</span>
              </div>
            </div>

            <Link
              href={`/venues/${venue.slug}`}
              className="inline-flex items-center justify-center rounded-control bg-racket-500 px-4 py-2 text-xs font-semibold text-court-950 shadow-sm transition-all hover:bg-racket-600 active:scale-95"
            >
              Xem lịch & đặt
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
