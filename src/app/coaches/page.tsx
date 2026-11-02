"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Award,
  Calendar,
  MapPin,
  Sparkles,
  Filter,
  RotateCcw,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { COACH_SPECIALTIES, type CoachSpecialty } from "@/lib/coach-policy";

interface CoachVenueItem {
  id: string;
  name: string;
  address: string;
  district: string;
  province: string;
}

interface CoachItem {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  bio: string | null;
  specialties: string[];
  experienceYears: number;
  hourlyRate: number;
  isDemo: boolean;
  venues: CoachVenueItem[];
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 9;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [rateFilter, setRateFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      if (selectedSpecialty) {
        params.set("specialty", selectedSpecialty);
      }
      if (districtFilter.trim()) {
        params.set("district", districtFilter.trim());
      }

      if (rateFilter === "under150") {
        params.set("maxRate", "150000");
      } else if (rateFilter === "150to250") {
        params.set("minRate", "150000");
        params.set("maxRate", "250000");
      } else if (rateFilter === "above250") {
        params.set("minRate", "250001");
      } else if (rateFilter === "demo") {
        params.set("maxRate", "10000");
      }

      const res = await fetch(`/api/coaches?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể tải danh sách huấn luyện viên.");
      }

      setCoaches(json.coaches || []);
      setTotal(json.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedSpecialty, districtFilter, rateFilter]);

  useEffect(() => {
    void fetchCoaches();
  }, [fetchCoaches]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty("");
    setRateFilter("all");
    setDistrictFilter("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-bg pb-16">
      {/* Hero Header */}
      <section className="border-b border-border bg-surface/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-content">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-court-50 px-3 py-1 text-xs font-semibold text-court-700 dark:bg-court-950/60 dark:text-court-300">
                <GraduationCap size={15} />
                Đội ngũ Huấn luyện viên Cầu lông
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Huấn luyện viên SmashBook
              </h1>
              <p className="mt-1 text-sm text-muted max-w-2xl">
                Khám phá các huấn luyện viên giàu kinh nghiệm, chuyên môn đa dạng từ kỹ thuật cơ bản
                đến chiến thuật thi đấu đỉnh cao. Đặt lịch cùng sân trực tuyến dễ dàng.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/coach"
                className="inline-flex items-center gap-2 rounded-control border border-court-600 bg-court-50/50 px-4 py-2 text-xs font-bold text-court-700 hover:bg-court-100 transition dark:bg-court-950/40 dark:text-court-300"
              >
                <UserCheck size={16} />
                Dành cho HLV (Đăng ký hồ sơ)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        {/* Bộ lọc tìm kiếm */}
        <div className="rounded-card border border-border bg-surface p-4 sm:p-5 shadow-xs mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <Filter size={16} className="text-court-600" />
              <span>Tìm kiếm & Bộ lọc nâng cao</span>
            </div>
            {(searchQuery || selectedSpecialty || districtFilter || rateFilter !== "all") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-court-600 hover:text-court-800 transition"
              >
                <RotateCcw size={13} />
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Tìm kiếm từ khóa */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Tìm tên hoặc từ khóa
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="VD: Tuấn, Chiến thuật..."
                  className="w-full rounded-control border border-border bg-bg pl-9 pr-3 py-2 text-xs text-ink outline-none focus:border-court-500"
                />
              </div>
            </div>

            {/* 2. Lọc chuyên môn */}
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Chuyên môn huấn luyện
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => {
                  setSelectedSpecialty(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-control border border-border bg-bg px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
              >
                <option value="">Tất cả chuyên môn</option>
                {COACH_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Lọc khu vực */}
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Khu vực / Quận huyện
              </label>
              <input
                type="text"
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="VD: Cầu Giấy, Thanh Xuân..."
                className="w-full rounded-control border border-border bg-bg px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
              />
            </div>

            {/* 4. Lọc học phí theo giờ */}
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Mức học phí / giờ
              </label>
              <select
                value={rateFilter}
                onChange={(e) => {
                  setRateFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-control border border-border bg-bg px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="demo">HLV Demo thử nghiệm (&le; 10.000đ)</option>
                <option value="under150">Dưới 150.000đ / giờ</option>
                <option value="150to250">150.000đ - 250.000đ / giờ</option>
                <option value="above250">Trên 250.000đ / giờ</option>
              </select>
            </div>
          </div>

          {/* Quick chips chuyên môn */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted mr-1">Chuyên môn nhanh:</span>
            {COACH_SPECIALTIES.map((spec) => {
              const active = selectedSpecialty === spec;
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => {
                    setSelectedSpecialty(active ? "" : spec);
                    setPage(1);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? "bg-court-600 text-white font-semibold shadow-xs"
                      : "bg-surface border border-border text-muted hover:border-court-400 hover:text-ink"
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thông báo kết quả / Đếm */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted">
            Tìm thấy <strong className="text-ink font-bold">{total}</strong> huấn luyện viên đang hoạt động
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-card border border-border bg-surface p-5 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-border/60 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 rounded bg-border/60" />
                    <div className="h-3 w-1/2 rounded bg-border/60" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-border/60" />
                <div className="h-3 w-5/6 rounded bg-border/60" />
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <div className="h-5 w-24 rounded bg-border/60" />
                  <div className="h-8 w-24 rounded bg-border/60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-card border border-rose-200 bg-rose-50/70 p-8 text-center text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertCircle size={28} className="mx-auto mb-2 text-rose-600" />
            <h3 className="text-sm font-bold">Không thể tải danh sách HLV</h3>
            <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-400">{error}</p>
            <button
              type="button"
              onClick={() => void fetchCoaches()}
              className="mt-4 rounded-control bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && coaches.length === 0 && (
          <div className="rounded-card border border-border bg-surface p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-court-50 text-court-600 dark:bg-court-950">
              <Search size={24} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-ink">Không tìm thấy huấn luyện viên phù hợp</h3>
            <p className="mt-1 text-xs text-muted max-w-md mx-auto">
              Không có huấn luyện viên nào thỏa mãn tiêu chí tìm kiếm hoặc bộ lọc hiện tại. Thử chọn
              chuyên môn khác hoặc xóa các bộ lọc.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-5 inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700 transition"
            >
              <RotateCcw size={14} />
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        )}

        {/* Coaches Cards Grid */}
        {!loading && !error && coaches.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => {
              const primaryVenue = coach.venues[0];
              return (
                <div
                  key={coach.id}
                  className="group flex flex-col justify-between rounded-card border border-border bg-surface p-5 shadow-xs transition hover:border-court-400 hover:shadow-md relative overflow-hidden"
                >
                  {/* Demo Indicator Ribbon */}
                  {coach.isDemo && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      <Sparkles size={12} className="text-amber-500" />
                      Demo Thử Nghiệm
                    </div>
                  )}

                  <div>
                    {/* Header: Avatar + Tên + Kinh nghiệm */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border group-hover:border-court-500 transition shrink-0 bg-court-100 dark:bg-court-950 flex items-center justify-center">
                        {coach.image ? (
                          <Image
                            src={coach.image}
                            alt={coach.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <span className="text-xl font-bold text-court-700 dark:text-court-300">
                            {coach.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <h2 className="text-sm font-bold text-ink truncate group-hover:text-court-600 transition">
                          {coach.name}
                        </h2>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                          <Award size={13} className="text-amber-500 shrink-0" />
                          <span>{coach.experienceYears} năm kinh nghiệm</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Đang nhận học viên
                        </div>
                      </div>
                    </div>

                    {/* Bio giới thiệu ngắn */}
                    {coach.bio && (
                      <p className="text-xs text-muted line-clamp-2 mb-3.5 leading-relaxed">
                        {coach.bio}
                      </p>
                    )}

                    {/* Danh mục chuyên môn */}
                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                      {coach.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="rounded bg-court-50 px-2 py-0.5 text-[10px] font-semibold text-court-700 dark:bg-court-950 dark:text-court-300 border border-court-200/50 dark:border-court-900/50"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Cơ sở giảng dạy */}
                    {coach.venues.length > 0 && (
                      <div className="mb-4 rounded-control border border-border/80 bg-bg p-2.5 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-ink">
                          <MapPin size={13} className="text-court-600 shrink-0" />
                          <span className="truncate">{primaryVenue.name}</span>
                        </div>
                        <p className="text-muted truncate pl-4.5">
                          {primaryVenue.district}, {primaryVenue.province}
                        </p>
                        {coach.venues.length > 1 && (
                          <p className="text-[10px] text-court-600 font-medium pl-4.5">
                            + {coach.venues.length - 1} cơ sở sân khác
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer: Học phí + Nút xem chi tiết & đặt lịch */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-auto">
                    <div>
                      <span className="block text-[10px] text-muted">Học phí kèm riêng:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-court-600 dark:text-court-400">
                          {coach.hourlyRate.toLocaleString("vi-VN")} đ
                        </span>
                        <span className="text-[10px] text-muted">/ giờ</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/coaches/${coach.id}`}
                        className="inline-flex items-center gap-1 rounded-control bg-court-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-court-700 transition active:scale-95 shadow-xs"
                      >
                        <span>Xem hồ sơ</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-court-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Trước
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 rounded-control text-xs font-bold transition ${
                    isActive
                      ? "bg-court-600 text-white"
                      : "border border-border bg-surface text-ink hover:bg-court-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-court-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
