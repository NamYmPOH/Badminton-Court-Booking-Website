"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { VenueSearchSuggestions } from "@/components/features/venues/VenueSearchSuggestions";
import type { VenueSearchSuggestion } from "@/types/venue";

export function NavbarSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<VenueSearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch suggestions
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
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
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error("Navbar search suggestions error:", err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (searchTerm.trim()) {
      router.push(`/venues?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push("/venues");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

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
        setIsOpen(false);
        router.push(`/venues/${selected.slug}`);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="group flex h-10 w-full items-center rounded-full border border-border/80 bg-surface/90 px-3.5 py-2 shadow-sm transition-all duration-200 hover:border-court-400 hover:shadow-md focus-within:border-court-500 focus-within:bg-surface focus-within:ring-4 focus-within:ring-court-500/15">
          <Search size={17} className="shrink-0 text-muted transition-colors group-focus-within:text-court-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm tên sân, khu vực quận/huyện..."
            className="w-full bg-transparent px-2.5 text-sm text-ink outline-none placeholder:text-muted/70"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setIsOpen(false);
              }}
              className="rounded-full p-1 text-muted transition hover:bg-court-100/60 hover:text-ink dark:hover:bg-surface/80"
              aria-label="Xóa"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      <VenueSearchSuggestions
        suggestions={suggestions}
        keyword={searchTerm}
        isOpen={isOpen}
        activeIndex={activeIndex}
        onSelect={() => setIsOpen(false)}
        onViewAll={handleSubmit}
      />
    </div>
  );
}
