"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, PlusCircle, AlertTriangle, ShieldAlert } from "lucide-react";
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
}

export default function VenueScheduleTimeline({
  schedule,
  selectedDate,
  onSelectDate,
  onSelectSlot,
  onCreateBookingAtSlot,
  loading = false,
  onRefresh,
}: VenueScheduleTimelineProps) {
  // Sinh danh sách các mốc giờ cách nhau 60 phút từ openMin đến closeMin
  const timeHeaders = useMemo(() => {
    const openMin = schedule?.openMin ?? 360; // 06:00
    const closeMin = schedule?.closeMin ?? 1320; // 22:00
    const step = 60; // 60 phút mỗi cột
    const headers: { startMin: number; endMin: number; label: string }[] = [];
    for (let m = openMin; m < closeMin; m += step) {
      headers.push({
        startMin: m,
        endMin: Math.min(m + step, closeMin),
        label: `${formatHour(m)} - ${formatHour(Math.min(m + step, closeMin))}`,
      });
    }
    return headers;
  }, [schedule?.openMin, schedule?.closeMin]);

  // Điều hướng ngày: Hôm nay, Hôm trước, Hôm sau
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
    const nowVN = new Date(Date.now() + 7 * 3600000);
    onSelectDate(nowVN.toISOString().slice(0, 10));
  };

  const nowVN = new Date(Date.now() + 7 * 3600000);
  const todayStr = nowVN.toISOString().slice(0, 10);
  const isToday = selectedDate === todayStr;

  return (
    <section className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-sm">
      {/* Header khu vực lịch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-court-600" />
            <h2 className="text-base font-bold text-ink">
              Lịch sân theo thời gian thực (Timeline)
            </h2>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Xem trực quan tình trạng từng sân theo khung giờ. Nhấp ô trống để tạo đơn quầy hoặc ô đã đặt để xem chi tiết.
          </p>
        </div>

        {/* Thanh điều hướng ngày */}
        <div className="flex items-center gap-2">
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

      {/* Bảng chú giải trạng thái */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted pb-1">
        <span className="font-semibold text-ink">Chú giải:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40" />
          <span>Trống (Đặt quầy)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-100 dark:border-amber-800 dark:bg-amber-950" />
          <span>Giữ chỗ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-sky-400 bg-sky-100 dark:border-sky-800 dark:bg-sky-950" />
          <span>Đã đặt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-indigo-500 bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950" />
          <span>Đang sử dụng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-rose-500 bg-rose-200 dark:border-rose-800 dark:bg-rose-950" />
          <span>Quá giờ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-zinc-400 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800" />
          <span>Khóa / Bảo trì</span>
        </div>
      </div>

      {/* Lưới lịch cuộn ngang */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-inner">
        {!schedule || !schedule.courts.length ? (
          <div className="py-12 text-center text-xs text-muted">
            {loading ? "Đang tải lịch sân..." : "Cơ sở chưa có sân con nào đang hoạt động."}
          </div>
        ) : (
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-court-50/70 dark:bg-surface/90 border-b border-border">
                <th className="sticky left-0 z-20 bg-court-50 dark:bg-surface p-2.5 text-left font-bold text-ink min-w-[130px] border-r border-border">
                  Sân con
                </th>
                {timeHeaders.map((h, i) => (
                  <th
                    key={i}
                    className="p-2 text-center font-semibold text-muted min-w-[110px] border-r border-border/60 text-[11px]"
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {schedule.courts.map((court) => {
                return (
                  <tr key={court.id} className="hover:bg-court-50/20 transition-colors">
                    {/* Tên sân con (sticky bên trái) */}
                    <td className="sticky left-0 z-10 bg-surface p-2.5 font-bold text-ink border-r border-border shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                      {court.name}
                    </td>

                    {/* Các ô khung giờ */}
                    {timeHeaders.map((h, idx) => {
                      // Tìm slot phủ lên khung giờ này
                      const matchingSlot = schedule.slots.find(
                        (s) =>
                          s.courtId === court.id &&
                          s.startMin < h.endMin &&
                          s.endMin > h.startMin
                      );

                      if (!matchingSlot) {
                        // Ô TRỐNG
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
                            className="p-1 border-r border-border/50 text-center cursor-pointer group hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition"
                            title={`Sân trống: ${court.name} (${h.label}). Nhấp để tạo đơn quầy.`}
                          >
                            <div className="h-10 rounded-md border border-dashed border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/10 flex items-center justify-center text-emerald-700/60 dark:text-emerald-400/60 group-hover:border-emerald-500 group-hover:text-emerald-600 transition">
                              <PlusCircle size={14} className="opacity-40 group-hover:opacity-100" />
                            </div>
                          </td>
                        );
                      }

                      // Ô ĐÃ CÓ LỊCH / KHÓA
                      const isBlocked = matchingSlot.type === "BLOCKED";
                      const isOverdue = matchingSlot.type === "OVERDUE";
                      const isInUse = matchingSlot.type === "IN_USE";
                      const isHeld = matchingSlot.type === "HELD";

                      let bgClass = "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-950/80 dark:border-sky-700 dark:text-sky-200";
                      let badgeText = "Đã đặt";

                      if (isBlocked) {
                        bgClass = "bg-zinc-200 border-zinc-400 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300";
                        badgeText = "Khóa";
                      } else if (isOverdue) {
                        bgClass = "bg-rose-100 border-rose-400 text-rose-900 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-200 animate-pulse";
                        badgeText = "Quá giờ";
                      } else if (isInUse) {
                        bgClass = "bg-indigo-100 border-indigo-400 text-indigo-900 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-200";
                        badgeText = "Đang chơi";
                      } else if (isHeld) {
                        bgClass = "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200";
                        badgeText = "Giữ chỗ";
                      }

                      return (
                        <td
                          key={idx}
                          onClick={() => !isBlocked && onSelectSlot(matchingSlot)}
                          className={`p-1 border-r border-border/50 text-center ${
                            isBlocked ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                          title={
                            isBlocked
                              ? `Khóa sân: ${matchingSlot.reason || "Bảo trì"}`
                              : `${matchingSlot.bookingCode} · ${matchingSlot.customerName} (${badgeText})`
                          }
                        >
                          <div
                            className={`h-10 rounded-md border p-1 flex flex-col justify-center items-center text-[10px] shadow-xs font-medium truncate ${bgClass}`}
                          >
                            <span className="font-bold truncate max-w-[95px]">
                              {isBlocked ? matchingSlot.reason || "Khóa" : matchingSlot.customerName}
                            </span>
                            <span className="text-[9px] opacity-80 truncate">
                              {isBlocked ? "Bảo trì" : matchingSlot.bookingCode || badgeText}
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
