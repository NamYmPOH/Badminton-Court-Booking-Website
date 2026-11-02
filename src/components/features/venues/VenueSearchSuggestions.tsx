"use client";

import Image from "next/image";
import { MapPin, Star, ArrowRight, Building2, AlertCircle } from "lucide-react";
import type { VenueSearchSuggestion } from "@/types/venue";
import { formatVND } from "@/lib/utils";

interface VenueSearchSuggestionsProps {
  suggestions: VenueSearchSuggestion[];
  keyword: string;
  isOpen: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onSelect: (item: VenueSearchSuggestion) => void;
  onViewAll: () => void;
  activeIndex: number;
  className?: string;
}

export function VenueSearchSuggestions({
  suggestions,
  keyword,
  isOpen,
  isLoading = false,
  errorMessage = null,
  onSelect,
  onViewAll,
  activeIndex,
  className = "",
}: VenueSearchSuggestionsProps) {
  if (!isOpen || !keyword.trim()) return null;

  return (
    <div
      role="listbox"
      className={`absolute left-0 top-full z-50 mt-2 w-full min-w-[320px] sm:min-w-[420px] max-w-[92vw] overflow-hidden rounded-2xl border border-border bg-white text-ink shadow-2xl dark:border-border/80 dark:bg-surface animate-in fade-in slide-in-from-top-2 duration-150 ${className}`}
    >
      <div className="max-h-[380px] overflow-y-auto overscroll-contain p-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-xs text-muted">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
            <span>Đang tìm kiếm sân & khu vực...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-5 text-center text-xs text-muted">
            <div className="flex items-center justify-center gap-1.5 text-rose-500 font-semibold mb-1">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={onViewAll}
              className="mt-2 text-xs font-semibold text-court-600 hover:underline"
            >
              Tìm kiếm trên trang danh sách sân →
            </button>
          </div>
        ) : suggestions.length > 0 ? (
          <div>
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              Gợi ý phù hợp nhất
            </div>

            <div className="space-y-1">
              {suggestions.map((item, index) => {
                const isSelected = index === activeIndex;
                const isDistrict = item.type === "district";
                const thumbnail = item.images[0] || "/images/courts/court-1.svg";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`flex w-full items-center gap-3 rounded-control p-2.5 text-left transition ${
                      isSelected
                        ? "bg-court-50 dark:bg-court-950/60 ring-1 ring-court-500/40"
                        : "hover:bg-court-50/70 dark:hover:bg-surface/80"
                    }`}
                  >
                    {/* Biểu tượng / Thumbnail */}
                    {isDistrict ? (
                      <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-control bg-court-100 text-court-700 dark:bg-court-950 dark:text-court-300">
                        <MapPin size={22} className="text-court-600 dark:text-court-400" />
                      </div>
                    ) : (
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
                    )}

                    {/* Nội dung chi tiết */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="truncate text-sm font-semibold text-ink">
                            {item.name}
                          </h4>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                              isDistrict
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                : "bg-court-100 text-court-800 dark:bg-court-950 dark:text-court-300"
                            }`}
                          >
                            {isDistrict ? "Khu vực" : "Sân"}
                          </span>
                        </div>

                        {!isDistrict && item.priceFrom > 0 && (
                          <span className="shrink-0 text-xs font-bold text-court-600 dark:text-court-400">
                            từ {formatVND(item.priceFrom)}/h
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted">
                        <span className="flex items-center gap-1 truncate">
                          <Building2 size={12} className="shrink-0 text-muted/80" />
                          <span className="truncate">{item.address}</span>
                        </span>

                        {!isDistrict && item.ratingAvg > 0 && (
                          <span className="flex shrink-0 items-center gap-0.5 font-medium text-amber-500">
                            <Star size={11} className="fill-current text-amber-500" />
                            <span>{item.ratingAvg.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Nút xem tất cả */}
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
            <p>
              Không tìm thấy sân hoặc khu vực nào khớp với <strong>&ldquo;{keyword}&rdquo;</strong>
            </p>
            <button
              type="button"
              onClick={onViewAll}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-court-600 hover:underline"
            >
              <span>Tìm kiếm mở rộng trên trang danh sách</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
