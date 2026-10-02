"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Clock, Heart } from "lucide-react";
import type { Venue } from "@/types/venue";
import { formatVND } from "@/lib/utils";
import { useState } from "react";

interface VenueCardProps {
  venue: Venue;
  className?: string;
}

export function VenueCard({ venue, className = "" }: VenueCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Định dạng giờ mở/đóng (phút -> HH:MM)
  const formatHour = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${className}`}
    >
      {/* Ảnh 16:9 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-court-100 dark:bg-court-950">
        {venue.images[0] ? (
          <Image
            src={venue.images[0]}
            alt={venue.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🏸
          </div>
        )}

        {/* Nút lưu yêu thích */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur transition hover:scale-110 dark:bg-surface/80"
          aria-label={isFavorite ? "Bỏ yêu thích" : "Lưu yêu thích"}
        >
          <Heart
            size={18}
            className={isFavorite ? "fill-racket-500 text-racket-500" : "text-muted"}
          />
        </button>

        {/* Chip Còn trống tối nay */}
        {venue.hasSlotTonight && (
          <span className="absolute bottom-3 left-3 rounded-full bg-court-600/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur">
            Còn trống tối nay
          </span>
        )}
      </div>

      {/* Nội dung thông tin */}
      <div className="flex flex-1 flex-col p-4">
        {/* Hàng sao đánh giá & khoảng cách */}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1 font-semibold text-amber-500">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>{venue.ratingAvg.toFixed(1)}</span>
            <span className="text-muted">({venue.ratingCount})</span>
          </div>
          {venue.distanceKm !== undefined && (
            <span>Cách bạn ~{venue.distanceKm} km</span>
          )}
        </div>

        {/* Tên cơ sở */}
        <Link href={`/venues/${venue.slug}`}>
          <h3 className="mt-1.5 line-clamp-1 text-base font-bold text-ink hover:text-court-600">
            {venue.name}
          </h3>
        </Link>

        {/* Địa chỉ rút gọn */}
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin size={13} className="shrink-0 text-court-500" />
          <span className="line-clamp-1">{venue.address}</span>
        </div>

        {/* Giờ mở cửa */}
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <Clock size={13} className="shrink-0 text-court-500" />
          <span>
            {formatHour(venue.openMin)} – {formatHour(venue.closeMin)}
          </span>
        </div>

        {/* Chân thẻ: Giá & Nút đặt sân */}
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <div>
            <span className="text-xs text-muted">Từ </span>
            <span className="text-sm font-bold text-court-600">
              {formatVND(venue.priceFrom)}
            </span>
            <span className="text-xs text-muted">/giờ</span>
          </div>

          <Link
            href={`/venues/${venue.slug}`}
            className="inline-flex items-center justify-center rounded-control bg-racket-500 px-4 py-1.5 text-xs font-semibold text-court-900 transition-colors hover:bg-racket-600"
          >
            Đặt sân
          </Link>
        </div>
      </div>
    </div>
  );
}
