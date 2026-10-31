"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, AlertCircle, Sparkles, MapPin, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { VenueCard } from "@/components/features/venues/VenueCard";
import type { Venue } from "@/types/venue";

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favoriteIds, isLoading: favLoading, isGuest } = useFavorites();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function loadFavoriteVenues() {
      setLoading(true);
      setError("");

      try {
        if (user) {
          // Người dùng đã đăng nhập: Tải danh sách sân từ API favorites (chứa data các sân đã thích)
          const res = await fetch("/api/favorites", { cache: "no-store" });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Không tải được danh sách sân yêu thích.");
          }
          if (active) {
            setVenues(json.data || []);
          }
        } else {
          // Khách vãng lai: Tải danh mục sân công khai rồi lọc theo favoriteIds lưu trong localStorage
          const res = await fetch("/api/booking-catalog", { cache: "no-store" });
          const json = await res.json();
          if (res.ok && Array.isArray(json.venues)) {
            if (active) {
              setVenues(json.venues);
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Lỗi kết nối khi tải dữ liệu.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFavoriteVenues();

    return () => {
      active = false;
    };
  }, [user]);

  // Lọc danh sách sân hiện đang có trong favoriteIds của context
  const displayedVenues = useMemo(() => {
    return venues.filter((v) => favoriteIds.includes(v.id));
  }, [venues, favoriteIds]);

  return (
    <div className="mx-auto max-w-content px-4 py-8 pb-28 sm:px-6 md:pb-16">
      {/* Header trang yêu thích */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/venues"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition hover:bg-court-50 hover:text-ink active:scale-95"
            aria-label="Quay lại danh sách sân"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Heart size={20} className="fill-rose-500 text-rose-500" />
              <h1 className="text-xl font-bold text-ink sm:text-2xl">
                Sân cầu lông yêu thích
              </h1>
              {!favLoading && (
                <span className="rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 px-2.5 py-0.5 text-xs font-bold">
                  {displayedVenues.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Các cụm sân bạn quan tâm để dễ dàng tra cứu lịch trống và đặt sân nhanh.
            </p>
          </div>
        </div>

        <Link
          href="/venues"
          className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-xs hover:border-court-400 hover:bg-court-50 transition"
        >
          <Search size={14} className="text-court-600" />
          <span>Tìm thêm sân mới</span>
        </Link>
      </div>

      {/* Thông báo cho người dùng chưa đăng nhập (lưu cục bộ trên thiết bị) */}
      {isGuest && (
        <div className="mb-6 rounded-card border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Lưu trên thiết bị này</p>
              <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px] mt-0.5">
                Bạn đang sử dụng chế độ khách. Hãy đăng nhập để lưu vĩnh viễn và đồng bộ danh sách này sang điện thoại và máy tính khác.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-control bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 whitespace-nowrap transition"
          >
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {/* Xử lý các trạng thái: Đang tải, Lỗi, Danh sách trống, Danh sách thật */}
      {loading || favLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-card border border-border bg-surface p-4"
            >
              <div className="h-40 rounded-container bg-muted/20" />
              <div className="mt-4 h-4 w-3/4 rounded bg-muted/20" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-card border border-rose-200 bg-rose-50/60 p-8 text-center text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertCircle size={24} className="mx-auto mb-2 text-rose-600" />
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-control bg-rose-600 px-4 py-1.5 text-white font-semibold hover:bg-rose-700 transition"
          >
            Thử tải lại
          </button>
        </div>
      ) : displayedVenues.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/50">
            <Heart size={26} className="text-rose-400 stroke-[1.5]" />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink">Chưa có sân yêu thích</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted">
            Khi duyệt danh sách sân, hãy nhấp vào biểu tượng trái tim để lưu lại những địa điểm bạn yêu thích và đặt sân thuận tiện nhất.
          </p>
          <div className="mt-5">
            <Link
              href="/venues"
              className="inline-flex items-center gap-2 rounded-control bg-racket-500 px-5 py-2.5 text-xs font-bold text-court-950 shadow-sm transition hover:bg-racket-600 active:scale-95"
            >
              <MapPin size={15} />
              <span>Khám phá sân ngay</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedVenues.map((venue) => (
            <div key={venue.id} className="relative">
              {venue.status && venue.status !== "ACTIVE" && (
                <div className="absolute top-2 left-2 z-20 rounded bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur">
                  Cơ sở tạm ngưng hoạt động
                </div>
              )}
              <VenueCard venue={venue} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
