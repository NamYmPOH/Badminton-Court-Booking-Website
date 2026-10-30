"use client";

import { useState, useEffect, useRef } from "react";
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
  const [requiresApproval, setRequiresApproval] = useState<boolean | null>(null);

  const prevBookingCodeRef = useRef(bookingCode);
  const prevIsOpenRef = useRef(isOpen);
  const activeRequestIdRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state khi mở modal mới hoặc đổi bookingCode, nhưng giữ reason nếu chỉ background refresh
  useEffect(() => {
    const isNewBooking = bookingCode !== prevBookingCodeRef.current;
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;

    prevBookingCodeRef.current = bookingCode;
    prevIsOpenRef.current = isOpen;

    if (isNewlyOpened || isNewBooking) {
      setError("");
      setSuccessMessage("");
      setRequiresApproval(null);
      setBusy(false);
      activeRequestIdRef.current++; // Hủy bỏ bất kỳ request cũ nào đang chờ response

      if (isNewBooking) {
        setReason("");
      }
    }
  }, [isOpen, bookingCode]);

  // Tự động focus vào ô nhập lý do khi mở
  useEffect(() => {
    if (isOpen && !successMessage) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, successMessage]);

  // Hỗ trợ phím Escape để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, busy, onClose]);

  if (!isOpen) return null;

  async function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault();
    if (busy || reason.trim().length < 5) return;

    const currentRequestId = ++activeRequestIdRef.current;
    const targetCode = bookingCode;
    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${targetCode}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();

      // Ngăn response của request cũ cập nhật modal nếu đã chuyển sang đơn khác
      if (currentRequestId !== activeRequestIdRef.current) return;

      if (!res.ok) {
        throw new Error(data.message || "Không thể hủy đơn đặt sân.");
      }

      const needsApproval = Boolean(data.requiresApproval);
      setRequiresApproval(needsApproval);
      setSuccessMessage(
        needsApproval
          ? "Yêu cầu hủy đơn đã được gửi tới chủ cơ sở. Đang chờ phê duyệt và xử lý hoàn tiền."
          : "Đơn đặt sân đã được hủy thành công."
      );
      onCancelled?.();
    } catch (e) {
      if (currentRequestId !== activeRequestIdRef.current) return;
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra khi hủy đơn.");
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setBusy(false);
      }
    }
  }

  function handleCloseModal() {
    activeRequestIdRef.current++;
    onClose();
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
        onClick={!busy ? handleCloseModal : undefined}
        aria-hidden="true"
      />

      {/* Nội dung hộp thoại */}
      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          disabled={busy}
          onClick={handleCloseModal}
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
            <div
              className={`rounded-xl p-4 text-xs border flex items-start gap-2 ${
                requiresApproval
                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              <CheckCircle2
                size={18}
                className={`shrink-0 ${
                  requiresApproval ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
                }`}
              />
              <div>
                <p className="font-bold text-sm mb-1">
                  {requiresApproval ? "Đang chờ chủ sân phê duyệt" : "Hủy lịch thành công"}
                </p>
                <p>{successMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCloseModal}
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
              <label htmlFor="cancel-reason-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Lý do hủy đơn * (ít nhất 5 ký tự)
              </label>
              <textarea
                id="cancel-reason-input"
                ref={textareaRef}
                required
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="Ghi rõ lý do bạn muốn hủy đơn đặt sân này..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink focus:border-court-500 disabled:opacity-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleCloseModal}
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
