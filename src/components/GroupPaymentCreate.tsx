"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatVND } from "@/lib/utils";

export function GroupPaymentCreate({
  code,
  total,
}: {
  code: string;
  total: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(4);
  const [custom, setCustom] = useState(false);
  const [amounts, setAmounts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const parts = Array.from(
    { length: Math.min(30, Math.max(2, count || 2)) },
    (_, i) => Math.floor(total / count) + (i < total % count ? 1 : 0),
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: code,
          count,
          ...(custom
            ? { amounts: parts.map((n, i) => Number(amounts[i] ?? n)) }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      router.push(`/groups/${data.inviteToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được nhóm.");
      setBusy(false);
    }
  }
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-control border border-court-600 px-4 py-3 font-semibold text-court-600"
      >
        Chia tiền với nhóm
      </button>
    );
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-card border border-border bg-surface p-5"
    >
      <h2 className="text-lg font-bold">Chia tiền với nhóm</h2>
      <p className="text-sm text-muted">
        Bao gồm cả bạn. Chốt bảng chia sẽ thay QR tổng đơn bằng mã riêng cho
        từng phần và không gia hạn giữ sân. Chỉ tiếp tục nếu chưa ai chuyển tiền
        vào mã cũ.
      </p>
      <label className="block">
        Số người
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
          className="ml-3 w-24 rounded-control border border-border bg-surface p-2 text-ink"
        />
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={custom}
          onChange={(e) => setCustom(e.target.checked)}
        />
        Nhập số tiền riêng từng người
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {parts.map((amount, i) => (
          <label
            key={i}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span>{i === 0 ? "Bạn (trưởng nhóm)" : `Thành viên ${i + 1}`}</span>
            {custom ? (
              <input
                aria-label={`Số tiền người ${i + 1}`}
                type="number"
                min={1}
                step={1}
                required
                value={amounts[i] ?? amount}
                onChange={(e) =>
                  setAmounts((v) => {
                    const next = [...v];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                className="w-32 rounded-control border border-border bg-surface p-2 text-ink"
              />
            ) : (
              <strong>{formatVND(amount)}</strong>
            )}
          </label>
        ))}
      </div>
      <p className="text-sm">
        Tổng đơn: <strong>{formatVND(total)}</strong>. Sau khi chốt, số tiền mỗi
        phần được cố định.
      </p>
      {error && (
        <p role="alert" className="text-rose-600">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="rounded-control bg-court-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Đang tạo nhóm..." : "Chốt bảng chia và tạo nhóm"}
      </button>
    </form>
  );
}
