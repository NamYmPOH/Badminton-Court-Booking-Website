"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle, X, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface CancellationPreviewData {
  bookingCode: string;
  venueName: string;
  firstSlotStartsAt: string | null;
  firstSlotDateStr: string;
  firstSlotTimeStr: string;
  hoursRemaining: number;
  isPastOrStarted: boolean;
  totalReceived: number;
  availableToRefund: number;
  refundRate: number;
  expectedRefundAmount: number;
  nonRefundableAmount: number;
  calculationSummary: string;
  isZeroRefund: boolean;
  warning: string | null;
  canCancel: boolean;
}

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
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<CancellationPreviewData | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [requiresApproval, setRequiresApproval] = useState<boolean | null>(null);

  const prevBookingCodeRef = useRef(bookingCode);
  const prevIsOpenRef = useRef(isOpen);
  const activeRequestIdRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tải thông tin preview chính sách hủy khi mở modal
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
      setPreview(null);
      activeRequestIdRef.current++;

      if (isNewBooking) {
        setReason("");
      }

      if (isOpen && bookingCode) {
        setLoadingPreview(true);
        fetch(`/api/bookings/${encodeURIComponent(bookingCode)}/cancellation-preview`, { cache: "no-store" })
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Không thể tải chính sách hủy.");
            setPreview(data);
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Không thể tải chính sách hủy.");
          })
          .finally(() => {
            setLoadingPreview(false);
          });
      }
    }
  }, [isOpen, bookingCode]);

  useEffect(() => {
    if (isOpen && !successMessage && !loadingPreview) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, successMessage, loadingPreview]);

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
      const res = await fetch(`/api/bookings/${encodeURIComponent(targetCode)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();

      if (currentRequestId !== activeRequestIdRef.current) return;

      if (!res.ok) {
        throw new Error(data.message || "Không thể hủy đơn đặt sân.");
      }

      const needsApproval = Boolean(data.requiresApproval);
      setRequiresApproval(needsApproval);
      setSuccessMessage(
        needsApproval
          ? "Đơn đã chuyển sang Đã hủy / Hết hạn. Yêu cầu hủy và hoàn tiền sẽ được xem xét và xử lý trong 24 giờ."
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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={!busy ? handleCloseModal : undefined}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-card border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
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
            <p className="mt-0.5 font-mono text-xs text-court-600 font-semibold">
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
              className={`rounded-xl p-4 text-xs border flex items-start gap-2.5 ${
                requiresApproval
                  ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              <CheckCircle2
                size={20}
                className={`shrink-0 ${
                  requiresApproval ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
                }`}
              />
              <div>
                <p className="font-bold text-sm mb-1">
                  {requiresApproval ? "Chờ duyệt hủy trong 24 giờ" : "Hủy lịch thành công"}
                </p>
                <p className="leading-relaxed">{successMessage}</p>
                {requiresApproval && (
                  <p className="mt-2 text-[11px] text-amber-900 dark:text-amber-200">
                    Sân đã được giải phóng để nhường chỗ cho khách khác. Khả năng thanh toán tiếp của đơn này đã đóng.
                  </p>
                )}
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
        ) : loadingPreview ? (
          <div className="my-8 flex flex-col items-center justify-center text-xs text-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
            <span className="mt-2.5">Đang tính toán chính sách hủy và hoàn tiền...</span>
          </div>
        ) : (
          <form onSubmit={handleConfirmCancel} className="mt-4 space-y-3.5">
            {/* Khối hiển thị chi tiết chính sách hoàn tiền */}
            {preview && (
              <div className="rounded-control border border-border bg-bg p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-muted flex items-center gap-1">
                    <Clock size={13} className="text-court-600" />
                    Giờ chơi đầu tiên:
                  </span>
                  <span className="font-semibold text-ink">
                    {preview.firstSlotTimeStr} ngày {preview.firstSlotDateStr}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-muted">Thời gian còn lại:</span>
                  <span className={`font-semibold ${preview.hoursRemaining >= 24 ? "text-emerald-600" : preview.hoursRemaining >= 6 ? "text-amber-600" : "text-rose-600"}`}>
                    {preview.hoursRemaining > 0 ? `Còn ${preview.hoursRemaining} giờ` : "Đã qua giờ chơi"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-muted">Tỷ lệ hoàn tiền:</span>
                  <span className="font-bold text-sm text-ink">
                    {preview.refundRate}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="rounded bg-surface p-2 border border-border/70">
                    <div className="text-muted">Tiền đã thu hợp lệ</div>
                    <div className="font-bold text-ink mt-0.5">{formatVND(preview.availableToRefund)}</div>
                  </div>
                  <div className="rounded bg-surface p-2 border border-border/70">
                    <div className="text-muted">Dự kiến hoàn lại</div>
                    <div className="font-bold text-emerald-600 mt-0.5">{formatVND(preview.expectedRefundAmount)}</div>
                  </div>
                </div>

                {preview.nonRefundableAmount > 0 && (
                  <div className="text-[11px] text-muted flex justify-between px-1">
                    <span>Phần không được hoàn:</span>
                    <span className="font-semibold text-rose-600">{formatVND(preview.nonRefundableAmount)}</span>
                  </div>
                )}

                {/* Cảnh báo rõ khi tỷ lệ hoàn là 0% */}
                {preview.isZeroRefund && (
                  <div className="rounded-lg bg-rose-50 p-2.5 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 flex items-start gap-2 text-[11px]">
                    <AlertTriangle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Mức hoàn dự kiến là 0%</p>
                      <p className="mt-0.5">
                        Do thời gian gửi yêu cầu dưới 6 giờ trước giờ chơi, theo quy định bạn sẽ không nhận được khoản hoàn tiền cho đơn này.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="cancel-reason-input" className="block text-xs font-semibold text-ink mb-1">
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
                {busy ? "Đang gửi yêu cầu…" : "Xác nhận hủy đơn"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
