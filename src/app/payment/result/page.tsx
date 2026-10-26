"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import { GroupPaymentCreate } from "@/components/GroupPaymentCreate";
import { formatHour } from "@/lib/booking";
import {
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  QrCode,
  Banknote,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  Share2,
} from "lucide-react";

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

  // Tạo mã QR nét cao nội bộ từ payload nếu có
  useEffect(() => {
    let active = true;
    if (booking?.qrPayload) {
      void import("qrcode")
        .then(({ default: qr }) =>
          qr.toDataURL(booking.qrPayload!, {
            width: 340,
            margin: 2,
            errorCorrectionLevel: "M",
          })
        )
        .then((url) => {
          if (active) setCleanQrDataUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [booking?.qrPayload]);

  // Hàm sao chép thông tin chuyển khoản có phản hồi thị giác
  function handleCopy(key: string, value: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  }

  // Tải và theo dõi định kỳ (polling) trạng thái thanh toán từ server
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const clock = setInterval(() => setNow(Date.now()), 1000);

    setBooking(null);
    setLoading(true);
    setError("");

    async function poll() {
      if (!code) {
        setError("Thiếu mã đơn đặt sân. Vui lòng kiểm tra lại đường dẫn.");
        setLoading(false);
        return;
      }

      try {
        const requestedVersion = version.current;
        const response = await fetch(`/api/bookings/${encodeURIComponent(code)}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Không đọc được trạng thái thanh toán.");
        }

        if (controller.signal.aborted) return;
        if (!mutation.current && requestedVersion === version.current) {
          setBooking(data.booking);
          setError("");
        }

        // Tiếp tục polling nếu đơn còn trong thời hạn giữ hoặc chờ duyệt tiền mặt
        const isStillPending =
          ["PENDING_PAYMENT", "CONFIRMED"].includes(data.booking.status) &&
          data.booking.paymentStatus !== "PAID";

        if (isStillPending) {
          timer = setTimeout(poll, 3000);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Mất kết nối mạng. Hãy bấm Kiểm tra lại sau khi kiểm tra kết nối."
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void poll();

    return () => {
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, [code, retry]);

  // Tính toán thời gian giữ chỗ thực tế còn lại (giây)
  const remaining = useMemo(() => {
    if (!booking?.expiresAt) return 0;
    return Math.max(0, Math.ceil((Date.parse(booking.expiresAt) - now) / 1000));
  }, [booking?.expiresAt, now]);

  const paid = booking?.paymentStatus === "PAID";
  const pending = booking?.status === "PENDING_PAYMENT" && remaining > 0;
  const isExpired =
    booking?.status === "EXPIRED" ||
    (booking?.status === "PENDING_PAYMENT" && remaining === 0);
  const cash = booking?.paymentMethod === "AT_VENUE";
  const payable =
    booking?.canChoosePayment &&
    (booking.status !== "PENDING_PAYMENT" || remaining > 0);

  // Đổi giữa thanh toán Online qua QR và Tiền mặt tại sân
  async function chooseMethod(method: "CASH" | "BANK_TRANSFER") {
    if (mutation.current || !code) return;
    mutation.current = true;
    version.current++;
    setChanging(true);
    setError("");

    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Không đổi được phương thức thanh toán.");
      }
      setBooking(data.booking);
      setRetry((v) => v + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không kết nối được máy chủ."
      );
    } finally {
      mutation.current = false;
      setChanging(false);
    }
  }

  // Định dạng thời gian đếm ngược MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading && !booking) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Đang tải thông tin đơn đặt sân...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <AlertCircle size={40} className="mx-auto text-rose-500" />
        <h2 className="mt-4 text-lg font-bold text-ink">Không tìm thấy đơn đặt sân</h2>
        <p className="mt-1.5 text-sm text-muted">{error}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setRetry((v) => v + 1)}
            className="rounded-control bg-court-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-court-700"
          >
            Thử lại
          </button>
          <Link
            href="/venues"
            className="rounded-control border border-border px-5 py-2.5 text-xs font-semibold text-ink transition hover:bg-court-50"
          >
            Về danh sách sân
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Khối Banner Trạng thái chính */}
      <div
        className={`mb-6 overflow-hidden rounded-card border p-6 shadow-sm ${
          paid
            ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30"
            : isExpired
            ? "border-rose-300 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30"
            : cash && pending
            ? "border-amber-300 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30"
            : "border-court-200 bg-court-50/50 dark:border-court-900/50 dark:bg-court-950/30"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                paid
                  ? "bg-emerald-500 text-white"
                  : isExpired
                  ? "bg-rose-500 text-white"
                  : cash && pending
                  ? "bg-amber-500 text-white"
                  : "bg-court-600 text-white"
              }`}
            >
              {paid ? (
                <CheckCircle2 size={26} />
              ) : isExpired ? (
                <AlertCircle size={26} />
              ) : cash && pending ? (
                <Banknote size={24} />
              ) : (
                <QrCode size={24} />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  {paid
                    ? "Đặt sân thành công!"
                    : isExpired
                    ? "Thời gian giữ chỗ đã hết"
                    : cash && pending
                    ? "Đang chờ duyệt thanh toán tiền mặt"
                    : booking.status === "CONFIRMED"
                    ? "Đã xác nhận lịch đặt sân"
                    : "Đang giữ sân — Chờ thanh toán"}
                </h1>
                <span className="font-mono text-xs font-bold text-muted">
                  #{booking.code}
                </span>
              </div>

              {/* Thông báo chi tiết ngữ cảnh */}
              <p className="mt-1 text-xs text-muted leading-relaxed sm:text-sm">
                {paid
                  ? "Hệ thống đã nhận thanh toán và tự động xác nhận lịch thi đấu cho bạn."
                  : isExpired
                  ? "Đã quá thời hạn thanh toán 5 phút. Vui lòng KHÔNG chuyển tiền vào mã này nữa."
                  : cash && pending
                  ? "Yêu cầu thanh toán tại sân đã được gửi tới cơ sở. Nhân viên hoặc chủ sân sẽ duyệt và xác nhận đơn."
                  : booking.status === "CONFIRMED" && !paid
                  ? "Lịch sân đã được giữ chỗ. Vui lòng thanh toán tiền mặt khi đến nhận sân thi đấu."
                  : "Vui lòng quét mã QR hoặc chuyển khoản để hoàn tất đặt sân."}
              </p>
            </div>
          </div>

          {/* Đồng hồ đếm ngược giữ chỗ (nếu đang chờ trả tiền) */}
          {pending && !cash && (
            <div className="flex shrink-0 items-center gap-2 rounded-card border border-court-300 bg-surface px-4 py-2.5 text-center shadow-sm dark:border-court-800">
              <Clock size={18} className="text-court-600 animate-pulse" />
              <div className="text-left">
                <span className="block text-[10px] uppercase font-bold text-muted">
                  Thời hạn giữ sân
                </span>
                <span className="font-mono text-base font-black text-court-600 dark:text-court-400">
                  {formatTimer(remaining)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cảnh báo lỗi kết nối */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center justify-between rounded-control border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setRetry((v) => v + 1)}
              className="inline-flex shrink-0 items-center gap-1 font-bold underline hover:text-rose-900"
            >
              <RefreshCw size={12} />
              <span>Kiểm tra lại</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Cột trái (3 phần): Thông tin thanh toán / QR / Tiền mặt */}
        <div className="space-y-6 md:col-span-3">
          {/* Nếu đơn đã thanh toán thành công (S08) */}
          {paid ? (
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck size={20} />
                <h2 className="text-base font-bold text-ink">Thông tin nhận sân thi đấu</h2>
              </div>

              <div className="rounded-control border border-border bg-bg p-4 space-y-2 text-xs text-muted">
                <p className="flex justify-between">
                  <span>Trạng thái lịch:</span>
                  <strong className="text-emerald-600 font-semibold">Đã xác nhận chính thức</strong>
                </p>
                <p className="flex justify-between">
                  <span>Tình trạng thanh toán:</span>
                  <strong className="text-emerald-600 font-semibold">Đã thanh toán đủ</strong>
                </p>
                <p className="flex justify-between">
                  <span>Số tiền:</span>
                  <strong className="text-ink font-semibold">{formatVND(booking.total)}</strong>
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/bookings"
                  className="flex-1 rounded-control bg-court-600 py-3 text-center text-xs font-bold text-white shadow-sm transition hover:bg-court-700"
                >
                  Xem trong Lịch của tôi →
                </Link>
                <Link
                  href="/venues"
                  className="rounded-control border border-border bg-surface px-5 py-3 text-center text-xs font-semibold text-ink transition hover:bg-court-50"
                >
                  Đặt thêm sân khác
                </Link>
              </div>
            </div>
          ) : isExpired ? (
            /* Đơn đã hết hạn */
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm space-y-4 text-center">
              <AlertCircle size={36} className="mx-auto text-rose-500" />
              <h2 className="text-base font-bold text-ink">Đơn giữ sân đã hết hạn</h2>
              <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                Khung giờ đã được mở lại cho người chơi khác. Quý khách vui lòng không chuyển tiền vào mã này. Nếu đã chuyển tiền trước khi hết hạn, vui lòng liên hệ cơ sở kèm mã đơn để đối soát.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href={`/venues`}
                  className="rounded-control bg-court-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-court-700"
                >
                  Chọn lại giờ chơi mới
                </Link>
              </div>
            </div>
          ) : cash ? (
            /* Phương thức Tiền mặt tại sân */
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Banknote size={18} className="text-court-600" />
                <span>Thanh toán tiền mặt tại cơ sở</span>
              </h2>

              <div className="rounded-control border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 space-y-2">
                <p className="font-semibold">Lưu ý thanh toán tại sân:</p>
                <p>• Quý khách vui lòng thanh toán trực tiếp cho nhân viên hoặc chủ sân khi đến nhận sân.</p>
                <p>• Đơn chỉ được xác nhận chính thức sau khi nhân viên sân kiểm tra và duyệt lịch.</p>
              </div>

              {payable && (
                <div className="border-t border-border pt-4">
                  <span className="text-xs text-muted block mb-2">
                    Hoặc muốn thanh toán online ngay để chắc chắn giữ sân?
                  </span>
                  <button
                    type="button"
                    disabled={changing}
                    onClick={() => chooseMethod("BANK_TRANSFER")}
                    className="w-full rounded-control border border-court-600 bg-court-50 py-2.5 text-xs font-bold text-court-700 transition hover:bg-court-100 dark:bg-court-950/40 dark:text-court-300"
                  >
                    {changing ? "Đang chuyển đổi..." : "Chuyển sang quét mã QR ngân hàng"}
                  </button>
                </div>
              )}
            </div>
          ) : booking.qrUrl ? (
            /* Phương thức Quét mã QR ngân hàng */
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <QrCode size={18} className="text-court-600" />
                  <span>Quét mã QR để thanh toán</span>
                </h2>
                <div className="flex items-center gap-1.5 rounded-control bg-court-50 p-1 text-xs dark:bg-court-950/50">
                  <button
                    type="button"
                    onClick={() => setQrType("standard")}
                    className={`rounded px-2.5 py-1 font-semibold transition ${
                      qrType === "standard"
                        ? "bg-white text-court-700 shadow-sm dark:bg-surface dark:text-court-300"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    VietQR
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrType("clean")}
                    className={`rounded px-2.5 py-1 font-semibold transition ${
                      qrType === "clean"
                        ? "bg-white text-court-700 shadow-sm dark:bg-surface dark:text-court-300"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    Mã nét cao
                  </button>
                </div>
              </div>

              {/* Hình ảnh mã QR */}
              <div className="flex justify-center rounded-card border border-border bg-white p-4 shadow-inner dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrType === "clean" && cleanQrDataUrl ? cleanQrDataUrl : booking.qrUrl}
                  alt={`Mã QR thanh toán đơn ${booking.code}`}
                  width={300}
                  height={300}
                  className="h-auto max-w-full rounded-control object-contain"
                />
              </div>

              {/* Bảng sao chép thông tin chuyển khoản dành cho người dùng 1 điện thoại */}
              <div className="space-y-2.5 rounded-control border border-border bg-bg p-3.5 text-xs">
                {/* Ngân hàng */}
                <div className="flex items-center justify-between">
                  <span className="text-muted">Ngân hàng thụ hưởng:</span>
                  <span className="font-semibold text-ink">{booking.bank?.name}</span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between">
                  <span className="text-muted">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink">
                      {booking.bank?.accountNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("accountNo", booking.bank?.accountNo || "")}
                      className="inline-flex items-center gap-1 rounded bg-surface border border-border px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm transition hover:bg-court-50"
                    >
                      {copiedKey === "accountNo" ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{copiedKey === "accountNo" ? "Đã chép" : "Sao chép"}</span>
                    </button>
                  </div>
                </div>

                {/* Chủ tài khoản */}
                <div className="flex items-center justify-between">
                  <span className="text-muted">Chủ tài khoản:</span>
                  <span className="font-semibold text-ink">{booking.bank?.accountName}</span>
                </div>

                {/* Số tiền chuẩn xác */}
                <div className="flex items-center justify-between border-t border-border/70 pt-2">
                  <span className="text-muted">Số tiền chuyển:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-court-600 text-sm">
                      {formatVND(booking.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("amount", String(booking.total))}
                      className="inline-flex items-center gap-1 rounded bg-surface border border-border px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm transition hover:bg-court-50"
                    >
                      {copiedKey === "amount" ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{copiedKey === "amount" ? "Đã chép" : "Sao chép"}</span>
                    </button>
                  </div>
                </div>

                {/* Nội dung chuyển khoản */}
                <div className="flex items-center justify-between border-t border-border/70 pt-2">
                  <span className="text-muted">Nội dung CK:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {booking.paymentReference || booking.code}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          "code",
                          booking.paymentReference || booking.code
                        )
                      }
                      className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-700 shadow-sm transition hover:bg-amber-500/20 dark:border-amber-900/60 dark:text-amber-300"
                    >
                      {copiedKey === "code" ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{copiedKey === "code" ? "Đã chép" : "Sao chép"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn chuyển khoản */}
              <div className="space-y-1 text-xs text-muted leading-relaxed">
                <p>• Vui lòng nhập <strong>chính xác nội dung chuyển khoản</strong> để hệ thống tự động xác nhận sau khi nhận tiền.</p>
                <p>• Sau khi chuyển thành công, màn hình sẽ tự động cập nhật sang trạng thái Đã thanh toán.</p>
              </div>

              {/* Nút đổi sang tiền mặt nếu cơ sở hỗ trợ */}
              {payable && (
                <div className="border-t border-border pt-4">
                  <button
                    type="button"
                    disabled={changing}
                    onClick={() => chooseMethod("CASH")}
                    className="w-full rounded-control border border-border bg-surface py-2.5 text-xs font-semibold text-muted transition hover:bg-court-50 hover:text-ink"
                  >
                    {changing ? "Đang cập nhật..." : "Đổi sang thanh toán tiền mặt tại sân"}
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Chia sẻ tiền nhóm nếu đơn đủ điều kiện */}
          {booking.groupToken ? (
            <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Share2 size={18} className="text-court-600" />
                <span>Đơn thanh toán theo nhóm</span>
              </h2>
              <p className="mt-1 text-xs text-muted">
                Đơn đặt sân này đang được chia tiền giữa các thành viên trong nhóm.
              </p>
              <Link
                href={`/groups/${booking.groupToken}`}
                className="mt-4 block rounded-control bg-court-600 py-3 text-center text-xs font-bold text-white shadow-sm transition hover:bg-court-700"
              >
                Mở phòng chia tiền nhóm & theo dõi phần tiền →
              </Link>
            </div>
          ) : pending && !paid ? (
            <GroupPaymentCreate code={booking.code} total={booking.total} />
          ) : null}
        </div>

        {/* Cột phải (2 phần): Thông tin tóm tắt đặt sân */}
        <div className="h-fit space-y-4 rounded-card border border-border bg-surface p-6 shadow-sm md:col-span-2">
          <div>
            <h2 className="text-base font-bold text-ink">{booking.venueName}</h2>
            <div className="mt-1 flex items-start gap-1 text-xs text-muted">
              <MapPin size={13} className="mt-0.5 shrink-0 text-court-500" />
              <span>{booking.venueAddress}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3 text-xs">
            <span className="font-semibold text-ink block">Các ô giờ thi đấu:</span>
            {booking.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-control border border-border/80 bg-bg p-2.5"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-ink">{item.courtName}</p>
                  <p className="text-[11px] text-muted">
                    {formatHour(item.startMin)} – {formatHour(item.endMin)}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-muted">{item.date}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 flex items-baseline justify-between text-xs">
            <span className="font-bold text-ink">Tổng giá trị đơn:</span>
            <span className="text-xl font-black text-court-600 dark:text-court-400">
              {formatVND(booking.total)}
            </span>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-2 text-xs">
            <Link
              href="/bookings"
              className="font-semibold text-court-600 hover:underline"
            >
              ← Xem tất cả trong Lịch của tôi
            </Link>
            <Link
              href="/venues"
              className="text-muted hover:text-ink transition-colors"
            >
              Tìm thêm sân cầu lông khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
          <p className="mt-4 text-sm text-muted">Đang tải trạng thái thanh toán...</p>
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
