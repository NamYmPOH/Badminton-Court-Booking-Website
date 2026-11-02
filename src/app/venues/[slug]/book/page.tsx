"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Calendar,
  Layers,
  RotateCcw,
  Info,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Venue } from "@/types/venue";
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
import { CourtSwitchConfirmModal } from "@/components/features/booking/CourtSwitchConfirmModal";

interface BookPageProps {
  params: {
    slug: string;
  };
}

type PendingSwitch =
  | {
      type: "court";
      courtId: string;
      courtName: string;
      startMin: number;
      endMin: number;
      price: number;
    }
  | {
      type: "date";
      targetDate: string;
      targetLabel: string;
    }
  | null;

export default function CourtBookingGridPage({ params }: BookPageProps) {
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => bookingDates()[0].value);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<{ courtId: string; startMin: number; endMin: number }[]>([]);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Tải danh mục sân và trạng thái khung giờ đã đặt từ API
  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    setCatalogLoading(true);
    fetch(
      `/api/booking-catalog?slug=${encodeURIComponent(params.slug)}&date=${selectedDate}`,
      { signal: controller.signal, cache: "no-store" }
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
      })
      .then((data) => {
        setVenue(data.venue);
        setBusy(data.busy || []);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setVenue(null);
          setError(err.message || "Không tải được lịch sân.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [params.slug, selectedDate]);

  // Cập nhật mốc thời gian thực hiện tại mỗi 30 giây để khóa giờ đã qua
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const dates = useMemo(() => bookingDates(now), [now]);

  // Tạo danh sách các ô giờ 30 phút theo giờ mở/đóng cửa của cơ sở
  const timeSlots = useMemo(() => {
    if (!venue) return [];
    return Array.from(
      { length: Math.floor((venue.closeMin - venue.openMin) / 30) },
      (_, i) => {
        const startMin = venue.openMin + i * 30;
        return { startMin, endMin: startMin + 30, label: formatHour(startMin) };
      }
    );
  }, [venue]);

  // Tự động cuộn lưới lịch đến khung giờ hiện tại khi người chơi xem ngày "Hôm nay"
  useEffect(() => {
    if (!gridContainerRef.current || !venue || !timeSlots.length) return;
    const isToday = selectedDate === dates[0]?.value;
    if (isToday) {
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const firstAvailableIndex = timeSlots.findIndex((ts) => ts.endMin > currentMin);
      if (firstAvailableIndex > 0) {
        const targetScroll = Math.max(0, (firstAvailableIndex - 1) * 72);
        gridContainerRef.current.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    } else {
      gridContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [selectedDate, venue, timeSlots, dates, now]);

  // Sắp xếp các ô đã chọn theo thứ tự thời gian tăng dần
  const sortedSlots = useMemo(
    () => [...selectedSlots].sort((a, b) => a.startMin - b.startMin),
    [selectedSlots]
  );

  // Tóm tắt thông tin thời gian đã chọn (khoảng giờ, tổng phút, tên sân)
  const selectionSummary = useMemo(() => {
    if (!sortedSlots.length) return null;
    return {
      courtName: sortedSlots[0].courtName,
      courtId: sortedSlots[0].courtId,
      startHour: formatHour(sortedSlots[0].startMin),
      endHour: formatHour(sortedSlots[sortedSlots.length - 1].endMin),
      totalMinutes: sortedSlots.length * 30,
    };
  }, [sortedSlots]);

  // Xử lý chọn/hủy ô 30 phút
  const toggleSlot = (
    courtId: string,
    courtName: string,
    startMin: number,
    endMin: number
  ): void => {
    if (!venue) return;

    if (isPastSlot(selectedDate, startMin, now)) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const nextAvailableSlotMin = Math.ceil(currentMinutes / 30) * 30;
      toast.warning(
        `Khung giờ ${formatHour(startMin)} đã qua thời gian đặt. Vui lòng chọn từ ${formatHour(nextAvailableSlotMin)} trở đi.`
      );
      return;
    }

    if (
      busy.some(
        (b) => b.courtId === courtId && b.startMin < endMin && b.endMin > startMin
      )
    ) {
      toast.error(`Khung giờ ${formatHour(startMin)} trên sân này đã có người đặt trước.`);
      return;
    }

    const price = slotPrice(venue, selectedDate, startMin, endMin);
    if (price === null) {
      toast.error("Không tìm thấy giá áp dụng cho khung giờ này.");
      return;
    }

    // Nếu người chơi đã chọn ô trên một sân khác, hỏi xác nhận đổi sân thay vì cộng dồn gây lỗi
    if (selectedSlots.length > 0 && selectedSlots[0].courtId !== courtId) {
      setPendingSwitch({
        type: "court",
        courtId,
        courtName,
        startMin,
        endMin,
        price,
      });
      return;
    }

    setError("");
    const alreadySelected = selectedSlots.some(
      (s) => s.courtId === courtId && s.startMin === startMin
    );

    if (alreadySelected) {
      setSelectedSlots((prev) =>
        prev.filter((s) => !(s.courtId === courtId && s.startMin === startMin))
      );
    } else {
      setSelectedSlots((prev) => [
        ...prev,
        { courtId, courtName, startMin, endMin, price },
      ]);
    }
  };

  // Xác nhận chuyển đổi sân hoặc chuyển ngày
  const handleConfirmSwitch = (): void => {
    if (!pendingSwitch) return;

    if (pendingSwitch.type === "court") {
      setSelectedSlots([
        {
          courtId: pendingSwitch.courtId,
          courtName: pendingSwitch.courtName,
          startMin: pendingSwitch.startMin,
          endMin: pendingSwitch.endMin,
          price: pendingSwitch.price,
        },
      ]);
      setError("");
      toast.info(`Đã chuyển lựa chọn sang ${pendingSwitch.courtName}.`);
    } else if (pendingSwitch.type === "date") {
      setSelectedDate(pendingSwitch.targetDate);
      setSelectedSlots([]);
      setError("");
      toast.info(`Đã chuyển sang ngày ${pendingSwitch.targetLabel}.`);
    }

    setPendingSwitch(null);
  };

  // Nhấn chọn ngày trong dải 7 ngày
  const handleDateSelect = (dateValue: string, dateLabel: string): void => {
    if (dateValue === selectedDate) return;

    if (selectedSlots.length > 0) {
      setPendingSwitch({
        type: "date",
        targetDate: dateValue,
        targetLabel: dateLabel,
      });
    } else {
      setSelectedDate(dateValue);
      setError("");
    }
  };

  const totalPrice = useMemo(() => {
    return selectedSlots.reduce((sum, s) => sum + s.price, 0);
  }, [selectedSlots]);

  const invalidSelection = selectionError(selectedSlots);

  // Lý do hiển thị bằng chữ trên nút tiếp tục khi lựa chọn chưa hợp lệ
  const continueButtonReason = useMemo((): string => {
    if (selectedSlots.length === 0) return "Vui lòng chọn giờ chơi";
    if (invalidSelection) return invalidSelection;
    if (selectionSummary) {
      return `Tiếp tục (${selectionSummary.startHour} – ${selectionSummary.endHour})`;
    }
    return "Tiếp tục thanh toán";
  }, [selectedSlots.length, invalidSelection, selectionSummary]);

  const handleCheckout = (): void => {
    if (!venue) return;
    const params = new URLSearchParams({
      venueId: venue.id,
      date: selectedDate,
      slots: JSON.stringify(selectedSlots),
    });

    if (!parseSelection([venue], params, new Date(), false)) {
      setError(invalidSelection || "Lựa chọn đã hết hạn. Vui lòng chọn lại giờ chơi.");
      return;
    }
    router.push(`/checkout?${params}`);
  };

  if (catalogLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Đang tải bảng lịch thi đấu...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="mx-auto max-w-content p-8 text-center">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h2 className="mt-4 text-lg font-bold text-ink">Không thể tải lịch sân</h2>
        <p className="mt-1 text-sm text-muted">
          {error || "Cơ sở này hiện chưa mở hệ thống đặt lịch trực tuyến."}
        </p>
        <Link
          href="/venues"
          className="mt-5 inline-flex items-center rounded-control bg-court-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-court-700"
        >
          Quay lại danh sách sân
        </Link>
      </div>
    );
  }

  const isToday = selectedDate === dates[0]?.value;
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const isTodayExpired = isToday && venue ? currentMin >= venue.closeMin : false;

  return (
    <div className="min-h-screen bg-bg pb-[calc(10rem+env(safe-area-inset-bottom,0px))] lg:pb-32">
      {/* Modal xác nhận chuyển đổi sân / đổi ngày */}
      <CourtSwitchConfirmModal
        isOpen={pendingSwitch !== null}
        title={
          pendingSwitch?.type === "court"
            ? "Đổi sang sân khác?"
            : "Đổi ngày đặt sân?"
        }
        message={
          pendingSwitch?.type === "court"
            ? `Bạn đang chọn các ô trên ${selectedSlots[0]?.courtName}. Mỗi đơn chỉ được chọn 1 sân duy nhất. Nếu chuyển sang ${pendingSwitch.courtName}, các ô đã chọn trên sân cũ sẽ được làm mới.`
            : `Bạn đang chọn ${selectedSlots.length} ô giờ cho ngày hiện tại. Đổi sang ngày khác sẽ làm mới danh sách ô giờ đang chọn.`
        }
        confirmLabel={
          pendingSwitch?.type === "court"
            ? `Đổi sang ${pendingSwitch.courtName}`
            : "Xác nhận đổi ngày"
        }
        cancelLabel="Giữ lựa chọn hiện tại"
        onConfirm={handleConfirmSwitch}
        onCancel={() => setPendingSwitch(null)}
      />

      {/* Header thanh điều hướng phía trên */}
      <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-content items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/venues/${venue.slug}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition hover:bg-court-50 hover:text-ink active:scale-95"
              aria-label="Quay lại trang chi tiết cơ sở"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-ink sm:text-xl">
                Chọn sân & giờ chơi — {venue.name}
              </h1>
              <p className="text-xs text-muted">
                {venue.address}, {venue.district}
              </p>
            </div>
          </div>

          <Link
            href={`/venues/${venue.slug}`}
            className="hidden text-xs font-semibold text-court-600 hover:underline sm:inline-flex"
          >
            Xem thông tin cơ sở →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-content px-4 py-6 sm:px-6">
        {/* Dải chọn ngày 7 ngày tới */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Chọn ngày chơi
            </span>
            <span className="text-[11px] text-muted">Dải đặt trước 7 ngày</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => handleDateSelect(d.value, `${d.label} (${d.sub})`)}
                className={`flex min-w-[100px] flex-col items-center rounded-card border px-3 py-2 text-xs transition-all active:scale-95 ${
                  selectedDate === d.value
                    ? "border-court-600 bg-court-600 font-bold text-white shadow-sm"
                    : "border-border bg-surface text-muted hover:border-court-300 hover:text-ink"
                }`}
              >
                <span className="font-semibold">{d.label}</span>
                <span className="mt-0.5 text-[11px] opacity-90">{d.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hướng dẫn quy tắc chọn ô trực quan cạnh lịch theo PRODUCT.md F2 */}
        <div className="mt-4 flex flex-col gap-2 rounded-card border border-court-200 bg-court-50/60 p-3.5 text-xs text-court-900 dark:border-court-900/40 dark:bg-court-950/40 dark:text-court-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} className="shrink-0 text-court-600 dark:text-court-400" />
            <span>
              <strong>Quy tắc đặt:</strong> Chọn 1 hoặc nhiều ô 30 phút <strong>nối tiếp nhau</strong> trên cùng một sân. Đơn giữ chỗ có hiệu lực tối đa 5 phút sau khi tạo đơn.
            </span>
          </div>

          {selectedSlots.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedSlots([]);
                setError("");
              }}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline"
            >
              <RotateCcw size={12} />
              <span>Xóa các ô đã chọn</span>
            </button>
          )}
        </div>

        {/* Chú giải trạng thái ô lịch */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-card border border-border bg-surface p-3 text-xs">
          <span className="font-bold text-ink">Chú giải ô:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-border bg-white dark:bg-surface" />
            <span>Còn trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded bg-court-600 text-[10px] font-black text-white">
              ✓
            </div>
            <span className="font-semibold text-court-600 dark:text-court-400">Đang chọn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-rose-300 bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/60" />
            <span className="text-muted">Đã có người đặt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-slate-300 bg-slate-200 dark:border-slate-800 dark:bg-slate-800" />
            <span className="text-muted">Đã qua giờ / Không mở</span>
          </div>
        </div>

        {/* Cảnh báo nếu toàn bộ khung giờ hôm nay đã qua */}
        {isTodayExpired && (
          <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 sm:flex-row sm:items-center">
            <div>
              <p className="font-bold">Các khung giờ hôm nay đã kết thúc lúc {formatHour(venue.closeMin)}</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                Không còn giờ trống cho hôm nay. Bạn có thể chuyển sang Ngày mai để đặt sân trước.
              </p>
            </div>
            {dates[1] && (
              <button
                type="button"
                onClick={() => handleDateSelect(dates[1].value, `${dates[1].label} (${dates[1].sub})`)}
                className="shrink-0 rounded-control bg-court-600 px-4 py-2 font-bold text-white transition hover:bg-court-700"
              >
                Chuyển sang Ngày mai ({dates[1].sub}) →
              </button>
            )}
          </div>
        )}

        {/* Cảnh báo lỗi lựa chọn inline nếu người chơi chọn ô rời rạc */}
        {selectedSlots.length > 1 && invalidSelection && (
          <div className="mt-4 flex items-center gap-2 rounded-control border border-rose-300 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{invalidSelection}. Vui lòng nhấp vào các ô liền kề hoặc bỏ bớt ô ở xa.</span>
          </div>
        )}

        {/* Chỉ báo cuộn ngang trên điện thoại */}
        <div className="mt-5 flex items-center justify-between text-[11px] text-muted lg:hidden">
          <span>Vuốt ngang để xem các khung giờ tiếp theo</span>
          <span>→</span>
        </div>

        {/* Lưới lịch thi đấu Sân × Giờ */}
        <div
          ref={gridContainerRef}
          className="mt-2 overflow-x-auto rounded-card border border-border bg-surface p-4 shadow-sm scroll-smooth"
        >
          <table className="w-full border-collapse text-center">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 min-w-[130px] border-r border-court-600/50 bg-court-700 p-2.5 text-left text-xs font-bold text-white shadow-[2px_0_6px_-1px_rgba(0,0,0,0.15)]">
                  Sân đấu
                </th>
                {timeSlots.map((ts) => {
                  const isCurrentSlot =
                    isToday && currentMin >= ts.startMin && currentMin < ts.endMin;
                  return (
                    <th
                      key={ts.startMin}
                      className={`min-w-[70px] border-l border-white/20 p-2.5 text-xs font-semibold text-white relative transition-colors ${
                        isCurrentSlot ? "bg-court-800 font-bold" : "bg-court-700"
                      }`}
                    >
                      <div>{ts.label}</div>
                      {isCurrentSlot && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-amber-400 px-1 py-0.2 text-[8px] font-black uppercase text-court-950 shadow-sm">
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
                    {/* Cột tên sân cố định bên trái với nền tương phản */}
                    <td className="sticky left-0 z-10 border-r border-border bg-surface p-3 text-left text-xs font-bold text-ink shadow-[2px_0_6px_-1px_rgba(0,0,0,0.06)] dark:bg-surface">
                      <div className="line-clamp-1">{court.name}</div>
                      <div className="text-[10px] font-normal text-muted line-clamp-1">
                        {court.surface || "Tiêu chuẩn"}
                      </div>
                    </td>

                    {/* Các ô giờ 30 phút */}
                    {timeSlots.map((ts) => {
                      const isBooked = busy.some(
                        (b) =>
                          b.courtId === court.id &&
                          b.startMin < ts.endMin &&
                          b.endMin > ts.startMin
                      );
                      const isPast = isPastSlot(selectedDate, ts.startMin, now);
                      const price = slotPrice(
                        venue,
                        selectedDate,
                        ts.startMin,
                        ts.endMin
                      );
                      const isUnavailable = isPast || price === null;
                      const isSelected = selectedSlots.some(
                        (s) =>
                          s.courtId === court.id && s.startMin === ts.startMin
                      );

                      return (
                        <td key={ts.startMin} className="p-1">
                          <button
                            type="button"
                            aria-label={`${court.name}, ${ts.label} – ${formatHour(ts.endMin)}`}
                            aria-pressed={isSelected}
                            onClick={() =>
                              toggleSlot(
                                court.id,
                                court.name,
                                ts.startMin,
                                ts.endMin
                              )
                            }
                            title={
                              isBooked
                                ? `${court.name}: ${ts.label} - Đã có người đặt`
                                : isPast
                                ? `${court.name}: ${ts.label} - Giờ chơi đã qua`
                                : price === null
                                ? "Không khả dụng"
                                : isSelected
                                ? `${court.name}: ${ts.label} - Đang chọn (${formatVND(price)})`
                                : `${court.name}: ${ts.label} - Trống (${formatVND(price)}/30ph)`
                            }
                            className={`h-11 w-full rounded-slot border text-xs font-medium transition flex items-center justify-center active:scale-95 ${
                              isBooked
                                ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-400 dark:border-rose-900/50 dark:bg-rose-950/40"
                                : isUnavailable
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-500"
                                : isSelected
                                ? "border-court-600 bg-court-600 font-bold text-white shadow-sm ring-2 ring-court-600/30"
                                : "border-border bg-white text-ink hover:border-court-400 hover:bg-court-50 dark:bg-surface"
                            }`}
                          >
                            {isSelected ? (
                              <Check size={14} strokeWidth={3} />
                            ) : isBooked ? (
                              <span className="text-[11px] select-none text-rose-400">▨</span>
                            ) : isUnavailable ? (
                              <span className="text-[11px] select-none text-slate-400 font-light">—</span>
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

      {/* Thanh tóm tắt và hành động cố định dưới đáy */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] shadow-2xl backdrop-blur">
        <div className="mx-auto flex max-w-content flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Thông tin tóm tắt lựa chọn */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {selectionSummary ? (
                <>
                  <span className="rounded bg-court-100 px-2 py-0.5 font-bold text-court-800 dark:bg-court-950 dark:text-court-300">
                    {selectionSummary.courtName}
                  </span>
                  <span className="font-semibold text-ink">
                    {selectionSummary.startHour} – {selectionSummary.endHour}
                  </span>
                  <span className="text-muted">
                    ({selectionSummary.totalMinutes} phút • {selectedSlots.length} ô)
                  </span>
                </>
              ) : (
                <span className="text-muted">Chưa có ô giờ nào được chọn</span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted">Tạm tính:</span>
              <span className="text-xl font-black text-court-600 dark:text-court-400">
                {formatVND(totalPrice)}
              </span>
              {selectedSlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlots([]);
                    setError("");
                  }}
                  className="ml-2 text-xs text-muted underline hover:text-rose-600"
                >
                  Xóa chọn
                </button>
              )}
            </div>
          </div>

          {/* Nút Tiếp tục thanh toán với trạng thái rõ ràng */}
          <div className="flex flex-col items-stretch sm:items-end">
            <button
              type="button"
              disabled={!!invalidSelection || selectedSlots.length === 0}
              onClick={handleCheckout}
              className="inline-flex items-center justify-center gap-2 rounded-control bg-racket-500 px-7 py-3 text-sm font-bold text-court-950 shadow-sm transition-all hover:bg-racket-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{continueButtonReason}</span>
              {!invalidSelection && selectedSlots.length > 0 && (
                <ChevronRight size={16} />
              )}
            </button>

            {invalidSelection && selectedSlots.length > 0 && (
              <span className="mt-1 text-[11px] font-medium text-rose-600">
                {invalidSelection}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
