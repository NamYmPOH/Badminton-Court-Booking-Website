"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Venue } from "@/types/venue";
import { formatHour, parseSelection } from "@/lib/booking";
import { formatVND } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const venueId = params.get("venueId") || "";
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requestRef = useRef({ input: "", id: "" });
  const inFlight = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setVenue(null);
    fetch(`/api/booking-catalog?venueId=${encodeURIComponent(venueId)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; })
      .then(data => setVenue(data.venue))
      .catch(error => { if (!controller.signal.aborted) setError(error.message || "Không tải được thông tin sân."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [venueId]);
  const selection = venue ? parseSelection([venue], params, new Date(), false) : null;
  if (loading) return <p className="p-8">Đang tải thông tin đặt sân...</p>;
  if (!selection) return <div className="mx-auto max-w-xl p-8"><h1 className="text-xl font-bold">Chưa thể tạo đơn đặt sân</h1><p className="my-4">{error || "Lựa chọn đã hết hạn hoặc không hợp lệ. Vui lòng chọn lại giờ chơi."}</p><Link href="/venues" className="text-court-600 underline">Chọn sân</Link></div>;
  const { slots, date, total } = selection;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || !selection) return;
    if (authLoading) return;
    if (!user) { setError("Vui lòng đăng nhập trước khi đặt sân."); return; }
    inFlight.current = true; setSubmitting(true); setError("");
    try {
      const input = {
        venueId, date, slots: slots.map(({ courtId, startMin, endMin }) => ({ courtId, startMin, endMin })),
        customerName: name.trim(), customerPhone: phone.replace(/\s/g, ""), note: note.trim(),
      };
      const serialized = JSON.stringify(input);
      // Giữ cùng ID khi retry sau lỗi mạng; server trả lại đơn đã tạo.
      if (requestRef.current.input !== serialized) requestRef.current = { input: serialized, id: crypto.randomUUID() };
      const response = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, requestId: requestRef.current.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không tạo được đơn đặt sân.");
      router.push(`/payment/result?booking=${encodeURIComponent(data.booking.code)}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally { inFlight.current = false; setSubmitting(false); }
  }
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <Link href={`/venues/${venue!.slug}/book`} className="text-sm text-court-600">← Quay lại chọn sân</Link>
    <h1 className="my-6 text-2xl font-bold">Thông tin đặt sân</h1>
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={submit} className="space-y-4 rounded-card border border-border bg-surface p-6">
        <h2 className="font-bold">Thông tin người đặt</h2>
        <label className="block text-sm">Họ và tên<input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-control border border-border bg-bg text-ink p-3 outline-none focus:border-court-500" /></label>
        <label className="block text-sm">Số điện thoại<input required type="tel" maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full rounded-control border border-border bg-bg text-ink p-3 outline-none focus:border-court-500" /></label>
        <label className="block text-sm">Ghi chú<textarea maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className="mt-1 block w-full rounded-control border border-border bg-bg text-ink p-3 outline-none focus:border-court-500" /></label>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        {authLoading ? <p className="text-sm text-muted">Đang kiểm tra đăng nhập...</p> : !user && <p className="text-sm text-muted">Bạn cần <Link href="/login" className="text-court-600 underline">đăng nhập</Link> để tạo và quản lý đơn.</p>}
        <button disabled={submitting || authLoading || !user} className="w-full rounded-control bg-court-600 p-3 font-bold text-white disabled:opacity-50">{submitting ? "Đang tạo đơn..." : "Tạo đơn và chọn thanh toán"}</button>
      </form>
      <div className="space-y-4 rounded-card border border-border bg-surface p-6">
        <h2 className="font-bold">{venue!.name}</h2><p>{date} · {slots[0].courtName}</p>
        <p>{formatHour(slots[0].startMin)} – {formatHour(slots[slots.length - 1].endMin)}</p>
        <p>Thanh toán online qua QR hoặc chọn thanh toán bằng tiền mặt tại sân.</p>
        <p className="border-t border-border pt-4 text-xl font-bold text-court-600">{formatVND(total)}</p>
        <p className="text-sm text-muted">Đơn được giữ tối đa 10 phút. Mã QR hiển thị sau khi tạo đơn; nếu chọn tiền mặt, nhân viên hoặc chủ sân cần duyệt trước khi hết hạn giữ sân.</p>
      </div>
    </div>
  </div>;
}
export default function CheckoutPage() {
  return <Suspense fallback={<p className="p-8">Đang tải...</p>}><CheckoutContent /></Suspense>;
}
