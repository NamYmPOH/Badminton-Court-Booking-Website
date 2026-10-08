"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import { formatHour } from "@/lib/booking";

type PaymentBooking = Booking & { canChoosePayment: boolean; qrUrl: string | null; bank: { name: string; accountNo: string; accountName: string } | null };
function PaymentResultContent() {
  const params = useSearchParams();
  const code = params.get("booking");
  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [changing, setChanging] = useState(false);
  const mutation = useRef(false);
  const version = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const clock = setInterval(() => setNow(Date.now()), 1000);
    setBooking(null); setLoading(true); setError("");
    async function poll() {
      if (!code) { setError("Thiếu mã đơn đặt sân."); setLoading(false); return; }
      try {
        const requestedVersion = version.current;
        const response = await fetch(`/api/bookings/${encodeURIComponent(code)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Không đọc được trạng thái thanh toán.");
        if (controller.signal.aborted) return;
        if (!mutation.current && requestedVersion === version.current) { setBooking(data.booking); setError(""); }
        // Chỉ server xác nhận PAID. Không dùng URL hay sessionStorage để báo thành công.
        if (["PENDING_PAYMENT", "CONFIRMED"].includes(data.booking.status) && data.booking.paymentStatus !== "PAID") timer = setTimeout(poll, 3000);
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
  const cash = booking?.paymentMethod === "AT_VENUE";
  const payable = booking?.canChoosePayment && (booking.status !== "PENDING_PAYMENT" || remaining > 0);
  async function choose(method: "CASH" | "BANK_TRANSFER") {
    if (mutation.current) return;
    mutation.current = true; version.current++; setChanging(true); setError("");
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(code || "")}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không đổi được phương thức thanh toán.");
      setBooking(data.booking); setRetry(v => v + 1);
    } catch (error) { setError(error instanceof Error ? error.message : "Không kết nối được máy chủ."); }
    finally { mutation.current = false; setChanging(false); }
  }
  return <div className="mx-auto max-w-4xl px-4 py-10"><div className="space-y-5 rounded-card border border-border bg-surface p-6">
    <h1 className="text-2xl font-bold">{paid ? "Thanh toán thành công" : pending && cash ? "Chờ sân duyệt thanh toán tiền mặt" : booking?.status === "CONFIRMED" ? "Đã xác nhận đặt sân" : pending ? "Đã tạo đơn đặt sân" : loading ? "Đang kiểm tra đơn..." : "Trạng thái đặt sân"}</h1>
    {error && <div role="alert" className="space-y-3 text-rose-600"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="underline">Kiểm tra lại</button><p className="text-sm">Nếu đã chuyển tiền, hãy kiểm tra trạng thái trước khi chuyển thêm.</p></div>}
    {booking && <>
      <p>Mã đơn: <strong className="font-mono">{booking.code}</strong></p><p>{booking.venueName}</p>
      <p className="text-sm text-muted">{booking.venueAddress}</p>
      {booking.items.map(item => <p key={item.id} className="text-sm">{item.courtName} · {item.date} · {formatHour(item.startMin)}–{formatHour(item.endMin)}</p>)}
      <p className="text-xl font-bold text-court-600">{formatVND(booking.total)}</p>
      {paid && <p role="status">Đã nhận thanh toán và xác nhận lịch sân của bạn.</p>}
      {booking.status === "CONFIRMED" && !paid && <p>{cash ? "Sân đã duyệt. Thanh toán tiền mặt khi đến chơi; nhân viên sẽ xác nhận sau khi nhận tiền." : "Lịch sân đã được xác nhận, đơn chưa thanh toán."}</p>}
      {payable && <div className="grid gap-6 md:grid-cols-[1fr_260px]">
      <section className="space-y-3 rounded-control border border-border p-4">
      <h2 className="font-bold">{cash ? "Thanh toán tại sân" : "Thanh toán online qua QR"}</h2>
      {cash ? <><p>{pending ? "Đã gửi yêu cầu thanh toán tiền mặt. Đơn chưa được duyệt và chưa được ghi nhận đã trả tiền." : "Bạn đã chọn thanh toán tiền mặt."}</p><p className="text-sm text-muted">Liên hệ sân để nhân viên hoặc chủ sân kiểm tra đơn.</p></> : booking.qrUrl && !error ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={booking.qrUrl} alt={`QR chuyển khoản cho ${booking.code}`} width={360} height={480} className="mx-auto h-auto max-w-full rounded-control" />
        <p>{booking.bank?.name} · {booking.bank?.accountNo}</p><p>{booking.bank?.accountName}</p>
        <p>Nội dung chuyển khoản: <strong>{booking.code}</strong></p>
        <p className="text-sm text-muted">Chuyển đúng số tiền và nội dung. Trang tự cập nhật khi SePay xác nhận.</p>
      </> : <p role="status">Thanh toán online hiện chưa sẵn sàng. Bạn có thể chọn thanh toán bằng tiền mặt hoặc kiểm tra lại sau.</p>}
      </section>
      <aside className="space-y-3 rounded-control border border-border p-4">
        <h2 className="font-bold">Phương thức khác</h2>
        <button disabled={changing || loading || !!error} onClick={() => choose(cash ? "BANK_TRANSFER" : "CASH")} className="w-full rounded-control bg-court-600 p-3 font-semibold text-white disabled:opacity-50">{changing ? "Đang cập nhật..." : cash ? "Thanh toán online qua QR" : "Thanh toán bằng tiền mặt"}</button>
        <p className="text-sm text-muted">Tiền mặt được nhân viên hoặc chủ sân duyệt và ghi nhận tại sân. Nếu đã chuyển khoản, hãy chờ đối soát trước khi chọn tiền mặt.</p>
      </aside></div>}
      {pending && <p role="status">Thời gian giữ sân còn {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}. Cần thanh toán online hoặc được sân duyệt trước khi hết hạn.</p>}
      {!paid && (booking.status === "EXPIRED" || (booking.status === "PENDING_PAYMENT" && remaining === 0)) && <p>Đã hết thời gian giữ sân. Không chuyển thêm tiền vào mã này. Nếu đã chuyển, liên hệ cơ sở để đối soát.</p>}
      {["CANCELLED", "NO_SHOW"].includes(booking.status) && <p>Đơn không còn hiệu lực. Liên hệ cơ sở nếu bạn đã chuyển tiền.</p>}
    </>}
    <Link href="/bookings" className="block text-court-600 underline">Xem lịch của tôi</Link><Link href="/venues" className="block text-court-600">Chọn sân</Link>
  </div></div>;
}
export default function PaymentResultPage() { return <Suspense fallback={<p className="p-8">Đang tải...</p>}><PaymentResultContent /></Suspense>; }
