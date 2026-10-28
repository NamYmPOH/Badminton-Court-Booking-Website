"use client";

import { useState } from "react";
import { AlertCircle, X, CheckCircle2 } from "lucide-react";

interface CancelBookingNoticeModalProps {
  isOpen: boolean;
  bookingCode: string;
  venueName: string;
  onClose: () => void;
  onCancelled?: () => void;
}

export function CancelBookingNoticeModal({
  isOpen,
  bookingCode,
  venueName,
  onClose,
  onCancelled,
}: CancelBookingNoticeModalProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  async function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault();
    if (busy || reason.trim().length < 5) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingCode}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Không thể hủy đơn đặt sân.");
      }

      setSuccessMessage(data.message || "Đã gửi yêu cầu hủy đơn thành công.");
      onCancelled?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra khi hủy đơn.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Nền mờ phía sau */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={!busy ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Nội dung hộp thoại */}
      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-court-50 hover:text-ink dark:hover:bg-surface/80"
          aria-label="Đóng hộp thoại"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle size={22} />
          </div>

          <div className="flex-1">
            <h3 id="cancel-notice-title" className="text-base font-bold text-ink">
              Yêu cầu huỷ lịch đặt sân
            </h3>
            <p className="mt-1 font-mono text-xs text-court-600 font-semibold">
              Mã đơn: #{bookingCode} · Cơ sở: {venueName}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {successMessage ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold text-sm mb-1">Thao tác thành công</p>
                <p>{successMessage}</p>
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
          <form onSubmit={handleConfirmCancel} className="mt-4 space-y-3">
            <div className="space-y-1 rounded-control border border-border bg-bg p-3 text-xs text-muted leading-relaxed">
              <p className="text-ink font-semibold">Chính sách hủy đơn:</p>
              <p>• <strong>Đơn chưa thanh toán:</strong> Đơn sẽ bị hủy ngay và giải phóng khung giờ cho khách khác.</p>
              <p>• <strong>Đơn đã thanh toán:</strong> Hệ thống sẽ gửi yêu cầu tới chủ cơ sở <strong>{venueName}</strong> để kiểm tra và phê duyệt hoàn tiền theo quy định.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Lý do hủy đơn * (ít nhất 5 ký tự)
              </label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="Ghi rõ lý do bạn muốn hủy đơn đặt sân này..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink focus:border-court-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-court-50"
              >
                Giữ lại đơn
              </button>
              <button
                type="submit"
                disabled={busy || reason.trim().length < 5}
                className="rounded-control bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Đang gửi…" : "Xác nhận hủy đơn"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
