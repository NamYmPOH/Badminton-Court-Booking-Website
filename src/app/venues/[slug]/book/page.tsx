"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LayoutGrid, Map as MapIcon, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Venue, Court } from "@/types/venue";
import { formatVND } from "@/lib/utils";
import {
  bookingDates,
  formatHour,
  isPastSlot,
  selectionError,
  slotPrice,
  parseSelection,
  type SelectedSlot,
} from "@/lib/booking";
import { CourtLayoutMap } from "@/components/features/venues/CourtLayoutMap";

interface BookPageProps {
  params: {
    slug: string;
  };
}

export default function CourtBookingGridPage({ params }: BookPageProps) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => bookingDates()[0].value);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<{ courtId: string; startMin: number; endMin: number; status?: string }[]>([]);

  // Chế độ xem: "MAP" (Sơ đồ 2D) hoặc "GRID" (Lưới giờ chi tiết)
  const [viewMode, setViewMode] = useState<"MAP" | "GRID">("MAP");
  const [activeSlotMin, setActiveSlotMin] = useState<number>(0);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    setCatalogLoading(true);
    fetch(`/api/booking-catalog?slug=${encodeURIComponent(params.slug)}&date=${selectedDate}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      })
      .then((data) => {
        setVenue(data.venue);
        setBusy(data.busy || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setVenue(null);
          setError(error.message || "Không tải được lịch sân.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [params.slug, selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const dates = useMemo(() => bookingDates(now), [now]);

  const timeSlots = useMemo(() => {
    if (!venue) return [];
    return Array.from({ length: Math.floor((venue.closeMin - venue.openMin) / 30) }, (_, i) => {
      const startMin = venue.openMin + i * 30;
      return { startMin, endMin: startMin + 30, label: `${formatHour(startMin)} – ${formatHour(startMin + 30)}` };
    });
  }, [venue]);

  // Đặt khung giờ mặc định cho sơ đồ 2D
  useEffect(() => {
    if (timeSlots.length > 0 && activeSlotMin === 0) {
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const firstAvailable = timeSlots.find((ts) => ts.endMin > currentMin);
      setActiveSlotMin(firstAvailable ? firstAvailable.startMin : timeSlots[0].startMin);
    }
  }, [timeSlots, now, activeSlotMin]);

  // Tự động cuộn đến khung giờ hiện tại khi xem ngày "Hôm nay" trong chế độ GRID
  useEffect(() => {
    if (viewMode !== "GRID" || !gridContainerRef.current || !venue || !timeSlots.length) return;
    const isToday = selectedDate === dates[0]?.value;
    if (isToday) {
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const firstAvailableIndex = timeSlots.findIndex((ts) => ts.endMin > currentMin);
      if (firstAvailableIndex > 0) {
        const targetScroll = Math.max(0, (firstAvailableIndex - 1) * 76);
        gridContainerRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    } else {
      gridContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [selectedDate, venue, timeSlots, dates, now, viewMode]);

  const toggleSlot = (courtId: string, courtName: string, startMin: number, endMin: number) => {
    if (!venue) return;

    if (isPastSlot(selectedDate, startMin, now)) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const nextAvailableSlotMin = Math.ceil(currentMinutes / 30) * 30;
      toast.warning(
        `Khung giờ ${formatHour(startMin)} đã qua thời gian đặt của ngày hôm nay. Vui lòng chọn từ ${formatHour(nextAvailableSlotMin)} trở đi hoặc chọn ngày tiếp theo.`
      );
      return;
    }

    if (busy.some((b) => b.courtId === courtId && b.startMin < endMin && b.endMin > startMin)) {
      toast.error(`Khung giờ ${formatHour(startMin)} trên ${courtName} đã có khách giữ hoặc đặt trước.`);
      return;
    }

    const price = slotPrice(venue, selectedDate, startMin, endMin, courtId);
    if (price === null) {
      toast.error("Không tìm thấy bảng giá áp dụng cho khung giờ này.");
      return;
    }

    setError("");
    setSelectedSlots((previous) => {
      const exists = previous.some((s) => s.courtId === courtId && s.startMin === startMin);
      if (exists) {
        return previous.filter((s) => !(s.courtId === courtId && s.startMin === startMin));
      } else {
        return [...previous, { courtId, courtName, startMin, endMin, price }];
      }
    });
  };

  const totalPrice = useMemo(() => {
    return selectedSlots.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSlots]);

  // Gom nhóm các slot đã chọn theo từng sân con
  const selectedByCourt = useMemo(() => {
    const map = new Map<string, { courtName: string; slots: SelectedSlot[]; subtotal: number }>();
    for (const slot of selectedSlots) {
      if (!map.has(slot.courtId)) {
        map.set(slot.courtId, { courtName: slot.courtName, slots: [], subtotal: 0 });
      }
      const entry = map.get(slot.courtId)!;
      entry.slots.push(slot);
      entry.subtotal += slot.price;
    }
    return Array.from(map.values()).map((entry) => {
      entry.slots.sort((a, b) => a.startMin - b.startMin);
      return entry;
    });
  }, [selectedSlots]);

  if (catalogLoading) return <p className="p-8">Đang tải thông tin sân...</p>;
  if (!venue)
    return (
      <div className="p-8">
        <p role="alert">{error || "Cơ sở chưa mở đặt sân trực tuyến."}</p>
        <Link href="/venues" className="text-court-600 underline">
          Quay lại danh sách sân
        </Link>
      </div>
    );

  const isToday = selectedDate === dates[0]?.value;
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const isTodayExpired = isToday && venue ? currentMin >= venue.closeMin : false;

  const invalidSelection = selectionError(selectedSlots, venue.courts);

  const handleCheckout = () => {
    const params = new URLSearchParams({
      venueId: venue.id,
      date: selectedDate,
      slots: JSON.stringify(selectedSlots),
    });
    if (!parseSelection([venue], params, new Date(), false)) {
      setError(invalidSelection || "Lựa chọn đã hết hạn hoặc không hợp lệ. Vui lòng chọn lại giờ chơi.");
      return;
    }
    router.push(`/checkout?${params}`);
  };

  const activeSlotObj = timeSlots.find((ts) => ts.startMin === activeSlotMin) || timeSlots[0];

  return (
    <div className="min-h-screen bg-bg pb-56 lg:pb-36">
      {/* Header thanh điều hướng phía trên */}
      <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-content items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/venues/${venue.slug}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition hover:bg-court-50 hover:text-ink"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-ink sm:text-xl">
                Đặt sân — {venue.name}
              </h1>
              <p className="text-xs text-muted">
                Chọn sân con và khung giờ mong muốn. Bạn có thể chọn nhiều sân trong cùng một đơn.
              </p>
            </div>
          </div>

          {/* Nút chuyển chế độ xem: Sơ đồ 2D vs Lưới giờ */}
          <div className="flex items-center rounded-control border border-border bg-bg p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("MAP")}
              className={`flex items-center gap-1.5 rounded-control px-3 py-1.5 font-bold transition ${
                viewMode === "MAP"
                  ? "bg-court-600 text-white shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <MapIcon size={14} />
              <span className="hidden sm:inline">Sơ đồ 2D</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`flex items-center gap-1.5 rounded-control px-3 py-1.5 font-bold transition ${
                viewMode === "GRID"
                  ? "bg-court-600 text-white shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Lưới giờ chi tiết</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-content px-4 py-6 sm:px-6">
        {/* Dải chọn ngày 7 ngày tới */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {dates.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => {
                setSelectedDate(d.value);
                setSelectedSlots([]);
                setError("");
              }}
              className={`flex min-w-[96px] flex-col items-center rounded-card border px-3 py-2 text-xs transition ${
                selectedDate === d.value
                  ? "border-court-600 bg-court-600 font-bold text-white shadow-sm"
                  : "border-border bg-surface text-muted hover:border-court-300 hover:text-ink"
              }`}
            >
              <span>{d.label}</span>
              <span className="mt-0.5 text-xs opacity-90">{d.sub}</span>
            </button>
          ))}
        </div>

        {/* Thông báo nếu toàn bộ khung giờ hôm nay đã kết thúc */}
        {isTodayExpired && (
          <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 sm:flex-row sm:items-center">
            <div>
              <p className="font-bold">Các khung giờ hôm nay đã kết thúc lúc {formatHour(venue.closeMin)}</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                Hiện không còn giờ trống để đặt cho hôm nay. Bạn có thể chuyển sang Ngày mai để đặt sân sớm.
              </p>
            </div>
            {dates[1] && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(dates[1].value);
                  setSelectedSlots([]);
                  setError("");
                }}
                className="shrink-0 rounded-control bg-court-600 px-4 py-2 font-bold text-white transition hover:bg-court-700"
              >
                Chuyển sang Ngày mai ({dates[1].sub}) →
              </button>
            )}
          </div>
        )}

        {/* Chế độ 1: SƠ ĐỒ 2D TRỰC QUAN */}
        {viewMode === "MAP" && (
          <div className="space-y-6">
            {/* Thanh chọn khung giờ hiển thị trên sơ đồ */}
            <div className="rounded-card border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <span className="text-xs font-bold text-ink">
                  Bước 1: Chọn khung giờ cần xem tình trạng sân
                </span>
                <span className="text-xs text-muted">
                  Bấm vào từng sân trên sơ đồ dưới đây để chọn/bỏ chọn
                </span>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {timeSlots.map((ts) => {
                  const isCurrent = isToday && currentMin >= ts.startMin && currentMin < ts.endMin;
                  const isPast = isPastSlot(selectedDate, ts.startMin, now);
                  const isSelected = activeSlotMin === ts.startMin;
                  const bookedInSlotCount = busy.filter(
                    (b) => b.startMin < ts.endMin && b.endMin > ts.startMin
                  ).length;
                  const availableCount = Math.max(0, venue.courts.filter((c) => c.isActive).length - bookedInSlotCount);

                  return (
                    <button
                      key={ts.startMin}
                      type="button"
                      disabled={isPast}
                      onClick={() => setActiveSlotMin(ts.startMin)}
                      className={`flex min-w-[105px] flex-col items-center rounded-control border px-3 py-2 text-xs transition ${
                        isSelected
                          ? "border-court-600 bg-court-600 text-white font-bold shadow-sm"
                          : isPast
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900"
                          : "border-border bg-bg text-ink hover:border-court-300"
                      }`}
                    >
                      <span className="font-semibold">{formatHour(ts.startMin)}</span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? "text-court-100" : isPast ? "text-slate-400" : "text-emerald-600 font-medium"}`}>
                        {isPast ? "Đã qua" : `Còn ${availableCount} sân`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sơ đồ 2D trực quan */}
            {activeSlotObj && (
              <CourtLayoutMap
                courts={venue.courts}
                slotTimeLabel={activeSlotObj.label}
                slotStartMin={activeSlotObj.startMin}
                slotEndMin={activeSlotObj.endMin}
                busySlots={busy}
                selectedSlots={selectedSlots}
                isPast={isPastSlot(selectedDate, activeSlotObj.startMin, now)}
                getPriceForCourt={(courtId) =>
                  slotPrice(venue, selectedDate, activeSlotObj.startMin, activeSlotObj.endMin, courtId)
                }
                onSelectCourtSlot={(court) =>
                  toggleSlot(court.id, court.name, activeSlotObj.startMin, activeSlotObj.endMin)
                }
              />
            )}
          </div>
        )}

        {/* Chế độ 2: LƯỚI GIỜ CHI TIẾT */}
        {viewMode === "GRID" && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface p-3 text-xs">
              <span className="font-bold text-ink">Chú giải ô lịch:</span>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-border bg-white dark:bg-surface" />
                <span>Trống</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-4 w-4 items-center justify-center rounded bg-court-600 text-white text-[10px]">
                  ✓
                </div>
                <span className="font-semibold text-court-600">Đã chọn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-rose-300 bg-rose-100 dark:bg-rose-950" />
                <span className="text-muted">Đã đặt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-amber-300 bg-amber-100 dark:bg-amber-950" />
                <span className="text-muted">Đang giữ (5p)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded border border-slate-300 bg-slate-200 dark:bg-slate-800" />
                <span className="text-muted">Khoá / Bảo trì</span>
              </div>
            </div>

            <div
              ref={gridContainerRef}
              className="overflow-x-auto rounded-card border border-border bg-surface p-4 shadow-sm scroll-smooth"
            >
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[130px] bg-court-700 p-2.5 text-left text-xs font-bold text-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                      Sân thi đấu
                    </th>
                    {timeSlots.map((ts) => {
                      const isCurrentSlot = isToday && currentMin >= ts.startMin && currentMin < ts.endMin;
                      return (
                        <th
                          key={ts.startMin}
                          className={`min-w-[68px] border-l border-white/20 p-2.5 text-xs font-semibold text-white relative transition-colors ${
                            isCurrentSlot ? "bg-court-800 font-bold" : "bg-court-700"
                          }`}
                        >
                          <div>{formatHour(ts.startMin)}</div>
                          {isCurrentSlot && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-amber-400 px-1 py-0.2 text-[8px] font-black text-court-950 uppercase shadow-sm">
                              Hiện tại
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {venue.courts
                    .filter((court) => court.isActive)
                    .map((court) => (
                      <tr key={court.id}>
                        {/* Cột tên sân cố định bên trái */}
                        <td className="sticky left-0 z-10 bg-surface p-3 text-left font-bold text-xs text-ink shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-1">
                            <span>{court.name}</span>
                            {court.hasCustomPricing && (
                              <span title="Áp dụng biểu giá riêng" className="text-[10px] text-amber-600">
                                ★
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Các ô giờ 30 phút */}
                        {timeSlots.map((ts) => {
                          const busyItem = busy.find(
                            (b) => b.courtId === court.id && b.startMin < ts.endMin && b.endMin > ts.startMin
                          );
                          const isBooked = !!busyItem && busyItem.status !== "HELD";
                          const isHeld = !!busyItem && busyItem.status === "HELD";
                          const isPast = isPastSlot(selectedDate, ts.startMin, now);
                          const price = slotPrice(venue, selectedDate, ts.startMin, ts.endMin, court.id);
                          const isUnavailable = isPast || price === null || isBooked || isHeld;
                          const isSelected = selectedSlots.some(
                            (s) => s.courtId === court.id && s.startMin === ts.startMin
                          );

                          return (
                            <td key={ts.startMin} className="p-1">
                              <button
                                type="button"
                                aria-label={`${court.name}, ${ts.label}`}
                                aria-pressed={isSelected}
                                disabled={isUnavailable && !isSelected}
                                onClick={() => toggleSlot(court.id, court.name, ts.startMin, ts.endMin)}
                                title={
                                  isBooked
                                    ? `${court.name}: ${ts.label} - Đã có người đặt`
                                    : isHeld
                                    ? `${court.name}: ${ts.label} - Đang giữ chỗ`
                                    : isPast
                                    ? `${court.name}: ${ts.label} - Giờ chơi đã qua`
                                    : price === null
                                    ? "Không khả dụng"
                                    : isSelected
                                    ? `${court.name}: ${ts.label} - Đang chọn (${formatVND(price)})`
                                    : `${court.name}: ${ts.label} - Trống (${formatVND(price)}/30ph)`
                                }
                                className={`h-11 w-full rounded-slot border text-xs font-medium transition flex items-center justify-center ${
                                  isSelected
                                    ? "border-court-600 bg-court-600 font-bold text-white shadow-sm"
                                    : isBooked
                                    ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-400 dark:border-rose-900/50 dark:bg-rose-950/40"
                                    : isHeld
                                    ? "cursor-not-allowed border-amber-300 bg-amber-50 text-amber-500 dark:border-amber-900/50 dark:bg-amber-950/40"
                                    : isUnavailable
                                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200/70 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-500"
                                    : "border-border bg-white text-ink hover:border-court-400 hover:bg-court-50 dark:bg-surface"
                                }`}
                              >
                                {isSelected ? (
                                  <Check size={14} strokeWidth={3} />
                                ) : isBooked ? (
                                  <span className="text-[11px] select-none text-rose-400">▨</span>
                                ) : isHeld ? (
                                  <span className="text-[11px] select-none text-amber-500">⏳</span>
                                ) : isUnavailable ? (
                                  <span className="text-[11px] select-none text-slate-400 dark:text-slate-500 font-light">—</span>
                                ) : null}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Thanh tóm tắt cố định dưới đáy: Hiển thị đầy đủ từng sân và tổng tiền */}
      <div className="fixed inset-x-0 bottom-16 z-30 lg:bottom-0 border-t border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
        {(error || (selectedSlots.length > 0 && invalidSelection)) && (
          <p role="alert" className="mx-auto max-w-content px-4 pb-2 text-sm font-semibold text-rose-600">
            {error || invalidSelection}
          </p>
        )}
        <div className="mx-auto flex max-w-content flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted">
                Đã chọn: <strong className="text-ink">{selectedSlots.length} ô</strong> ({selectedByCourt.length} sân con)
              </span>

              <div className="text-sm font-bold text-ink sm:ml-4">
                Tổng cộng: <span className="text-base text-court-600 font-black">{formatVND(totalPrice)}</span>
              </div>
            </div>

            {/* Liệt kê chi tiết từng sân đã chọn */}
            {selectedByCourt.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedByCourt.map((c) => (
                  <span
                    key={c.courtName}
                    className="inline-flex items-center gap-1 rounded bg-court-50 px-2 py-0.5 text-[11px] font-medium text-court-800 dark:bg-court-950 dark:text-court-200"
                  >
                    <strong>{c.courtName}:</strong> {formatHour(c.slots[0].startMin)}–{formatHour(c.slots[c.slots.length - 1].endMin)} ({formatVND(c.subtotal)})
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={selectedSlots.length === 0 || !!invalidSelection}
            onClick={handleCheckout}
            className="rounded-control bg-racket-500 px-8 py-3 text-sm font-bold text-court-900 transition-colors hover:bg-racket-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục thanh toán →
          </button>
        </div>
      </div>
    </div>
  );
}
