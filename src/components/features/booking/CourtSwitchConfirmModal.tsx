"use client";

import { AlertTriangle, X } from "lucide-react";

interface CourtSwitchConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CourtSwitchConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Đồng ý đổi",
  cancelLabel = "Giữ lựa chọn hiện tại",
  onConfirm,
  onCancel,
}: CourtSwitchConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Nền mờ phía sau */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Nội dung hộp thoại */}
      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-xl animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-court-50 hover:text-ink dark:hover:bg-surface/80"
          aria-label="Đóng hộp thoại"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle size={22} />
          </div>

          <div className="flex-1">
            <h3 id="modal-title" className="text-base font-bold text-ink">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-control border border-border px-4 py-2.5 text-xs font-semibold text-muted transition hover:bg-court-50 hover:text-ink active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-control bg-court-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-court-700 active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
