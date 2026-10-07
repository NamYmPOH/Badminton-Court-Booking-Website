"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import type { Venue } from "@/types/venue";
import { formatVND } from "@/lib/utils";

import { bookingDates, formatHour, isPastSlot, selectionError, slotPrice, parseSelection, type SelectedSlot } from "@/lib/booking";

interface BookPageProps {
  params: {
    slug: string;
  };
}


export default function CourtBookingGridPage({ params }: BookPageProps) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [now, setNow] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<{ courtId: string; startMin: number; endMin: number }[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    fetch(`/api/booking-catalog?slug=${encodeURIComponent(params.slug)}&date=${selectedDate}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; })
      .then(data => { setVenue(data.venue); setBusy(data.busy || []); })
      .catch(error => { if (!controller.signal.aborted) { setVenue(null); setError(error.message || "Không tải được lịch sân."); } })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
    return () => controller.abort();
  }, [params.slug, selectedDate]);
  useEffect(() => {
    setNow(new Date());
    setSelectedDate(bookingDates()[0].value);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const dates = now ? bookingDates(now) : [];
  const timeSlots = venue ? Array.from({ length: Math.floor((venue.closeMin - venue.openMin) / 30) }, (_, i) => {
    const startMin = venue.openMin + i * 30;
    return { startMin, endMin: startMin + 30, label: formatHour(startMin) };
  }) : [];
  const toggleSlot = (courtId: string, courtName: string, startMin: number, endMin: number) => {
    if (!venue || isPastSlot(selectedDate, startMin) || busy.some(b => b.courtId === courtId && b.startMin < endMin && b.endMin > startMin)) return;
    const price = slotPrice(venue, selectedDate, startMin, endMin);
    if (price === null) return;
    setError("");
    setSelectedSlots(previous => previous.some(s => s.courtId === courtId && s.startMin === startMin)
      ? previous.filter(s => !(s.courtId === courtId && s.startMin === startMin))
      : [...previous, { courtId, courtName, startMin, endMin, price }]);
  };

  const totalPrice = useMemo(() => {
    return selectedSlots.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSlots]);

  if (catalogLoading) return <p className="p-8">Đang tải thông tin sân...</p>;
  if (!venue) return <div className="p-8"><p role="alert">{error || "Cơ sở chưa mở đặt sân trực tuyến."}</p><Link href="/venues" className="text-court-600 underline">Quay lại danh sách sân</Link></div>;
  const invalidSelection = selectionError(selectedSlots);
  const handleCheckout = () => {
    const params = new URLSearchParams({ venueId: venue.id, date: selectedDate, slots: JSON.stringify(selectedSlots) });
    if (!parseSelection([venue], params, new Date(), false)) {
      setError(invalidSelection || "Lựa chọn đã hết hạn. Vui lòng chọn lại giờ chơi.");
      return;
    }
    router.push(`/checkout?${params}`);
  };

  return (
    <div className="min-h-screen bg-bg pb-48 lg:pb-32">
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
                Lịch trống — {venue.name}
              </h1>
              <p className="text-xs text-muted">
                Chọn các ô giờ liên tiếp trên cùng một sân. Chỗ trống được kiểm tra lại khi tạo đơn.
              </p>
            </div>
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
              onClick={() => { setSelectedDate(d.value); setSelectedSlots([]); setError(""); }}
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

        {/* Chú giải trạng thái ô lịch (§9.3) */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface p-3 text-xs">
          <span className="font-bold text-ink">Chú giải:</span>
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
            <div className="h-4 w-4 rounded bg-rose-100 border border-rose-300 dark:bg-rose-950" />
            <span className="text-muted">Đã đặt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded bg-slate-200 border border-slate-300 dark:bg-slate-800" />
            <span className="text-muted">Khoá</span>
          </div>
        </div>

        {/* Lưới lịch thi đấu Sân × Giờ */}
        <div className="mt-6 overflow-x-auto rounded-card border border-border bg-surface p-4 shadow-sm">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[120px] bg-court-700 p-2.5 text-left text-xs font-bold text-white">
                  Sân đấu
                </th>
                {timeSlots.map((ts) => (
                  <th
                    key={ts.startMin}
                    className="min-w-[68px] border-l border-white/20 bg-court-700 p-2.5 text-xs font-semibold text-white"
                  >
                    {ts.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {venue.courts.filter(court => court.isActive).map((court) => (
                <tr key={court.id}>
                  {/* Cột tên sân cố định bên trái */}
                  <td className="sticky left-0 z-10 bg-surface p-3 text-left font-bold text-xs text-ink shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {court.name}
                  </td>

                  {/* Các ô giờ 30 phút */}
                  {timeSlots.map((ts) => {
                    const key = `${court.id}-${ts.startMin}`;
                    const isBooked = busy.some(b => b.courtId === court.id && b.startMin < ts.endMin && b.endMin > ts.startMin);
                    const unavailable = !now || isPastSlot(selectedDate, ts.startMin, now) || slotPrice(venue, selectedDate, ts.startMin, ts.endMin) === null;
                    const isSelected = selectedSlots.some(
                      (s) => s.courtId === court.id && s.startMin === ts.startMin
                    );

                    return (
                      <td key={ts.startMin} className="p-1">
                        <button
                          type="button"
                          aria-label={`${court.name}, ${ts.label} – ${formatHour(ts.endMin)}`}
                          aria-pressed={isSelected}
                          disabled={isBooked || unavailable}
                          onClick={() =>
                            toggleSlot(
                              court.id,
                              court.name,
                              ts.startMin,
                              ts.endMin
                            )
                          }
                          className={`h-11 w-full rounded-slot border text-xs font-medium transition flex items-center justify-center ${
                            isBooked
                              ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-400 dark:border-rose-900/50 dark:bg-rose-950/40"
                              : isSelected
                              ? "border-court-600 bg-court-600 font-bold text-white shadow-sm"
                              : "border-border bg-white text-ink hover:border-court-400 hover:bg-court-50 dark:bg-surface"
                          }`}
                        >
                          {isSelected ? (
                            <Check size={14} strokeWidth={3} />
                          ) : isBooked ? (
                            "▨"
                          ) : (
                            ""
                          )}
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


      {/* Thanh tóm tắt cố định dưới đáy (§9.5) */}
      <div className="fixed inset-x-0 bottom-16 z-30 lg:bottom-0 border-t border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
        {(error || (selectedSlots.length > 0 && invalidSelection)) && <p role="alert" className="mx-auto max-w-content px-4 text-sm text-rose-600">{error || invalidSelection}</p>}
        <div className="mx-auto flex max-w-content flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted">
              Đã chọn:{" "}
              <strong className="text-ink">{selectedSlots.length} ô</strong>
            </span>
            {selectedSlots.length > 0 && (
              <span className="text-xs text-court-600 font-medium">
                ({selectedSlots[0]?.courtName} • {selectedSlots.length * 30} phút)
              </span>
            )}
            <div className="text-sm font-bold text-ink sm:ml-4">
              Tạm tính:{" "}
              <span className="text-base text-court-600">
                {formatVND(totalPrice)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!!invalidSelection}
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
