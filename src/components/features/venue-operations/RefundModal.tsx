"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    code: string;
    customerName: string;
    total: number;
    totalPaid: number;
    cancelRequestedAt?: string | null;
    cancelApprovedAt?: string | null;
    refundAmountApproved?: number | null;
  } | null;
  userRole: string;
  mode: "APPROVE" | "RECORD";
  onSuccess: () => void;
}

export default function RefundModal({
  isOpen,
  onClose,
  booking,
  userRole,
  mode,
  onSuccess,
}: RefundModalProps) {
  const [amount, setAmount] = useState<number>(() => {
    if (!booking) return 0;
    if (mode === "APPROVE") return booking.totalPaid || booking.total;
    return booking.refundAmountApproved || booking.totalPaid || booking.total;
  });
  const [reason, setReason] = useState(
    mode === "APPROVE"
      ? "Chủ sân phê duyệt hủy đơn và hoàn tiền cho khách"
      : "Nhân viên đã hoàn tiền mặt / chuyển khoản thủ công cho khách tại quầy"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!booking) return null;

  const maxAmount = mode === "APPROVE"
    ? (booking.totalPaid || booking.total)
    : (booking.refundAmountApproved || booking.totalPaid || booking.total);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !booking) return;

    if (amount <= 0 || amount > maxAmount) {
      setError(`Số tiền hoàn phải lớn hơn 0 và không vượt quá ${formatVND(maxAmount)}.`);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const action = mode === "APPROVE" ? "APPROVE_CANCEL" : "RECORD_REFUND";
      const payload = mode === "APPROVE"
        ? { action, id: booking.id, refundAmount: amount, reason }
        : { action, id: booking.id, amount, reason };

      const res = await fetch("/api/venue-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thao tác thất bại.");

      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between border-b pb-4 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <DollarSign size={20} className={mode === "APPROVE" ? "text-court-600" : "text-emerald-600"} />
                <span>{mode === "APPROVE" ? "Phê duyệt hủy đơn & hoàn tiền" : "Ghi nhận hoàn tiền thủ công"}</span>
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                Đơn: <strong className="text-zinc-900 dark:text-zinc-100">{booking.code}</strong> · Khách: {booking.customerName}
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={busy}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="my-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} /> Quy trình hoàn tiền 2 bước
            </div>
            {mode === "APPROVE" ? (
              <p>Chỉ OWNER hoặc ADMIN mới có quyền duyệt hủy đơn và quyết định số tiền hoàn lại. Nhân viên không được tự vượt quy trình.</p>
            ) : (
              <p>“Đã hoàn tiền” là ghi nhận thủ công sau khi nhân viên đã chuyển khoản hoặc trả tiền mặt cho khách. Hệ thống không tự động trừ tiền ngân hàng.</p>
            )}
          </div>

          {error && (
            <div className="my-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-3 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Số tiền {mode === "APPROVE" ? "duyệt hoàn" : "thực tế đã hoàn"} (VND) *
              </label>
              <input
                required
                type="number"
                min="1000"
                max={maxAmount}
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-bold text-court-600 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Tối đa: <span className="font-semibold">{formatVND(maxAmount)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Lý do / Biên bản đối soát * (tối thiểu 5 ký tự)
              </label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ghi rõ lý do hoàn, mã giao dịch đối soát..."
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 dark:border-zinc-800">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy || amount <= 0 || amount > maxAmount || reason.trim().length < 5}
                className={`rounded-lg px-5 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                  mode === "APPROVE" ? "bg-court-600 hover:bg-court-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {busy ? "Đang lưu…" : mode === "APPROVE" ? "Phê duyệt hoàn tiền" : "Xác nhận đã hoàn tiền"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
