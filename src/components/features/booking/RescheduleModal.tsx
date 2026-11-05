"use client";

import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface RescheduleModalProps {
  isOpen: boolean;
  bookingCode: string;
  venueName: string;
  currentDate: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RescheduleModal({
  isOpen,
  bookingCode,
  venueName,
  currentDate,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState("");
  const [startMin, setStartMin] = useState(1080); // 18:00
  const [durationMin, setDurationMin] = useState(60); // 60 phút
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setSuccess(null);
      setReason("");
      // Đặt mặc định là ngày mai
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNewDate(tomorrow.toISOString().slice(0, 10));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !newDate) return;

    setBusy(true);
    setError("");

    try {
      // 1. Lấy thông tin sân từ booking catalog để chọn sân 1
      const catRes = await fetch(`/api/booking-catalog?date=${newDate}&slug=san-cau-long-thanh-xuan-xanh`, { cache: "no-store" });
      const catData = await catRes.json();
      const courtId = catData?.venue?.courts?.[0]?.id || "court-1-1";

      const slots = [];
      for (let min = startMin; min < startMin + durationMin; min += 30) {
        slots.push({ courtId, startMin: min, endMin: min + 30 });
      }

      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          slots,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Không thể đổi lịch.");
      }

      setSuccess(data.message || "Đổi lịch thành công.");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi lịch thất bại.");
    } finally {
      setBusy(false);
    }
  }

  const formatHour = (min: number) =>
    `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!busy ? onClose : undefined}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ease-out">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-court-50 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <Calendar className="text-court-600" size={20} />
          <h3 id="reschedule-modal-title" className="text-base font-bold text-ink">
            Đổi lịch đặt sân #{bookingCode}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          Cơ sở: <strong>{venueName}</strong> · Lịch cũ: {currentDate}
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl p-4 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm mb-0.5">Thành công</p>
                <p>{success}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-control bg-court-600 px-5 py-2 text-xs font-semibold text-white hover:bg-court-700"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReschedule} className="mt-4 space-y-3.5 text-xs">
            <div className="rounded bg-bg p-3 border border-border text-[11px] text-muted space-y-1">
              <p className="font-semibold text-ink">Quy định đổi lịch:</p>
              <p>• Chỉ được đổi lịch khi còn <strong>ít nhất 6 giờ</strong> trước giờ chơi cũ.</p>
              <p>• Nếu giá lịch mới khác giá cũ, khoản chênh lệch sẽ được yêu cầu thanh toán thêm hoặc hoàn lại.</p>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Chọn ngày chơi mới *</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-ink mb-1">Giờ bắt đầu *</label>
                <select
                  value={startMin}
                  onChange={(e) => setStartMin(Number(e.target.value))}
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-ink"
                >
                  {Array.from({ length: 28 }, (_, i) => 360 + i * 30).map((min) => (
                    <option key={min} value={min}>
                      {formatHour(min)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-ink mb-1">Thời lượng *</label>
                <select
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  disabled={busy}
                  className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-ink"
                >
                  <option value={60}>60 phút (1 giờ)</option>
                  <option value={90}>90 phút (1.5 giờ)</option>
                  <option value={120}>120 phút (2 giờ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Lý do đổi lịch (tùy chọn)</label>
              <input
                type="text"
                placeholder="Ví dụ: Bận đột xuất, chuyển sang ngày mai..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-court-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={busy || !newDate}
                className="rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700 disabled:opacity-50"
              >
                {busy ? "Đang xử lý…" : "Xác nhận đổi lịch"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

