"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ArrowRight } from "lucide-react";
import type { VenueSearchSuggestion } from "@/types/venue";
import { formatVND } from "@/lib/utils";

interface VenueSearchSuggestionsProps {
  suggestions: VenueSearchSuggestion[];
  keyword: string;
  isOpen: boolean;
  onSelect: () => void;
  onViewAll: () => void;
  activeIndex: number;
}

export function VenueSearchSuggestions({
  suggestions,
  keyword,
  isOpen,
  onSelect,
  onViewAll,
  activeIndex,
}: VenueSearchSuggestionsProps) {
  if (!isOpen || !keyword.trim()) return null;

  return (
    <div
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface/95 p-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {suggestions.length > 0 ? (
        <div className="p-2">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            Gợi ý sân cầu lông phù hợp
          </div>

          <div className="space-y-1">
            {suggestions.map((item, index) => {
              const isSelected = index === activeIndex;
              const thumbnail = item.images[0] || "/images/courts/court-1.svg";

              return (
                <Link
                  key={item.id}
                  href={`/venues/${item.slug}`}
                  onClick={onSelect}
                  className={`flex items-center gap-3 rounded-control p-2.5 transition ${
                    isSelected
                      ? "bg-court-50 dark:bg-court-900/50"
                      : "hover:bg-court-50/70 dark:hover:bg-surface/80"
                  }`}
                >
                  {/* Thumbnail sân */}
                  <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-control bg-court-100 dark:bg-court-950">
                    <Image
                      src={thumbnail}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized={thumbnail.endsWith(".svg")}
                    />
                  </div>

                  {/* Thông tin sân */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate text-sm font-semibold text-ink">
                        {item.name}
                      </h4>
                      <span className="shrink-0 text-xs font-bold text-court-600 dark:text-court-400">
                        từ {formatVND(item.priceFrom)}/h
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0 text-court-500" />
                        <span className="truncate">{item.district}</span>
                      </span>

                      {item.ratingAvg > 0 && (
                        <span className="flex items-center gap-0.5 font-medium text-amber-500">
                          <Star size={11} className="fill-current text-amber-500" />
                          <span>{item.ratingAvg.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Nút xem toàn bộ kết quả */}
          <button
            type="button"
            onClick={onViewAll}
            className="mt-2 flex w-full items-center justify-between rounded-control border-t border-border bg-court-50/50 px-3 py-2 text-xs font-semibold text-court-700 transition hover:bg-court-100/70 dark:bg-court-950/40 dark:text-court-300 dark:hover:bg-court-900/60"
          >
            <span>
              Xem tất cả kết quả cho <strong>&ldquo;{keyword}&rdquo;</strong>
            </span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-muted">
          <p>Không tìm thấy sân cầu lông nào khớp với từ khóa <strong>&ldquo;{keyword}&rdquo;</strong></p>
          <button
            type="button"
            onClick={onViewAll}
            className="mt-2 text-xs font-semibold text-court-600 hover:underline"
          >
            Tìm kiếm mở rộng trên trang danh sách →
          </button>
        </div>
      )}
    </div>
  );
}
