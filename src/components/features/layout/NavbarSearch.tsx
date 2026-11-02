"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { VenueSearchSuggestions } from "@/components/features/venues/VenueSearchSuggestions";
import type { VenueSearchSuggestion } from "@/types/venue";

export function NavbarSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<VenueSearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced fetch suggestions với AbortController hủy request cũ
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setErrorMessage(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/venues/search?q=${encodeURIComponent(trimmed)}&limit=6&priority=venue`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setSuggestions(json.data);
            setIsOpen(true);
            setActiveIndex(-1);
          }
        } else {
          setErrorMessage("Không thể tải gợi ý.");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setErrorMessage("Lỗi kết nối khi tìm kiếm.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
    };
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

  const handleSelect = useCallback(
    (item: VenueSearchSuggestion) => {
      setIsOpen(false);
      if (item.type === "district") {
        router.push(`/venues?district=${encodeURIComponent(item.district)}`);
      } else {
        router.push(`/venues/${item.slug}`);
      }
    },
    [router]
  );

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
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSubmit(e);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div data-navbar-search className="relative w-full" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="group flex h-10 w-full items-center rounded-full border border-border/80 bg-surface/90 px-3.5 py-2 shadow-sm transition-all duration-200 hover:border-court-400 hover:shadow-md focus-within:border-court-500 focus-within:bg-surface focus-within:ring-4 focus-within:ring-court-500/15">
          {isLoading ? (
            <Loader2 size={16} className="shrink-0 animate-spin text-court-600" />
          ) : (
            <Search size={17} className="shrink-0 text-muted transition-colors group-focus-within:text-court-500" />
          )}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 || searchTerm.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm tên sân, khu vực..."
            aria-label="Tìm tên sân hoặc khu vực"
            className="min-w-0 w-full bg-transparent px-2.5 text-sm text-ink outline-none placeholder:text-muted/70"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSuggestions([]);
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
        isLoading={isLoading}
        errorMessage={errorMessage}
        activeIndex={activeIndex}
        onSelect={handleSelect}
        onViewAll={handleSubmit}
        className="left-0 sm:left-auto sm:right-0 w-[360px] sm:w-[440px] max-w-[calc(100vw-2rem)]"
      />
    </div>
  );
}
