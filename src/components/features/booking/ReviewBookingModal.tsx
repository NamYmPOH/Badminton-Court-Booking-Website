"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Star } from "lucide-react";

export function ReviewBookingModal({ code, venueName, onClose, onSaved }: { code: string; venueName: string; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!rating) { setError("Hãy chọn từ 1 đến 5 sao."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(code)}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, comment }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không gửi được đánh giá.");
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi kết nối. Hãy thử lại."); }
    finally { setBusy(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-border bg-surface p-6 text-ink shadow-xl">
      <Dialog.Title className="text-xl font-bold">Đánh giá sân</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm text-muted">{venueName} · {code}. Chia sẻ trải nghiệm sau buổi chơi, mỗi đơn được đánh giá một lần.</Dialog.Description>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <fieldset disabled={busy}>
          <legend className="text-sm font-semibold">Bạn đánh giá bao nhiêu sao?</legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map(value => <label key={value} className="relative cursor-pointer rounded-control p-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-court-500">
              <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="sr-only" aria-label={`${value} sao`} required />
              <Star aria-hidden="true" size={28} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-muted/50"} />
            </label>)}
          </div>
          <p aria-live="polite" className="mt-1 text-sm text-muted">{rating ? `Đã chọn ${rating}/5 sao` : "Chưa chọn sao"}</p>
        </fieldset>
        <label className="block text-sm font-semibold">Nhận xét (tùy chọn)
          <textarea disabled={busy} className="mt-2 min-h-28 w-full rounded-control border border-border bg-bg p-3 font-normal text-ink outline-none focus:border-court-500" maxLength={2000} value={comment} onChange={e => setComment(e.target.value)} placeholder="Chia sẻ về sân, dịch vụ và buổi chơi của bạn…" />
        </label>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Dialog.Close disabled={busy} className="rounded-control border border-border px-4 py-2 text-sm">Đóng</Dialog.Close>
          <button type="submit" disabled={busy || !rating} className="rounded-control bg-court-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Đang gửi…" : "Gửi đánh giá"}</button>
        </div>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
