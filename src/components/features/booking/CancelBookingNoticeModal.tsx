"use client";

import { AlertCircle, Phone, X } from "lucide-react";

interface CancelBookingNoticeModalProps {
  isOpen: boolean;
  bookingCode: string;
  venueName: string;
  onClose: () => void;
}

export function CancelBookingNoticeModal({
  isOpen,
  bookingCode,
  venueName,
  onClose,
}: CancelBookingNoticeModalProps) {
  if (!isOpen) return null;

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
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Nội dung hộp thoại */}
      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
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
              Mã đơn: #{bookingCode}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 rounded-control border border-border bg-bg p-3.5 text-xs text-muted leading-relaxed">
          <p className="text-ink font-semibold">Quy định xử lý huỷ đơn cá nhân:</p>
          <p>
            • Đơn đặt sân <strong>chưa bị huỷ ngay</strong> trên hệ thống khi bạn yêu cầu.
          </p>
          <p>
            • Để huỷ lịch và đối soát hoàn tiền (nếu đủ điều kiện huỷ trước giờ quy định), quý khách vui lòng liên hệ trực tiếp ban quản lý cơ sở <strong>{venueName}</strong>.
          </p>
          <p>
            • Nhân viên sân sẽ kiểm tra thời hạn và tiến hành huỷ lịch cho quý khách.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-control bg-court-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-court-700 active:scale-95"
          >
            Đã hiểu và quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
