"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Calendar as CalendarIcon, Clock } from "lucide-react";
import { MOCK_VENUES } from "@/services/venue.service";
import { formatVND } from "@/lib/utils";

interface BookPageProps {
  params: {
    slug: string;
  };
}

interface SelectedSlot {
  courtId: string;
  courtName: string;
  startMin: number;
  endMin: number;
  price: number;
}

export default function CourtBookingGridPage({ params }: BookPageProps) {
  const router = useRouter();
  const venue = MOCK_VENUES.find((v) => v.slug === params.slug) || MOCK_VENUES[0];

  // Ngày được chọn (mặc định hôm nay)
  const [selectedDate, setSelectedDate] = useState("2026-10-05");
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  // Sinh các dải ngày 7 ngày tới
  const dates = [
    { label: "Hôm nay", value: "2026-10-05", sub: "05/10" },
    { label: "Ngày mai", value: "2026-10-06", sub: "06/10" },
    { label: "Thứ 4", value: "2026-10-07", sub: "07/10" },
    { label: "Thứ 5", value: "2026-10-08", sub: "08/10" },
    { label: "Thứ 6", value: "2026-10-09", sub: "09/10" },
    { label: "Thứ 7", value: "2026-10-10", sub: "10/10" },
    { label: "Chủ nhật", value: "2026-10-11", sub: "11/10" },
  ];

  // Danh sách các khung giờ 30 phút từ 17:00 đến 22:00
  const timeSlots = [
    { startMin: 1020, endMin: 1050, label: "17:00" },
    { startMin: 1050, endMin: 1080, label: "17:30" },
    { startMin: 1080, endMin: 1110, label: "18:00" },
    { startMin: 1110, endMin: 1140, label: "18:30" },
    { startMin: 1140, endMin: 1170, label: "19:00" },
    { startMin: 1170, endMin: 1200, label: "19:30" },
    { startMin: 1200, endMin: 1230, label: "20:00" },
    { startMin: 1230, endMin: 1260, label: "20:30" },
    { startMin: 1260, endMin: 1290, label: "21:00" },
    { startMin: 1290, endMin: 1320, label: "21:30" },
  ];

  // Một số ô giả lập đã có người đặt trước
  const bookedKeySet = useMemo(() => {
    return new Set([
      "court-1-1-1080",
      "court-1-1-1110",
      "court-1-2-1140",
      "court-1-3-1200",
    ]);
  }, []);

  const toggleSlot = (courtId: string, courtName: string, startMin: number, endMin: number) => {
    const key = `${courtId}-${startMin}`;
    if (bookedKeySet.has(key)) return;

    const exists = selectedSlots.some(
      (s) => s.courtId === courtId && s.startMin === startMin
    );

    if (exists) {
      setSelectedSlots(
        selectedSlots.filter(
          (s) => !(s.courtId === courtId && s.startMin === startMin)
        )
      );
    } else {
      // Giá tạm tính 55.000 ₫ / 30 phút giờ cao điểm
      const slotPrice = Math.round((venue.priceFrom * 1.5) / 2);
      setSelectedSlots([
        ...selectedSlots,
        { courtId, courtName, startMin, endMin, price: slotPrice },
      ]);
    }
  };

  const totalPrice = useMemo(() => {
    return selectedSlots.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSlots]);

  const handleCheckout = () => {
    if (selectedSlots.length === 0) return;
    // Chuyển hướng tới trang thanh toán
    router.push(
      `/checkout?venueId=${venue.id}&venueName=${encodeURIComponent(
        venue.name
      )}&date=${selectedDate}&slots=${encodeURIComponent(
        JSON.stringify(selectedSlots)
      )}&total=${totalPrice}`
    );
  };

  return (
    <div className="min-h-screen bg-bg pb-32">
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
                Chọn các ô giờ liên tiếp bạn muốn thi đấu
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
              onClick={() => setSelectedDate(d.value)}
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
              {venue.courts.slice(0, 4).map((court) => (
                <tr key={court.id}>
                  {/* Cột tên sân cố định bên trái */}
                  <td className="sticky left-0 z-10 bg-surface p-3 text-left font-bold text-xs text-ink shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    {court.name}
                  </td>

                  {/* Các ô giờ 30 phút */}
                  {timeSlots.map((ts) => {
                    const key = `${court.id}-${ts.startMin}`;
                    const isBooked = bookedKeySet.has(key);
                    const isSelected = selectedSlots.some(
                      (s) => s.courtId === court.id && s.startMin === ts.startMin
                    );

                    return (
                      <td key={ts.startMin} className="p-1">
                        <button
                          type="button"
                          disabled={isBooked}
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
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
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
            disabled={selectedSlots.length === 0}
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
