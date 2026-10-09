"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";

type Order = { id: string; code: string; customerName: string; customerPhone: string; total: number; status: string; paymentStatus: string; paymentMethod: string | null; expiresAt: string | null;
  venue: { name: string; paymentMode: string }; items: { date: string; startMin: number; endMin: number; court: { name: string } }[] };
export default function VenueOperationsPage() {
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{ id: string; action: string; title: string; amount: number } | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const allowed = !!user && ["ADMIN", "OWNER", "STAFF"].includes(user.role);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/venue-operations?q=${encodeURIComponent(filter)}`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (!signal?.aborted) { setOrders(data.bookings); setError(""); }
    } catch (error) { if (!signal?.aborted) setError(error instanceof Error ? error.message : "Không tải được danh sách đơn."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [filter]);
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setLoading(true); void refresh(controller.signal);
    const timer = setInterval(() => void refresh(controller.signal), 10000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [allowed, refresh]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!action || inFlight.current) return;
    inFlight.current = true; setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/venue-operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: action.id, action: action.action, reason }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setNotice("Đã cập nhật đơn và lưu nhật ký thao tác."); setAction(null); setReason(""); await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không cập nhật được đơn. Hãy kiểm tra lại trước khi thử tiếp."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  if (isLoading) return <p className="p-8">Đang kiểm tra quyền...</p>;
  if (!allowed) return <div className="p-8"><h1 className="text-xl font-bold">Quản lý tại sân</h1><p className="my-4">Chỉ chủ sân, nhân viên được phân quyền và quản trị viên được truy cập.</p><Link href="/login" className="underline">Đăng nhập</Link></div>;
  return <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
    <h1 className="text-2xl font-bold">Quản lý đơn tại sân</h1>
    <p className="text-muted">Duyệt yêu cầu tiền mặt trước khi hết hạn giữ sân. Chỉ ghi nhận đã thu tiền sau khi nhận đủ tiền từ khách.</p>
    <form onSubmit={e => { e.preventDefault(); setFilter(query.trim()); }} className="flex gap-3">
      <input aria-label="Tìm mã đơn" placeholder="Tìm mã đơn DATSAN..." value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 rounded-control border border-border bg-surface text-ink p-3" />
      <button className="rounded-control border border-border px-4">Tìm đơn</button>
      <button type="button" onClick={() => void refresh()} className="rounded-control border border-border px-4">Làm mới</button>
    </form>
    {error && <p role="alert" className="text-rose-600">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {action && <form onSubmit={submit} className="space-y-3 rounded-card border border-court-600 bg-surface p-5">
      <h2 className="font-bold">{action.title} · {formatVND(action.amount)}</h2>
      {action.action === "CASH_PAID" && <p>Xác nhận bạn đã nhận đủ số tiền trên bằng tiền mặt. Thao tác này sẽ ghi nhận đơn đã thanh toán.</p>}
      <label className="block">Ghi chú xác nhận<textarea autoFocus required minLength={5} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} className="mt-2 block w-full rounded-control border border-border bg-surface text-ink p-3" /></label>
      <div className="flex gap-3"><button disabled={busy} className="rounded-control bg-court-600 px-4 py-2 text-white disabled:opacity-50">{busy ? "Đang lưu..." : "Xác nhận"}</button><button type="button" disabled={busy} onClick={() => setAction(null)}>Đóng</button></div>
    </form>}
    {loading ? <p>Đang tải đơn...</p> : !orders.length ? <p>Chưa có đơn đang xử lý tại sân bạn quản lý.</p> : <div className="grid gap-4 md:grid-cols-2">{orders.map(order => {
      const cash = order.paymentMethod === "CASH" || (!order.paymentMethod && order.venue.paymentMode === "AT_VENUE");
      const paid = order.paymentStatus === "PAID";
      const pending = order.status === "PENDING_PAYMENT" && !!order.expiresAt && Date.parse(order.expiresAt) > Date.now();
      const button = (name: string, value: string) => <button key={value} disabled={busy || !!error} onClick={() => { setAction({ id: order.id, title: `${name} — ${order.code}`, action: value, amount: order.total }); setReason(""); setNotice(""); }} className="rounded-control border border-border px-3 py-2 disabled:opacity-50">{name}</button>;
      return <article key={order.id} className="space-y-3 rounded-card border border-border bg-surface p-5">
        <h2 className="font-bold">{order.code} · {order.venue.name}</h2><p>{order.customerName} · {order.customerPhone}</p>
        {order.items.map((item, index) => <p key={index} className="text-sm">{item.court.name} · {item.date.slice(0, 10)} · {formatHour(item.startMin)}–{formatHour(item.endMin)}</p>)}
        <p className="font-bold">{formatVND(order.total)}</p><p>{paid ? "Đã thanh toán" : pending && cash ? "Chờ duyệt tiền mặt" : cash ? "Tiền mặt — chưa thu tiền" : "Chuyển khoản — chưa thanh toán"}</p>
        <p className="text-sm text-muted">{pending ? `Hạn duyệt / thanh toán: ${new Date(order.expiresAt!).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : order.status === "CONFIRMED" ? "Đã xác nhận lịch sân" : order.status === "CHECKED_IN" ? "Đã nhận sân" : "Hết hạn giữ sân"}</p>
        <div className="flex flex-wrap gap-2">{pending && cash && button("Duyệt trả tiền tại sân", "CONFIRM")}{order.status === "CONFIRMED" && cash && !paid && button("Đã thu đủ tiền mặt", "CASH_PAID")}{order.status === "CONFIRMED" && paid && button("Nhận sân", "CHECK_IN")}{order.status === "CHECKED_IN" && paid && button("Hoàn tất", "COMPLETE")}{(pending || order.status === "CONFIRMED") && button("Hủy đơn", "CANCEL")}</div>
      </article>;
    })}</div>}
    <p className="text-sm text-muted">Hiển thị tối đa 100 đơn đang xử lý. Dùng mã đơn để tìm chính xác.</p>
  </main>;
}
