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
        className="relative flex flex-1 items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-black dark:border-gray-200 dark:bg-white"
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
          className="w-full bg-transparent text-sm text-black font-medium outline-none placeholder:text-gray-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsSuggestionsOpen(false);
            }}
            className="rounded-full p-0.5 text-gray-500 hover:text-black"
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
      <div className="flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-black dark:border-gray-200 dark:bg-white sm:w-40">
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-black font-medium outline-none"
        >
          <option value="all" className="bg-white text-black">Tất cả quận</option>
          <option value="Thanh Xuân" className="bg-white text-black">Thanh Xuân</option>
          <option value="Tây Hồ" className="bg-white text-black">Tây Hồ</option>
          <option value="Nam Từ Liêm" className="bg-white text-black">Nam Từ Liêm</option>
          <option value="Bắc Từ Liêm" className="bg-white text-black">Bắc Từ Liêm</option>
          <option value="Long Biên" className="bg-white text-black">Long Biên</option>
          <option value="Hà Đông" className="bg-white text-black">Hà Đông</option>
          <option value="Cầu Giấy" className="bg-white text-black">Cầu Giấy</option>
          <option value="Đống Đa" className="bg-white text-black">Đống Đa</option>
          <option value="Ba Đình" className="bg-white text-black">Ba Đình</option>
          <option value="Hoàng Mai" className="bg-white text-black">Hoàng Mai</option>
        </select>
      </div>

      {/* Chọn ngày */}
      <div className="flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-black dark:border-gray-200 dark:bg-white sm:w-36">
        <Calendar size={18} className="shrink-0 text-court-500" />
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-black font-medium outline-none"
        >
          <option value="today" className="bg-white text-black">Hôm nay</option>
          <option value="tomorrow" className="bg-white text-black">Ngày mai</option>
          <option value="weekend" className="bg-white text-black">Cuối tuần</option>
        </select>
      </div>

      {/* Chọn giờ bắt đầu */}
      <div className="flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm text-black dark:border-gray-200 dark:bg-white sm:w-32">
        <Clock size={18} className="shrink-0 text-court-500" />
        <select
          value={fromHour}
          onChange={(e) => setFromHour(e.target.value)}
          className="w-full cursor-pointer bg-transparent text-sm text-black font-medium outline-none"
        >
          <option value="now" className="bg-white text-black">Từ giờ</option>
          <option value="1020" className="bg-white text-black">Từ 17:00</option>
          <option value="1080" className="bg-white text-black">Từ 18:00</option>
          <option value="1140" className="bg-white text-black">Từ 19:00</option>
          <option value="1200" className="bg-white text-black">Từ 20:00</option>
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
