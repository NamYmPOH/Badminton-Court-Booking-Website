"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Clock, X } from "lucide-react";
import { VenueSearchSuggestions } from "@/components/features/venues/VenueSearchSuggestions";
import type { VenueSearchSuggestion } from "@/types/venue";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [date, setDate] = useState("today");
  const [fromHour, setFromHour] = useState("now");

  const [suggestions, setSuggestions] = useState<VenueSearchSuggestion[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/venues/search?q=${encodeURIComponent(query.trim())}&limit=5`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setSuggestions(json.data);
            setIsSuggestionsOpen(true);
          }
        }
      } catch (err) {
        console.error("Hero search suggestions error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSuggestionsOpen(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (district !== "all") params.set("district", district);
    if (date !== "today") params.set("date", date);
    if (fromHour !== "now") params.set("fromMin", fromHour);

    router.push(`/venues?${params.toString()}`);
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

  return (
    <form
      onSubmit={handleSearch}
      className="mt-8 flex max-w-3xl flex-col gap-3 rounded-card bg-surface/95 p-3.5 shadow-lg backdrop-blur dark:bg-surface/95 sm:flex-row sm:items-center"
    >
      {/* Ô tìm kiếm khu vực / tên sân */}
      <div
        className="relative flex flex-1 items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-ink dark:border-court-800/60 dark:bg-court-950/60"
        ref={containerRef}
      >
        <MapPin size={18} className="shrink-0 text-court-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsSuggestionsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Khu vực / tên sân (ví dụ: Thanh Xuân, Sân 1...)"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsSuggestionsOpen(false);
            }}
            className="rounded-full p-0.5 text-muted hover:text-ink"
            aria-label="Xóa"
          >
            <X size={15} />
          </button>
        )}

        <VenueSearchSuggestions
          suggestions={suggestions}
          keyword={query}
          isOpen={isSuggestionsOpen}
          activeIndex={activeIndex}
          onSelect={() => setIsSuggestionsOpen(false)}
          onViewAll={handleSearch}
        />
      </div>

      {/* Chọn quận / huyện nhanh */}
      <div className="flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-ink dark:border-court-800/60 dark:bg-court-950/60 sm:w-40">
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-ink outline-none"
        >
          <option value="all">Tất cả quận</option>
          <option value="Thanh Xuân">Thanh Xuân</option>
          <option value="Tây Hồ">Tây Hồ</option>
          <option value="Nam Từ Liêm">Nam Từ Liêm</option>
          <option value="Bắc Từ Liêm">Bắc Từ Liêm</option>
          <option value="Long Biên">Long Biên</option>
          <option value="Hà Đông">Hà Đông</option>
          <option value="Cầu Giấy">Cầu Giấy</option>
          <option value="Đống Đa">Đống Đa</option>
          <option value="Ba Đình">Ba Đình</option>
          <option value="Hoàng Mai">Hoàng Mai</option>
        </select>
      </div>

      {/* Chọn ngày */}
      <div className="flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-ink dark:border-court-800/60 dark:bg-court-950/60 sm:w-36">
        <Calendar size={18} className="shrink-0 text-court-500" />
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-ink outline-none"
        >
          <option value="today">Hôm nay</option>
          <option value="tomorrow">Ngày mai</option>
          <option value="weekend">Cuối tuần</option>
        </select>
      </div>

      {/* Chọn giờ bắt đầu */}
      <div className="flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-ink dark:border-court-800/60 dark:bg-court-950/60 sm:w-32">
        <Clock size={18} className="shrink-0 text-court-500" />
        <select
          value={fromHour}
          onChange={(e) => setFromHour(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-ink outline-none"
        >
          <option value="now">Từ giờ</option>
          <option value="1020">Từ 17:00</option>
          <option value="1080">Từ 18:00</option>
          <option value="1140">Từ 19:00</option>
          <option value="1200">Từ 20:00</option>
        </select>
      </div>

      {/* Nút tìm kiếm */}
      <button
        type="submit"
        className="rounded-control bg-racket-500 px-6 py-2.5 text-sm font-semibold text-court-900 transition-colors hover:bg-racket-600 sm:w-auto"
      >
        Tìm sân trống
      </button>
    </form>
  );
}
