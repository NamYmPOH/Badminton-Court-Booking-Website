"use client";

import React, { useMemo } from "react";
import type { Court } from "@/types/venue";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";
import { Check, Clock, Lock, Wrench, CircleDot, AlertTriangle, Sparkles } from "lucide-react";

export type CourtSlotStatus = "AVAILABLE" | "SELECTED" | "HELD" | "BOOKED" | "MAINTENANCE" | "PAST";

export interface CourtSlotInfo {
  court: Court;
  status: CourtSlotStatus;
  price: number | null;
  hasCustomPricing?: boolean;
  isSelected?: boolean;
  selectedSlotsCount?: number;
}

interface CourtLayoutMapProps {
  courts: Court[];
  slotTimeLabel?: string;
  slotStartMin?: number;
  slotEndMin?: number;
  date?: string;
  busySlots?: { courtId: string; startMin: number; endMin: number; status?: string }[];
  selectedSlots?: { courtId: string; startMin: number; endMin: number }[];
  onSelectCourtSlot?: (court: Court) => void;
  getPriceForCourt?: (courtId: string) => number | null;
  isPast?: boolean;
  interactive?: boolean;
}

export function CourtLayoutMap({
  courts,
  slotTimeLabel,
  slotStartMin,
  slotEndMin,
  busySlots = [],
  selectedSlots = [],
  onSelectCourtSlot,
  getPriceForCourt,
  isPast = false,
  interactive = true,
}: CourtLayoutMapProps) {
  // 1. Phân bổ hàng và cột (hỗ trợ fallback lưới mặc định nếu cơ sở cũ chưa cấu hình)
  const layoutCourts = useMemo(() => {
    return courts.map((court, index) => {
      const row = court.positionRow && court.positionRow > 0 ? court.positionRow : Math.floor(index / 3) + 1;
      const col = court.positionCol && court.positionCol > 0 ? court.positionCol : (index % 3) + 1;
      const orientation = court.orientation === "VERTICAL" ? "VERTICAL" : "HORIZONTAL";

      // Đánh giá trạng thái sân trong khung giờ hiện hành
      let status: CourtSlotStatus = "AVAILABLE";
      if (court.status === "MAINTENANCE" || court.status === "INACTIVE" || !court.isActive) {
        status = "MAINTENANCE";
      } else if (isPast) {
        status = "PAST";
      } else if (
        slotStartMin !== undefined &&
        slotEndMin !== undefined &&
        selectedSlots.some((s) => s.courtId === court.id && s.startMin === slotStartMin)
      ) {
        status = "SELECTED";
      } else if (
        slotStartMin !== undefined &&
        slotEndMin !== undefined
      ) {
        const busyItem = busySlots.find(
          (b) => b.courtId === court.id && b.startMin < slotEndMin && b.endMin > slotStartMin
        );
        if (busyItem) {
          status = busyItem.status === "HELD" ? "HELD" : "BOOKED";
        }
      }

      const price = getPriceForCourt ? getPriceForCourt(court.id) : null;
      const selectedCount = selectedSlots.filter((s) => s.courtId === court.id).length;

      return {
        court,
        row,
        col,
        orientation,
        status,
        price,
        selectedCount,
      };
    });
  }, [courts, slotStartMin, slotEndMin, busySlots, selectedSlots, isPast, getPriceForCourt]);

  // 2. Tính số hàng và cột tối đa của layout
  const maxRow = useMemo(() => {
    return Math.max(1, ...layoutCourts.map((c) => c.row));
  }, [layoutCourts]);

  const maxCol = useMemo(() => {
    return Math.max(1, ...layoutCourts.map((c) => c.col));
  }, [layoutCourts]);

  return (
    <div className="space-y-4">
      {/* Chú giải trạng thái trực quan bằng chữ + icon + màu sắc */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-3 text-xs">
        <span className="font-bold text-ink">Chú thích sơ đồ:</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <CircleDot size={11} />
          </span>
          <span className="font-medium text-ink">Còn trống</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-court-600 text-white">
            <Check size={11} strokeWidth={3} />
          </span>
          <span className="font-semibold text-court-600">Đang chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40">
            <Clock size={11} />
          </span>
          <span className="text-muted">Đang giữ (5p)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-950/40">
            <Lock size={11} />
          </span>
          <span className="text-muted">Đã đặt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-slate-100 text-slate-500 dark:bg-slate-800">
            <Wrench size={11} />
          </span>
          <span className="text-muted">Bảo trì/Khóa</span>
        </div>
      </div>

      {/* Khung sơ đồ 2D */}
      <div className="overflow-x-auto rounded-card border border-border bg-surface p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Sơ đồ bố trí sân thi đấu
            </span>
            {slotTimeLabel && (
              <span className="rounded bg-court-100 px-2 py-0.5 text-xs font-bold text-court-700 dark:bg-court-950 dark:text-court-300">
                Khung giờ xem: {slotTimeLabel}
              </span>
            )}
          </div>
          <span className="text-xs text-muted">
            Tổng cộng: <strong>{courts.length} sân</strong> ({maxRow} hàng × {maxCol} cột)
          </span>
        </div>

        {/* Lưới CSS Grid theo kích thước maxRow x maxCol */}
        <div
          className="grid gap-4 sm:gap-6"
          style={{
            gridTemplateColumns: `repeat(${maxCol}, minmax(140px, 1fr))`,
            gridTemplateRows: `repeat(${maxRow}, minmax(110px, auto))`,
          }}
        >
          {layoutCourts.map(({ court, row, col, orientation, status, price, selectedCount }) => {
            const isClickable = interactive && status === "AVAILABLE" || status === "SELECTED";
            const isVertical = orientation === "VERTICAL";

            let cardStyles = "border-border bg-white text-ink hover:border-court-400 dark:bg-surface";
            let statusBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CircleDot size={12} /> Còn trống
              </span>
            );

            if (status === "SELECTED") {
              cardStyles = "border-court-600 bg-court-50 shadow-md ring-2 ring-court-600 dark:bg-court-950/60";
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded bg-court-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Check size={11} strokeWidth={3} /> Đang chọn
                </span>
              );
            } else if (status === "HELD") {
              cardStyles = "border-amber-300 bg-amber-50/70 text-amber-900 cursor-not-allowed dark:border-amber-900/40 dark:bg-amber-950/30";
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  <Clock size={12} /> Đang giữ chỗ
                </span>
              );
            } else if (status === "BOOKED") {
              cardStyles = "border-rose-200 bg-rose-50/70 text-rose-800 cursor-not-allowed dark:border-rose-900/40 dark:bg-rose-950/30";
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  <Lock size={12} /> Đã có khách
                </span>
              );
            } else if (status === "MAINTENANCE") {
              cardStyles = "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900";
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Wrench size={12} /> Tạm ngừng/Bảo trì
                </span>
              );
            } else if (status === "PAST") {
              cardStyles = "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900/50";
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  Đã qua giờ
                </span>
              );
            }

            return (
              <div
                key={court.id}
                style={{
                  gridRowStart: row,
                  gridColumnStart: col,
                }}
                onClick={() => {
                  if (isClickable && onSelectCourtSlot) {
                    onSelectCourtSlot(court);
                  }
                }}
                className={`relative flex flex-col justify-between rounded-card border p-3.5 transition-all ${cardStyles} ${
                  isClickable ? "cursor-pointer hover:shadow-md" : ""
                } ${isVertical ? "min-h-[140px]" : "min-h-[115px]"}`}
              >
                {/* Phần header thẻ sân */}
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-bold text-ink sm:text-base">
                      {court.name}
                    </h3>
                    {court.hasCustomPricing && (
                      <span
                        title="Sân áp dụng biểu giá riêng đặc biệt"
                        className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.2 text-[9px] font-black text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                      >
                        <Sparkles size={9} /> Giá riêng
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                    {court.description || court.surface || "Thảm thi đấu tiêu chuẩn"}
                  </p>
                </div>

                {/* Sơ đồ mini mô phỏng sân cầu lông */}
                <div className="my-2 flex items-center justify-center">
                  <div
                    className={`relative rounded border border-court-400/60 bg-court-500/10 dark:border-court-500/40 ${
                      isVertical ? "h-12 w-8" : "h-7 w-16"
                    }`}
                  >
                    {/* Đường phân sân giữa */}
                    <div
                      className={`absolute bg-court-400/60 ${
                        isVertical
                          ? "top-1/2 left-0 right-0 h-px"
                          : "left-1/2 top-0 bottom-0 w-px"
                      }`}
                    />
                  </div>
                </div>

                {/* Phần chân thẻ sân: Trạng thái & Giá */}
                <div className="mt-1 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                  <div>{statusBadge}</div>
                  {price !== null && (
                    <span className="font-bold text-court-600">
                      {formatVND(price)}
                    </span>
                  )}
                </div>

                {/* Badge số khung giờ đã chọn trên sân này */}
                {selectedCount > 0 && status !== "SELECTED" && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-court-600 text-[10px] font-black text-white shadow">
                    {selectedCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
