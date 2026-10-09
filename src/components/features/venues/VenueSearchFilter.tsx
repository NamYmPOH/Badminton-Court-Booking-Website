"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  MapPin,
  List,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Sparkles,
  DollarSign,
  Clock,
} from "lucide-react";
import { VenueSearchSuggestions } from "./VenueSearchSuggestions";
import type { VenueSearchSuggestion } from "@/types/venue";

const DISTRICTS = [
  "all",
  "Cầu Giấy",
  "Đống Đa",
  "Thanh Xuân",
  "Ba Đình",
  "Tây Hồ",
  "Nam Từ Liêm",
  "Bắc Từ Liêm",
  "Hà Đông",
  "Long Biên",
  "Hoàng Mai",
  "Hai Bà Trưng",
  "Hoàn Kiếm",
];

const PRICE_RANGES = [
  { label: "Tất cả mức giá", value: "all" },
  { label: "Dưới 80.000đ/h", value: "under_80", maxPrice: "80000" },
  { label: "80k - 120k/h", value: "80_120", minPrice: "80000", maxPrice: "120000" },
  { label: "Trên 120.000đ/h", value: "above_120", minPrice: "120000" },
];

const SORT_OPTIONS = [
  { label: "Khoảng cách gần nhất", value: "distance" },
  { label: "Đánh giá cao nhất", value: "rating" },
  { label: "Giá tăng dần", value: "price_asc" },
  { label: "Giá giảm dần", value: "price_desc" },
];

interface VenueSearchFilterProps {
  totalResults: number;
}

export function VenueSearchFilter({ totalResults }: VenueSearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const initialQ = searchParams.get("q") || "";
  const initialDistrict = searchParams.get("district") || "all";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialHasSlotTonight = searchParams.get("hasSlotTonight") === "true";
  const initialIsOpenNow = searchParams.get("isOpenNow") === "true";
  const initialSort = searchParams.get("sort") || "distance";
  const isMapView = searchParams.get("view") === "map";

  // Local state
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [suggestions, setSuggestions] = useState<VenueSearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync state when URL params change
  useEffect(() => {
    setSearchTerm(initialQ);
  }, [initialQ]);

  // Push updates to URL
  const updateUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all" || value === "false") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.push(`/venues?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounced Autocomplete Fetching
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/venues/search?q=${encodeURIComponent(searchTerm.trim())}&limit=5`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setSuggestions(json.data);
            setIsSuggestionsOpen(true);
          }
        }
      } catch (err) {
        console.error("Autocomplete search error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside listener for suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSuggestionsOpen(false);
    updateUrl({ q: searchTerm.trim() || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) {
        setIsSuggestionsOpen(false);
        router.push(`/venues/${selected.slug}`);
      }
    } else if (e.key === "Escape") {
      setIsSuggestionsOpen(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    router.push("/venues");
  };

  // Check active filters count
  const hasActiveFilters =
    Boolean(initialQ) ||
    (initialDistrict !== "all" && Boolean(initialDistrict)) ||
    Boolean(initialMinPrice) ||
    Boolean(initialMaxPrice) ||
    initialHasSlotTonight ||
    initialIsOpenNow ||
    initialSort !== "distance";

  // Determine current price range value
  const currentPriceRangeValue = (() => {
    if (initialMaxPrice === "80000" && !initialMinPrice) return "under_80";
    if (initialMinPrice === "80000" && initialMaxPrice === "120000") return "80_120";
    if (initialMinPrice === "120000" && !initialMaxPrice) return "above_120";
    return "all";
  })();

  return (
    <div className="space-y-4">
      {/* 1. Header & Thanh Search chính */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink lg:text-3xl">
            {isMapView ? "Bản đồ sân cầu lông" : "Danh sách sân cầu lông"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tìm thấy <strong className="text-court-600 dark:text-court-400">{totalResults}</strong> cơ sở phù hợp với nhu cầu
          </p>
        </div>

        {/* Chuyển đổi Danh sách / Bản đồ */}
        <div className="flex items-center gap-2 self-start rounded-control border border-border bg-surface p-1 shadow-sm">
          <button
            type="button"
            onClick={() => updateUrl({ view: undefined })}
            className={`inline-flex items-center gap-1.5 rounded-control px-3.5 py-1.5 text-xs font-semibold transition ${
              !isMapView
                ? "bg-court-600 text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <List size={15} />
            <span>Danh sách</span>
          </button>

          <button
            type="button"
            onClick={() => updateUrl({ view: "map" })}
            className={`inline-flex items-center gap-1.5 rounded-control px-3.5 py-1.5 text-xs font-semibold transition ${
              isMapView
                ? "bg-court-600 text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <MapPin size={15} />
            <span>Bản đồ</span>
          </button>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm đa năng có Autocomplete */}
      <div className="relative" ref={searchContainerRef}>
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 rounded-card border border-border bg-surface p-1.5 shadow-sm transition focus-within:border-court-500 focus-within:ring-2 focus-within:ring-court-500/20"
        >
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search size={18} className="shrink-0 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsSuggestionsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tìm theo tên sân, địa chỉ, quận huyện (ví dụ: Thanh Xuân, Sân 1, Cầu Giấy)..."
              className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted/70"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  updateUrl({ q: undefined });
                }}
                className="rounded-full p-1 text-muted hover:bg-court-50 hover:text-ink dark:hover:bg-surface"
                aria-label="Xóa từ khóa"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-court-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-court-700"
          >
            <Search size={15} />
            <span className="hidden sm:inline">Tìm kiếm</span>
          </button>
        </form>

        {/* Dropdown Gợi ý tức thì */}
        <VenueSearchSuggestions
          suggestions={suggestions}
          keyword={searchTerm}
          isOpen={isSuggestionsOpen}
          activeIndex={activeIndex}
          onSelect={() => setIsSuggestionsOpen(false)}
          onViewAll={handleSearchSubmit}
        />
      </div>

      {/* 3. Dải bộ lọc tiện ích & tiêu chí nhanh */}
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface/70 p-3 backdrop-blur-sm">
        {/* Lọc theo mức giá */}
        <div className="relative">
          <select
            value={currentPriceRangeValue}
            onChange={(e) => {
              const val = e.target.value;
              const found = PRICE_RANGES.find((r) => r.value === val);
              updateUrl({
                minPrice: found?.minPrice,
                maxPrice: found?.maxPrice,
              });
            }}
            className="cursor-pointer appearance-none rounded-full border border-border bg-surface py-1.5 pl-8 pr-7 text-xs font-medium text-ink outline-none transition hover:border-court-400 focus:border-court-600 focus:ring-1 focus:ring-court-600"
          >
            {PRICE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <DollarSign size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-court-600" />
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        {/* Lọc Còn sân tối nay */}
        <button
          type="button"
          onClick={() =>
            updateUrl({
              hasSlotTonight: initialHasSlotTonight ? undefined : "true",
            })
          }
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
            initialHasSlotTonight
              ? "bg-racket-500 font-semibold text-court-950 shadow-sm"
              : "border border-border bg-surface text-muted hover:border-court-400 hover:text-ink"
          }`}
        >
          <Sparkles size={13} className={initialHasSlotTonight ? "text-court-950" : "text-amber-500"} />
          <span>Còn sân tối nay</span>
        </button>

        {/* Lọc Đang mở cửa */}
        <button
          type="button"
          onClick={() =>
            updateUrl({
              isOpenNow: initialIsOpenNow ? undefined : "true",
            })
          }
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
            initialIsOpenNow
              ? "bg-court-600 font-semibold text-white shadow-sm"
              : "border border-border bg-surface text-muted hover:border-court-400 hover:text-ink"
          }`}
        >
          <Clock size={13} />
          <span>Đang mở cửa</span>
        </button>

        {/* Sắp xếp */}
        <div className="relative ml-auto">
          <select
            value={initialSort}
            onChange={(e) => updateUrl({ sort: e.target.value })}
            className="cursor-pointer appearance-none rounded-full border border-border bg-surface py-1.5 pl-3 pr-7 text-xs font-medium text-ink outline-none transition hover:border-court-400 focus:border-court-600"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        {/* Nút đặt lại */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-rose-300 bg-rose-50/70 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <RotateCcw size={12} />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* 4. Dải chọn Quận/Huyện */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
        <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted">
          <SlidersHorizontal size={13} className="text-court-600" />
          <span>Quận:</span>
        </div>
        {DISTRICTS.map((d) => {
          const isSelected = initialDistrict.toLowerCase() === d.toLowerCase();
          return (
            <button
              key={d}
              type="button"
              onClick={() => updateUrl({ district: d === "all" ? undefined : d })}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                isSelected
                  ? "bg-court-600 font-semibold text-white shadow-sm"
                  : "border border-border bg-surface text-muted hover:border-court-400 hover:text-ink"
              }`}
            >
              {d === "all" ? "Tất cả quận" : d}
            </button>
          );
        })}
      </div>

      {/* 5. Thẻ hiển thị các tiêu chí đang lọc (Active filter chips) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-muted">Đang lọc theo:</span>

          {initialQ && (
            <span className="inline-flex items-center gap-1 rounded-full bg-court-100/80 px-2.5 py-0.5 font-medium text-court-800 dark:bg-court-950 dark:text-court-200">
              Từ khóa: &ldquo;{initialQ}&rdquo;
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  updateUrl({ q: undefined });
                }}
                className="hover:text-rose-600"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {initialDistrict !== "all" && initialDistrict && (
            <span className="inline-flex items-center gap-1 rounded-full bg-court-100/80 px-2.5 py-0.5 font-medium text-court-800 dark:bg-court-950 dark:text-court-200">
              Quận: {initialDistrict}
              <button
                type="button"
                onClick={() => updateUrl({ district: undefined })}
                className="hover:text-rose-600"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {currentPriceRangeValue !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-court-100/80 px-2.5 py-0.5 font-medium text-court-800 dark:bg-court-950 dark:text-court-200">
              Giá: {PRICE_RANGES.find((r) => r.value === currentPriceRangeValue)?.label}
              <button
                type="button"
                onClick={() => updateUrl({ minPrice: undefined, maxPrice: undefined })}
                className="hover:text-rose-600"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {initialHasSlotTonight && (
            <span className="inline-flex items-center gap-1 rounded-full bg-racket-100 px-2.5 py-0.5 font-medium text-court-950 dark:bg-racket-900/40 dark:text-racket-300">
              Còn sân tối nay
              <button
                type="button"
                onClick={() => updateUrl({ hasSlotTonight: undefined })}
                className="hover:text-rose-600"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {initialIsOpenNow && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Đang mở cửa
              <button
                type="button"
                onClick={() => updateUrl({ isOpenNow: undefined })}
                className="hover:text-rose-600"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
