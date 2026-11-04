"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, CheckCircle2, ShieldAlert } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  bookingCode: string;
  venueName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransferModal({
  isOpen,
  bookingCode,
  venueName,
  onClose,
  onSuccess,
}: TransferModalProps) {
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReceiverName("");
      setReceiverPhone("");
      setNote("");
      setError("");
      setSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !receiverName.trim() || !receiverPhone.trim()) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverName: receiverName.trim(),
          receiverPhone: receiverPhone.trim(),
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Không thể chuyển nhượng đơn.");
      }

      setSuccess(data.message || "Chuyển nhượng lịch chơi thành công.");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chuyển nhượng thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />

      <div className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-surface p-6 shadow-2xl">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-court-50 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <UserCheck className="text-court-600" size={20} />
          <h3 id="transfer-modal-title" className="text-base font-bold text-ink">
            Chuyển nhượng lịch chơi #{bookingCode}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          Cơ sở: <strong>{venueName}</strong>
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
                <p className="mt-1.5 text-muted">
                  Người nhận có thể sử dụng họ tên và SĐT này khi đến làm thủ tục nhận sân tại quầy.
                </p>
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
          <form onSubmit={handleTransfer} className="mt-4 space-y-3.5 text-xs">
            <div className="rounded bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1 font-semibold">
                <ShieldAlert size={14} className="text-amber-600" />
                Lưu ý quan trọng:
              </div>
              <p>• Người nhận chuyển nhượng sẽ được quyền nhận sân khi đến cơ sở thi đấu.</p>
              <p>• Chuyển nhượng <strong>không thay đổi người nhận tiền hoàn</strong> nếu đơn phát sinh hoàn tiền sau này.</p>
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Họ và tên người nhận sân *</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ví dụ: Trần Văn An"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Số điện thoại người nhận *</label>
              <input
                type="tel"
                required
                pattern="^(0[35789]\d{8}|\+84[35789]\d{8})$"
                placeholder="Ví dụ: 0987654321"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">Ghi chú nhận sân (tùy chọn)</label>
              <textarea
                rows={2}
                maxLength={500}
                placeholder="Ghi chú thêm cho bên vận hành sân..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                disabled={busy || !receiverName.trim() || !receiverPhone.trim()}
                className="rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700 disabled:opacity-50"
              >
                {busy ? "Đang chuyển nhượng…" : "Xác nhận chuyển nhượng"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

