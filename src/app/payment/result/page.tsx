"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import type { Booking } from "@/types/booking";

type PaymentBooking = Booking & { qrUrl: string | null; bank: { name: string; accountNo: string; accountName: string } | null };
function PaymentResultContent() {
  const params = useSearchParams();
  const code = params.get("booking");
  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const clock = setInterval(() => setNow(Date.now()), 1000);
    setBooking(null); setLoading(true); setError("");
    async function poll() {
      if (!code) { setError("Thiếu mã đơn đặt sân."); setLoading(false); return; }
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(code)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không đọc được trạng thái thanh toán.");
        if (controller.signal.aborted) return;
        setBooking(data.booking); setError("");
        // Chỉ server xác nhận PAID. Không dùng URL hay sessionStorage để báo thành công.
        if (data.booking.status === "PENDING_PAYMENT") timer = setTimeout(poll, 3000);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Mất kết nối. Hãy kiểm tra lại trạng thái đơn.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); clearInterval(clock); };
  }, [code, retry]);
  const remaining = booking?.expiresAt ? Math.max(0, Math.ceil((Date.parse(booking.expiresAt) - now) / 1000)) : 0;
  const paid = booking?.paymentStatus === "PAID";
  const pending = booking?.status === "PENDING_PAYMENT" && remaining > 0;
  return <div className="mx-auto max-w-xl px-4 py-10"><div className="space-y-5 rounded-card border border-border bg-surface p-6">
    <h1 className="text-2xl font-bold">{paid ? "Thanh toán thành công" : booking?.status === "CONFIRMED" ? "Đã xác nhận đặt sân" : pending ? "Quét QR để thanh toán" : loading ? "Đang kiểm tra đơn..." : "Trạng thái đặt sân"}</h1>
    {error && <div role="alert" className="space-y-3 text-rose-600"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="underline">Kiểm tra lại</button><p className="text-sm">Nếu đã chuyển tiền, hãy kiểm tra trạng thái trước khi chuyển thêm.</p></div>}
    {booking && <>
      <p>Mã đơn: <strong className="font-mono">{booking.code}</strong></p><p>{booking.venueName}</p>
      <p className="text-xl font-bold text-court-600">{formatVND(booking.total)}</p>
      {paid && <p role="status">Đã nhận thanh toán và xác nhận lịch sân của bạn.</p>}
      {booking.status === "CONFIRMED" && !paid && <p>Thanh toán tại sân khi đến chơi.</p>}
      {pending && booking.qrUrl && !error && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={booking.qrUrl} alt={`QR chuyển khoản cho ${booking.code}`} width={360} height={480} className="mx-auto h-auto max-w-full rounded-control" />
        <p>{booking.bank?.name} · {booking.bank?.accountNo}</p><p>{booking.bank?.accountName}</p>
        <p>Nội dung chuyển khoản: <strong>{booking.code}</strong></p>
        <p role="status">Thời gian giữ sân còn {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}. Trang tự cập nhật khi nhận thanh toán.</p>
      </>}
      {!paid && (booking.status === "EXPIRED" || (booking.status === "PENDING_PAYMENT" && remaining === 0)) && <p>Đã hết thời gian giữ sân. Không chuyển thêm tiền vào mã này. Nếu đã chuyển, liên hệ cơ sở để đối soát.</p>}
      {["CANCELLED", "NO_SHOW"].includes(booking.status) && <p>Đơn không còn hiệu lực. Liên hệ cơ sở nếu bạn đã chuyển tiền.</p>}
    </>}
    <Link href="/bookings" className="block text-court-600 underline">Xem lịch của tôi</Link><Link href="/venues" className="block text-court-600">Chọn sân</Link>
  </div></div>;
}
export default function PaymentResultPage() { return <Suspense fallback={<p className="p-8">Đang tải...</p>}><PaymentResultContent /></Suspense>; }
