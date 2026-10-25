"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import { GroupPaymentCreate } from "@/components/GroupPaymentCreate";
import { formatHour } from "@/lib/booking";
import { Check, Copy } from "lucide-react";

type PaymentBooking = Booking & {
  groupToken?: string | null;
  canChoosePayment: boolean;
  qrUrl: string | null;
  qrCleanUrl?: string | null;
  qrPayload?: string | null;
  paymentReference?: string;
  bank: { name: string; accountNo: string; accountName: string } | null;
};
function PaymentResultContent() {
  const params = useSearchParams();
  const code = params.get("booking");
  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [changing, setChanging] = useState(false);
  const [cleanQrDataUrl, setCleanQrDataUrl] = useState<string | null>(null);
  const [qrType, setQrType] = useState<"standard" | "clean">("standard");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const mutation = useRef(false);
  const version = useRef(0);

  useEffect(() => {
    let active = true;
    if (booking?.qrPayload) {
      void import("qrcode")
        .then(({ default: qr }) =>
          qr.toDataURL(booking.qrPayload!, { width: 340, margin: 2, errorCorrectionLevel: "M" })
        )
        .then(url => {
          if (active) setCleanQrDataUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [booking?.qrPayload]);

  function copy(key: string, value: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  }

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
      {booking.groupToken && <Link href={`/groups/${booking.groupToken}`} className="block rounded-control bg-court-600 p-4 text-center font-bold text-white">Mở nhóm và các phần thanh toán</Link>}
      {!booking.groupToken && pending && !paid && <GroupPaymentCreate code={booking.code} total={booking.total} />}
      {payable && <div className="grid gap-6 md:grid-cols-[1fr_260px]">
      <section className="space-y-3 rounded-control border border-border p-4">
      <h2 className="font-bold">{cash ? "Thanh toán tại sân" : "Thanh toán online qua QR"}</h2>
      {cash ? (
        <>
          <p>{pending ? "Đã gửi yêu cầu thanh toán tiền mặt. Đơn chưa được duyệt và chưa được ghi nhận đã trả tiền." : "Bạn đã chọn thanh toán tiền mặt."}</p>
          <p className="text-sm text-muted">Liên hệ sân để nhân viên hoặc chủ sân kiểm tra đơn.</p>
        </>
      ) : booking.qrUrl && !error ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 rounded-control bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setQrType("standard")}
              className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                qrType === "standard"
                  ? "bg-white font-semibold shadow-sm dark:bg-slate-700"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Mẫu VietQR
            </button>
            <button
              type="button"
              onClick={() => setQrType("clean")}
              className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                qrType === "clean"
                  ? "bg-white font-semibold shadow-sm dark:bg-slate-700"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Mã QR nét cao (quét tức thì)
            </button>
          </div>

          <div className="relative flex justify-center rounded-control bg-white p-3 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrType === "clean" && cleanQrDataUrl ? cleanQrDataUrl : booking.qrUrl}
              alt={`QR chuyển khoản cho ${booking.code}`}
              width={340}
              height={qrType === "clean" && cleanQrDataUrl ? 340 : 440}
              className="mx-auto h-auto max-w-full rounded-control"
            />
          </div>

          <div className="space-y-2 rounded-control border border-border bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Ngân hàng:</span>
              <strong className="font-semibold">{booking.bank?.name}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{booking.bank?.accountNo}</span>
                <button
                  type="button"
                  onClick={() => copy("accountNo", booking.bank?.accountNo || "")}
                  className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  {copiedKey === "accountNo" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copiedKey === "accountNo" ? "Đã chép" : "Sao chép"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Chủ tài khoản:</span>
              <strong className="font-semibold">{booking.bank?.accountName}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Số tiền:</span>
              <div className="flex items-center gap-2">
                <strong className="text-base text-court-600">{formatVND(booking.total)}</strong>
                <button
                  type="button"
                  onClick={() => copy("amount", String(booking.total))}
                  className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  {copiedKey === "amount" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copiedKey === "amount" ? "Đã chép" : "Sao chép"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
              <span className="text-muted">Nội dung CK:</span>
              <div className="flex items-center gap-2">
                <strong className="font-mono font-bold text-amber-600 dark:text-amber-400">{booking.paymentReference || booking.code}</strong>
                <button
                  type="button"
                  onClick={() => copy("code", booking.paymentReference || booking.code)}
                  className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200"
                >
                  {copiedKey === "code" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copiedKey === "code" ? "Đã chép" : "Sao chép"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs text-muted">
            <p>• Chuyển đúng số tiền và nội dung chuyển khoản để hệ thống tự động xác nhận đơn ngay khi nhận tiền.</p>
            <p>• Nếu app ngân hàng báo <em>&quot;Mã QR đã hết hạn, hoặc sai mã&quot;</em>, hãy chuyển sang <strong>Mã QR nét cao</strong> hoặc bấm <strong>Sao chép</strong> số tài khoản và nội dung để chuyển khoản trực tiếp.</p>
          </div>
        </div>
      ) : (
        <p role="status">Thanh toán online hiện chưa sẵn sàng. Bạn có thể chọn thanh toán bằng tiền mặt hoặc kiểm tra lại sau.</p>
      )}
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
