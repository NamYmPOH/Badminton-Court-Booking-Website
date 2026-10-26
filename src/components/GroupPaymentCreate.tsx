"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatVND } from "@/lib/utils";
import { Users, AlertTriangle, X, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface GroupPaymentCreateProps {
  code: string;
  total: number;
}

export function GroupPaymentCreate({ code, total }: GroupPaymentCreateProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(4);
  const [custom, setCustom] = useState(false);
  const [amounts, setAmounts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const safeCount = Math.min(30, Math.max(2, count || 2));

  // Tính số tiền chia đều mặc định cho từng phần
  const defaultParts = useMemo(() => {
    return Array.from(
      { length: safeCount },
      (_, i) => Math.floor(total / safeCount) + (i < total % safeCount ? 1 : 0)
    );
  }, [total, safeCount]);

  // Tính tổng số tiền hiện tại của tất cả các phần (trong trường hợp tùy chỉnh)
  const currentTotal = useMemo(() => {
    if (!custom) return total;
    return defaultParts.reduce((sum, def, i) => {
      const val = amounts[i] !== undefined && amounts[i] !== "" ? Number(amounts[i]) : def;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [custom, total, defaultParts, amounts]);

  const diff = total - currentTotal;
  const isMatch = Math.abs(diff) === 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (custom && !isMatch) {
      setError(
        `Tổng các phần (${formatVND(currentTotal)}) chưa khớp với tổng đơn (${formatVND(total)}). Vui lòng điều chỉnh lại.`
      );
      toast.warning("Tổng các phần chia chưa khớp với tổng đơn.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: code,
          count: safeCount,
          ...(custom
            ? { amounts: defaultParts.map((n, i) => Number(amounts[i] ?? n)) }
            : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không tạo được nhóm chia tiền.");

      toast.success("Đã tạo bảng chia tiền nhóm thành công!");
      router.push(`/groups/${data.inviteToken}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không tạo được nhóm.";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users size={16} className="text-court-600" />
              <span>Chia tiền theo nhóm bạn</span>
            </h3>
            <p className="text-xs text-muted">
              Chia đều hoặc chỉ định số tiền riêng cho từng người. Mỗi thành viên quét mã QR riêng của mình.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control border border-court-600 bg-court-50 px-4 py-2.5 text-xs font-bold text-court-700 shadow-sm transition hover:bg-court-100 active:scale-95 dark:bg-court-950/40 dark:text-court-300"
          >
            <span>Tạo phòng chia tiền</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-card border border-border bg-surface p-6 shadow-md animate-in fade-in zoom-in-98 duration-150"
    >
      <div className="flex items-start justify-between border-b border-border/70 pb-3">
        <div>
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Users size={18} className="text-court-600" />
            <span>Thiết lập chia tiền nhóm (S10)</span>
          </h2>
          <p className="mt-1 text-xs text-muted">
            Tổng giá trị đơn cần thanh toán: <strong className="text-court-600">{formatVND(total)}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="rounded-full p-1 text-muted transition hover:bg-court-50 hover:text-ink"
          title="Đóng bảng chia và giữ nguyên đơn gốc"
        >
          <X size={18} />
        </button>
      </div>

      {/* Cảnh báo quan trọng theo PRODUCT.md */}
      <div className="flex items-start gap-2.5 rounded-control border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="space-y-1">
          <p className="font-semibold">Lưu ý khi chốt bảng chia:</p>
          <p>
            • Việc chốt bảng chia sẽ thay thế mã QR tổng của đơn bằng các mã QR riêng cho từng thành viên.
          </p>
          <p>
            • Thời hạn giữ sân <strong>không được gia hạn thêm</strong>. Chỉ chốt khi chưa có ai chuyển tiền vào mã QR cũ.
          </p>
        </div>
      </div>

      {/* Chọn số lượng thành viên */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <label className="font-semibold text-ink flex items-center gap-2">
          <span>Số lượng người chơi (2 – 30 người):</span>
          <input
            type="number"
            min={2}
            max={30}
            required
            value={count}
            onChange={(e) => {
              setCount(Number(e.target.value));
              setAmounts([]);
            }}
            className="w-20 rounded-control border border-border bg-bg p-2 text-center font-bold text-ink outline-none focus:border-court-500"
          />
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-ink">
          <input
            type="checkbox"
            checked={custom}
            onChange={(e) => setCustom(e.target.checked)}
            className="rounded border-border text-court-600 focus:ring-court-500"
          />
          <span className="font-medium">Nhập số tiền riêng từng người</span>
        </label>
      </div>

      {/* Lưới danh sách các phần chia */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {defaultParts.map((defAmount, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-control border border-border bg-bg p-2.5 text-xs"
          >
            <span className="font-medium text-ink">
              {i === 0 ? "Bạn (Trưởng nhóm)" : `Thành viên ${i + 1}`}
            </span>
            {custom ? (
              <div className="flex items-center gap-1">
                <input
                  aria-label={`Số tiền người ${i + 1}`}
                  type="number"
                  min={1}
                  step={1000}
                  required
                  value={amounts[i] ?? defAmount}
                  onChange={(e) =>
                    setAmounts((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                  className="w-28 rounded-control border border-border bg-surface p-1.5 text-right font-bold text-ink outline-none focus:border-court-500"
                />
                <span className="text-[11px] text-muted">₫</span>
              </div>
            ) : (
              <strong className="text-court-600">{formatVND(defAmount)}</strong>
            )}
          </div>
        ))}
      </div>

      {/* Kiểm tra tổng tiền khi tùy chỉnh */}
      {custom && (
        <div
          className={`rounded-control border p-3 text-xs flex items-center justify-between ${
            isMatch
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isMatch ? <Check size={14} /> : <AlertTriangle size={14} />}
            <span>
              Tổng đã chia: <strong>{formatVND(currentTotal)}</strong> /{" "}
              {formatVND(total)}
            </span>
          </div>
          {!isMatch && (
            <span className="font-semibold">
              {diff > 0 ? `Còn thiếu ${formatVND(diff)}` : `Dư ${formatVND(Math.abs(diff))}`}
            </span>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {/* Nút hành động */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-border/70 pt-4">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
          className="rounded-control border border-border px-4 py-2.5 text-xs font-semibold text-muted transition hover:bg-court-50 hover:text-ink active:scale-95"
        >
          Quay lại đơn thanh toán chung
        </button>
        <button
          type="submit"
          disabled={busy || (custom && !isMatch)}
          className="rounded-control bg-court-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-court-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Đang chốt bảng chia..." : "Chốt bảng chia & Tạo phòng nhóm"}
        </button>
      </div>
    </form>
  );
}
