"use client";

import React, { useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  PlusCircle,
  Clock,
  AlertTriangle,
  Lock,
  Layers,
} from "lucide-react";
import { formatHour } from "@/lib/booking";
import type { TimelineSchedule, TimelineSlot } from "@/app/api/venue-operations/route";

interface VenueScheduleTimelineProps {
  schedule: TimelineSchedule | null;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: TimelineSlot) => void;
  onCreateBookingAtSlot: (courtId: string, courtName: string, date: string, startMin: number, endMin: number) => void;
  loading?: boolean;
  onRefresh?: () => void;
  isStaff?: boolean;
}

function formatDateVN(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export default function VenueScheduleTimeline({
  schedule,
  selectedDate,
  onSelectDate,
  onSelectSlot,
  onCreateBookingAtSlot,
  loading = false,
  onRefresh,
  isStaff = false,
}: VenueScheduleTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef<boolean>(false);

  // Sinh danh sách các mốc giờ cách nhau 30 phút từ openMin đến closeMin
  // Xử lý chính xác cả khi openMin lệch (ví dụ 05:30 = 330) hoặc đóng 24:00 (1440)
  const timeHeaders = useMemo(() => {
    const openMin = schedule?.openMin ?? 300; // 05:00 mặc định
    const closeMin = schedule?.closeMin ?? 1320; // 22:00 mặc định
    const step = 30; // 30 phút mỗi cột theo quy chuẩn đồng bộ khách hàng
    const headers: { startMin: number; endMin: number; label: string }[] = [];
    for (let m = openMin; m < closeMin; m += step) {
      const nextM = Math.min(m + step, closeMin);
      headers.push({
        startMin: m,
        endMin: nextM,
        label: `${formatHour(m)} - ${formatHour(nextM)}`,
      });
    }
    return headers;
  }, [schedule?.openMin, schedule?.closeMin]);

  // Thời gian hiện tại theo múi giờ Việt Nam (UTC+7 / Asia/Ho_Chi_Minh)
  const nowVN = new Date(Date.now() + 7 * 3600000);
  const todayVNStr = nowVN.toISOString().slice(0, 10);
  const isToday = selectedDate === todayVNStr;
  const currentMin = isToday ? nowVN.getUTCHours() * 60 + nowVN.getUTCMinutes() : -1;

  // Tự động chuyển ngày khi qua nửa đêm hoặc khi quay lại tab (dành cho STAFF)
  useEffect(() => {
    const checkDateChange = () => {
      const currentNowVN = new Date(Date.now() + 7 * 3600000);
      const currentTodayStr = currentNowVN.toISOString().slice(0, 10);
      if (isStaff && selectedDate !== currentTodayStr) {
        onSelectDate(currentTodayStr);
      }
    };

    const interval = setInterval(checkDateChange, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkDateChange();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [isStaff, selectedDate, onSelectDate]);

  // Reset cờ auto-scroll khi đổi ngày hoặc đổi cơ sở
  useEffect(() => {
    hasAutoScrolledRef.current = false;
  }, [selectedDate, schedule?.courts]);

  // Tự cuộn đến gần mốc giờ hiện tại đúng 1 lần khi mở bảng
  useEffect(() => {
    if (
      !hasAutoScrolledRef.current &&
      isToday &&
      scrollContainerRef.current &&
      timeHeaders.length > 0 &&
      currentMin >= 0
    ) {
      const activeIdx = timeHeaders.findIndex(
        (h) => currentMin >= h.startMin && currentMin < h.endMin
      );
      if (activeIdx >= 0) {
        // Cột tên sân: ~130px, mỗi cột 30 phút: ~110px. Cuộn để cột hiện tại nằm giữa tầm mắt
        const targetScrollLeft = Math.max(0, activeIdx * 110 - 180);
        scrollContainerRef.current.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
        hasAutoScrolledRef.current = true;
      }
    }
  }, [isToday, currentMin, timeHeaders, schedule]);

  // Điều hướng ngày (chỉ dành cho ADMIN/OWNER)
  const handlePrevDay = () => {
    const d = new Date(`${selectedDate}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDate}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    onSelectDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    onSelectDate(todayVNStr);
  };

  return (
    <section className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-sm">
      {/* Header khu vực lịch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-court-600 shrink-0" />
            <h2 className="text-base font-bold text-ink">
              {isStaff ? (
                <span>Lịch sân hôm nay — {formatDateVN(selectedDate)}</span>
              ) : (
                <span>Lịch sân theo thời gian thực (Timeline)</span>
              )}
            </h2>
            {isStaff && (
              <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-300 dark:border-emerald-800">
                Ca trực hôm nay (Asia/Ho_Chi_Minh)
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            Lưới khung giờ 30 phút chuẩn hóa. Nhấp ô trống để tạo đơn quầy, ô đã đặt để xem đơn, phiên quá giờ để xử lý bàn giao.
          </p>
        </div>

        {/* Thanh điều hướng ngày: STAFF bị ẩn hoàn toàn date picker / next / prev */}
        <div className="flex items-center gap-2">
          {!isStaff ? (
            <>
              <button
                type="button"
                onClick={handlePrevDay}
                className="rounded-control border border-border p-1.5 text-muted hover:bg-court-50 hover:text-ink transition"
                title="Ngày hôm trước"
              >
                <ChevronLeft size={16} />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && onSelectDate(e.target.value)}
                className="rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-court-500"
              />

              <button
                type="button"
                onClick={handleNextDay}
                className="rounded-control border border-border p-1.5 text-muted hover:bg-court-50 hover:text-ink transition"
                title="Ngày tiếp theo"
              >
                <ChevronRight size={16} />
              </button>

              {!isToday && (
                <button
                  type="button"
                  onClick={handleToday}
                  className="rounded-control bg-court-50 px-2.5 py-1.5 text-xs font-semibold text-court-700 hover:bg-court-100 dark:bg-court-950 dark:text-court-300 transition"
                >
                  Hôm nay
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-xs">
              <Clock size={14} className="text-court-600" />
              <span>{formatDateVN(selectedDate)}</span>
            </div>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-control border border-border p-1.5 text-muted hover:bg-court-50 hover:text-ink transition"
              title="Làm mới lịch"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Bảng chú giải 7 trạng thái chi tiết (kèm nhãn, không chỉ dựa vào màu sắc) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted pb-1 border-b border-border/50">
        <span className="font-bold text-ink">Trạng thái:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40" />
          <span className="font-medium text-emerald-800 dark:text-emerald-300">Trống (Đặt quầy)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-amber-400 bg-amber-100 dark:border-amber-700 dark:bg-amber-950" />
          <span className="font-medium text-amber-800 dark:text-amber-300">Giữ chỗ (Chờ TT)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-sky-400 bg-sky-100 dark:border-sky-700 dark:bg-sky-950" />
          <span className="font-medium text-sky-800 dark:text-sky-300">Đã đặt (Chưa nhận)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-indigo-400 bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950" />
          <span className="font-medium text-indigo-800 dark:text-indigo-300">Đang sử dụng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-rose-500 bg-rose-200 dark:border-rose-700 dark:bg-rose-950 animate-pulse" />
          <span className="font-bold text-rose-800 dark:text-rose-300">Quá giờ / Chưa bàn giao</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-zinc-400 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800" />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Khóa / Bảo trì</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-slate-300 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
          <span className="font-medium text-slate-500 dark:text-slate-400">Đã qua giờ</span>
        </div>
      </div>

      {/* Lưới lịch cuộn ngang: Sticky cột tên sân con và sticky hàng giờ trên cùng */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto max-h-[620px] overflow-y-auto rounded-xl border border-border bg-surface shadow-inner relative"
      >
        {!schedule || !schedule.courts.length ? (
          <div className="py-16 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
            <Layers size={24} className="text-muted/60" />
            <p>{loading ? "Đang tải bảng lịch 30 phút..." : "Cơ sở chưa có sân con nào đang hoạt động."}</p>
          </div>
        ) : (
          <table className="min-w-full border-collapse text-xs select-none">
            <thead>
              <tr className="bg-court-50/90 dark:bg-surface border-b border-border sticky top-0 z-30 shadow-xs">
                {/* Ô góc giao nhau giữa hàng và cột (sticky cả top lẫn left) */}
                <th className="sticky left-0 top-0 z-40 bg-court-100 dark:bg-surface border-r border-border p-2.5 text-left font-bold text-ink min-w-[130px] shadow-[1px_0_3px_rgba(0,0,0,0.08)]">
                  Sân thi đấu
                </th>
                {timeHeaders.map((h, i) => {
                  const isCurrentSlot = isToday && currentMin >= h.startMin && currentMin < h.endMin;
                  return (
                    <th
                      key={i}
                      className={`p-2 text-center font-semibold text-muted min-w-[110px] border-r border-border/60 text-[11px] transition-colors ${
                        isCurrentSlot
                          ? "bg-court-200/70 text-court-900 dark:bg-court-950 dark:text-court-200 font-bold ring-1 ring-court-500"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{h.label}</span>
                        {isCurrentSlot && (
                          <span className="text-[9px] text-court-700 dark:text-court-300 font-extrabold tracking-wide uppercase mt-0.5">
                            ● Hiện tại
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {schedule.courts.map((court) => {
                return (
                  <tr key={court.id} className="hover:bg-court-50/15 transition-colors">
                    {/* Tên sân con (sticky bên trái, z-20) */}
                    <td className="sticky left-0 z-20 bg-surface p-2.5 font-bold text-ink border-r border-border shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-court-500" />
                        <span className="truncate max-w-[105px]">{court.name}</span>
                      </div>
                    </td>

                    {/* Các ô 30 phút */}
                    {timeHeaders.map((h, idx) => {
                      // Tìm slot phủ lên khung giờ 30 phút này
                      const matchingSlot = schedule.slots.find(
                        (s) =>
                          s.courtId === court.id &&
                          s.startMin < h.endMin &&
                          s.endMin > h.startMin
                      );

                      const isCurrentSlot = isToday && currentMin >= h.startMin && currentMin < h.endMin;
                      const isPast = isToday && h.endMin <= currentMin;

                      // 1. Ô TRỐNG (Chưa có đơn hoặc khóa)
                      if (!matchingSlot) {
                        if (isPast) {
                          // Đã qua giờ
                          return (
                            <td
                              key={idx}
                              className="p-1 border-r border-border/50 text-center bg-slate-50/60 dark:bg-slate-900/30"
                              title={`Đã qua giờ: ${court.name} (${h.label})`}
                            >
                              <div className="h-11 rounded-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-600 font-medium">
                                <span>Đã qua</span>
                              </div>
                            </td>
                          );
                        }

                        // Sân trống hợp lệ: có thể nhấp tạo đơn quầy
                        return (
                          <td
                            key={idx}
                            onClick={() =>
                              onCreateBookingAtSlot(
                                court.id,
                                court.name,
                                selectedDate,
                                h.startMin,
                                h.endMin
                              )
                            }
                            className={`p-1 border-r border-border/50 text-center cursor-pointer group hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition ${
                              isCurrentSlot ? "bg-court-50/30" : ""
                            }`}
                            title={`Sân trống: ${court.name} (${h.label}). Nhấp để tạo đơn quầy.`}
                          >
                            <div className="h-11 rounded-md border border-dashed border-emerald-300 bg-emerald-50/50 dark:border-emerald-800/80 dark:bg-emerald-950/20 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:border-emerald-500 group-hover:bg-emerald-100/60 group-hover:text-emerald-800 transition">
                              <PlusCircle size={13} className="opacity-60 group-hover:opacity-100" />
                              <span className="text-[9px] font-semibold mt-0.5">Trống</span>
                            </div>
                          </td>
                        );
                      }

                      // 2. Ô ĐÃ CÓ LỊCH / KHÓA / ĐANG SỬ DỤNG / QUÁ GIỜ
                      const isBlocked = matchingSlot.type === "BLOCKED";
                      const isOverdue = matchingSlot.type === "OVERDUE";
                      const isInUse = matchingSlot.type === "IN_USE";
                      const isHeld = matchingSlot.type === "HELD";

                      let bgClass = "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950/80 dark:border-sky-700 dark:text-sky-200";
                      let badgeText = "Đã đặt";
                      let subText = matchingSlot.bookingCode || "Chưa nhận sân";

                      if (isBlocked) {
                        bgClass = "bg-zinc-200 border-zinc-400 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300";
                        badgeText = "Khóa";
                        subText = matchingSlot.reason || "Bảo trì";
                      } else if (isOverdue) {
                        bgClass = "bg-rose-100 border-rose-500 text-rose-950 dark:bg-rose-950 dark:border-rose-600 dark:text-rose-100 ring-2 ring-rose-500/60 animate-pulse";
                        badgeText = "Quá giờ";
                        subText = "Chưa bàn giao";
                      } else if (isInUse) {
                        bgClass = "bg-indigo-100 border-indigo-400 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-200";
                        badgeText = "Đang chơi";
                        subText = matchingSlot.bookingCode || "Đang dùng";
                      } else if (isHeld) {
                        bgClass = "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200";
                        badgeText = "Giữ chỗ";
                        subText = "Chờ thanh toán";
                      }

                      return (
                        <td
                          key={idx}
                          onClick={() => !isBlocked && onSelectSlot(matchingSlot)}
                          className={`p-1 border-r border-border/50 text-center ${
                            isBlocked ? "cursor-not-allowed" : "cursor-pointer"
                          } ${isCurrentSlot ? "bg-court-50/20" : ""}`}
                          title={
                            isBlocked
                              ? `Khóa sân: ${matchingSlot.reason || "Bảo trì"}`
                              : `${matchingSlot.bookingCode} · ${matchingSlot.customerName} (${badgeText} - ${subText}). Nhấp xem chi tiết đơn.`
                          }
                        >
                          <div
                            className={`h-11 rounded-md border p-1 flex flex-col justify-center items-center text-[10px] shadow-xs font-medium truncate ${bgClass}`}
                          >
                            <div className="flex items-center gap-1 font-bold truncate max-w-[95px]">
                              {isOverdue && <AlertTriangle size={11} className="text-rose-600 shrink-0" />}
                              {isBlocked && <Lock size={10} className="text-zinc-600 shrink-0" />}
                              <span className="truncate">
                                {isBlocked ? matchingSlot.reason || "Bảo trì" : matchingSlot.customerName}
                              </span>
                            </div>
                            <span className="text-[9px] opacity-85 truncate max-w-[95px] font-semibold">
                              [{badgeText}] {subText}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
