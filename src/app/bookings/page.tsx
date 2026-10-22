"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getUserBookings } from "@/services/booking.service";
import type { Booking } from "@/types/booking";
import { formatVND } from "@/lib/utils";
import { Calendar, Clock, MapPin, QrCode, FileText, RotateCcw, X, Printer, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";
import Image from "next/image";

interface TicketData {
  id: string;
  ticketCode: string;
  holderName: string;
  holderPhone: string;
  status: string;
  validFrom: string;
  validTo: string;
  checkedInAt: string | null;
  venueName: string;
  venueAddress: string;
  bookingCode: string;
  items: { courtName: string; date: string; startMin: number; endMin: number }[];
}

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: string;
  venueName: string;
  venueAddress: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  subtotal: number;
  discount: number;
  status: string;
  snapshot: {
    items: { courtName: string; date: string; startMin: number; endMin: number; price: number }[];
    coach: { coachName: string; fee: number } | null;
    voucherCode: string | null;
    payments: { provider: string; amount: number; paidAt: string | null }[];
    disclaimer: string;
  };
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as "upcoming" | "past" | "cancelled") || "upcoming";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [activeTicket, setActiveTicket] = useState<{ code: string; data?: TicketData; qrDataUrl?: string; loading: boolean; error?: string } | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<{ code: string; data?: InvoiceData; loading: boolean; error?: string } | null>(null);
  const [activeRefund, setActiveRefund] = useState<{ code: string; amount?: number; loading: boolean; success?: string; error?: string } | null>(null);

  // Refund form states
  const [refundBank, setRefundBank] = useState("");
  const [refundAccountNo, setRefundAccountNo] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    getUserBookings(currentTab)
      .then((data) => {
        if (isMounted) {
          setBookings(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Không tải được lịch đặt sân.");
          setBookings([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [currentTab]);

  const formatHour = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Mở modal vé QR
  const handleOpenTicket = async (bookingCode: string) => {
    setActiveTicket({ code: bookingCode, loading: true });
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}/ticket`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được vé.");

      let qrDataUrl = "";
      if (data.qrPayload) {
        qrDataUrl = await QRCode.toDataURL(data.qrPayload, { width: 240, margin: 2 });
      }

      setActiveTicket({ code: bookingCode, data: data.ticket, qrDataUrl, loading: false });
    } catch (err) {
      setActiveTicket({
        code: bookingCode,
        loading: false,
        error: err instanceof Error ? err.message : "Lỗi tải thông tin vé",
      });
    }
  };

  // Mở modal hóa đơn nội bộ
  const handleOpenInvoice = async (bookingCode: string) => {
    setActiveInvoice({ code: bookingCode, loading: true });
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}/invoice`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được hóa đơn.");
      setActiveInvoice({ code: bookingCode, data: data.invoice, loading: false });
    } catch (err) {
      setActiveInvoice({
        code: bookingCode,
        loading: false,
        error: err instanceof Error ? err.message : "Lỗi tải thông tin hóa đơn",
      });
    }
  };

  // Mở form yêu cầu hoàn tiền
  const handleOpenRefund = (booking: Booking) => {
    setActiveRefund({ code: booking.code, amount: booking.total, loading: false });
    setRefundBank("");
    setRefundAccountNo("");
    setRefundAccountName(booking.contactName);
    setRefundReason("Khách yêu cầu hủy đơn và hoàn tiền theo chính sách");
  };

  // Gửi form yêu cầu hoàn tiền
  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRefund) return;
    setRefundSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(activeRefund.code)}/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: refundBank.trim(),
          bankAccountNumber: refundAccountNo.trim(),
          bankAccountName: refundAccountName.trim(),
          reason: refundReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không gửi được yêu cầu hoàn tiền.");

      setActiveRefund({
        ...activeRefund,
        loading: false,
        success: data.message || "Yêu cầu hoàn tiền đã gửi thành công.",
      });
    } catch (err) {
      setActiveRefund({
        ...activeRefund,
        loading: false,
        error: err instanceof Error ? err.message : "Lỗi gửi yêu cầu hoàn tiền",
      });
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {error && (
        <p role="alert" className="mb-4 text-rose-600">
          {error}{" "}
          <Link href="/login" className="underline">
            Đăng nhập
          </Link>
        </p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Lịch của tôi</h1>
          <p className="mt-1 text-sm text-muted">Quản lý và tra cứu các lượt đặt sân cầu lông của bạn</p>
        </div>

        <Link
          href="/venues"
          className="rounded-control bg-racket-500 px-4 py-2 text-xs font-bold text-court-900 transition hover:bg-racket-600"
        >
          + Đặt sân mới
        </Link>
      </div>

      {/* Tabs chuyển đổi Sắp tới | Đã chơi | Đã huỷ theo §9.5 */}
      <div className="mt-6 flex border-b border-border">
        <Link
          href="/bookings?tab=upcoming"
          className={`flex-1 border-b-2 py-3 text-center text-sm font-semibold transition ${
            currentTab === "upcoming"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Sắp tới
        </Link>

        <Link
          href="/bookings?tab=past"
          className={`flex-1 border-b-2 py-3 text-center text-sm font-semibold transition ${
            currentTab === "past"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Đã chơi
        </Link>

        <Link
          href="/bookings?tab=cancelled"
          className={`flex-1 border-b-2 py-3 text-center text-sm font-semibold transition ${
            currentTab === "cancelled"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Đã huỷ
        </Link>
      </div>

      {/* Danh sách thẻ booking */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-xs text-muted">
            Đang tải danh sách đặt lịch...
          </div>
        ) : bookings.length > 0 ? (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-card border border-border bg-surface p-5 shadow-sm transition hover:border-court-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-court-600">{booking.code}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      booking.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : booking.status === "COMPLETED"
                        ? "bg-court-100 text-court-800 dark:bg-court-950/60 dark:text-court-300"
                        : booking.status === "CHECKED_IN"
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {booking.status === "CONFIRMED"
                      ? "● Đã xác nhận"
                      : booking.status === "COMPLETED"
                      ? "✓ Đã hoàn tất"
                      : booking.status === "PENDING_PAYMENT"
                      ? "Đang giữ sân"
                      : booking.status === "CHECKED_IN"
                      ? "⚡ Đã nhận sân"
                      : "✕ Đã huỷ"}
                  </span>
                </div>

                <span className="text-xs font-semibold text-muted">
                  {booking.paymentStatus === "PAID"
                    ? "Đã thanh toán"
                    : booking.paymentStatus === "PARTIALLY_PAID"
                    ? "Đã thu một phần"
                    : booking.paymentStatus === "REFUNDED"
                    ? "Đã hoàn tiền"
                    : "Chưa thanh toán"}
                </span>
              </div>

              {/* Thông tin cơ sở & thời gian */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">{booking.venueName}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={13} className="text-court-500" />
                    <span>{booking.venueAddress}</span>
                  </div>

                  <div className="mt-2 space-y-1">
                    {Object.values(
                      (booking.items || []).reduce((acc, item) => {
                        const key = `${item.date}_${item.courtName}`;
                        if (!acc[key]) {
                          acc[key] = { date: item.date, courtName: item.courtName, startMin: item.startMin, endMin: item.endMin };
                        } else {
                          acc[key].startMin = Math.min(acc[key].startMin, item.startMin);
                          acc[key].endMin = Math.max(acc[key].endMin, item.endMin);
                        }
                        return acc;
                      }, {} as Record<string, { date: string; courtName: string; startMin: number; endMin: number }>)
                    ).map((courtGroup, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-3 text-xs font-medium text-ink">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-court-500" />
                          <span>{courtGroup.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={13} className="text-court-500" />
                          <span>
                            {formatHour(courtGroup.startMin)} – {formatHour(courtGroup.endMin)} (<strong>{courtGroup.courtName}</strong>)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 sm:mt-0 sm:text-right">
                  <div className="text-xs text-muted">Tổng tiền</div>
                  <div className="text-base font-black text-court-600">{formatVND(booking.total)}</div>
                </div>
              </div>

              {/* Hàng hành động */}
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3 text-xs">
                {/* Nút Xem vé QR */}
                {(booking.status === "CONFIRMED" || booking.status === "CHECKED_IN") && (
                  <button
                    type="button"
                    onClick={() => handleOpenTicket(booking.code)}
                    className="inline-flex items-center gap-1 rounded-control border border-court-600 bg-court-50 px-3 py-1.5 font-semibold text-court-700 hover:bg-court-100 dark:bg-court-950 dark:text-court-300"
                  >
                    <QrCode size={13} />
                    <span>Vé nhận sân</span>
                  </button>
                )}

                {/* Nút Xem biên lai nội bộ */}
                {(booking.paymentStatus === "PAID" || booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(booking.code)}
                    className="inline-flex items-center gap-1 rounded-control border border-border px-3 py-1.5 font-medium text-ink hover:bg-surface-elevated"
                  >
                    <FileText size={13} />
                    <span>Hóa đơn / Biên lai</span>
                  </button>
                )}

                {/* Nút Yêu cầu hoàn tiền */}
                {booking.paymentStatus === "PAID" && booking.status !== "COMPLETED" && (
                  <button
                    type="button"
                    onClick={() => handleOpenRefund(booking)}
                    className="inline-flex items-center gap-1 rounded-control border border-rose-200 px-3 py-1.5 font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400"
                  >
                    <RotateCcw size={13} />
                    <span>Hoàn tiền</span>
                  </button>
                )}

                {/* Nút Xem đơn / Thanh toán */}
                <Link
                  href={
                    booking.groupToken
                      ? `/groups/${booking.groupToken}`
                      : `/payment/result?booking=${encodeURIComponent(booking.code)}`
                  }
                  className="inline-flex items-center gap-1 rounded-control bg-court-600 px-3.5 py-1.5 font-semibold text-white hover:bg-court-700"
                >
                  <span>{booking.status === "PENDING_PAYMENT" ? "Thanh toán" : "Xem chi tiết"}</span>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-8 text-center">
            <span className="text-4xl">📅</span>
            <h3 className="mt-3 text-base font-bold text-ink">Chưa có lịch nào ở mục này</h3>
            <p className="mt-1 text-xs text-muted">
              Tìm kiếm sân và đặt lịch hẹn để bắt đầu trận đấu đầu tiên của bạn
            </p>
            <Link
              href="/venues"
              className="mt-4 rounded-control bg-court-600 px-4 py-2 text-xs font-semibold text-white hover:bg-court-700"
            >
              Tìm sân ngay
            </Link>
          </div>
        )}
      </div>

      {/* MODAL: VÉ ĐIỆN TỬ QR */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-2xl">
            <button
              onClick={() => setActiveTicket(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted hover:bg-border/40 hover:text-ink"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-ink">Vé điện tử nhận sân</h3>
            <p className="text-xs text-muted">Đưa mã QR này cho nhân viên tại sân để check-in</p>

            {activeTicket.loading ? (
              <p className="py-8 text-center text-xs text-muted">Đang tải mã vé...</p>
            ) : activeTicket.error ? (
              <p className="py-4 text-xs text-rose-600">{activeTicket.error}</p>
            ) : (
              activeTicket.data && (
                <div className="mt-4 flex flex-col items-center text-center">
                  {activeTicket.qrDataUrl && (
                    <Image
                      src={activeTicket.qrDataUrl}
                      alt="QR Code Vé nhận sân"
                      width={240}
                      height={240}
                      unoptimized
                      className="rounded-lg border border-border bg-white p-2 shadow-sm"
                    />
                  )}
                  <p className="mt-2 font-mono text-sm font-black text-court-600">
                    {activeTicket.data.ticketCode}
                  </p>
                  <div className="mt-3 w-full rounded-control border border-border/80 bg-surface-elevated p-3 text-left text-xs space-y-1">
                    <div>
                      <span className="text-muted">Cơ sở:</span> <strong>{activeTicket.data.venueName}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Khách đặt:</span> {activeTicket.data.holderName} (
                      {activeTicket.data.holderPhone})
                    </div>
                    <div>
                      <span className="text-muted">Trạng thái vé:</span>{" "}
                      <span className="font-bold text-emerald-600">
                        {activeTicket.data.status === "UNUSED" ? "Chưa sử dụng (Hợp lệ)" : "Đã check-in"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Hiệu lực đến:</span>{" "}
                      {new Date(activeTicket.data.validTo).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* MODAL: HÓA ĐƠN / BIÊN LAI NỘI BỘ */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-border bg-surface p-6 shadow-2xl">
            <button
              onClick={() => setActiveInvoice(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted hover:bg-border/40 hover:text-ink"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Biên lai dịch vụ SmashBook</h3>
                <p className="text-xs text-muted">Chứng từ xác nhận thanh toán nội bộ</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 rounded-control border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-elevated"
              >
                <Printer size={13} />
                <span>In biên lai</span>
              </button>
            </div>

            {activeInvoice.loading ? (
              <p className="py-8 text-center text-xs text-muted">Đang tải biên lai...</p>
            ) : activeInvoice.error ? (
              <p className="py-4 text-xs text-rose-600">{activeInvoice.error}</p>
            ) : (
              activeInvoice.data && (
                <div className="mt-4 space-y-4 text-xs text-ink">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">{activeInvoice.data.venueName}</p>
                      <p className="text-muted">{activeInvoice.data.venueAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-court-600">{activeInvoice.data.invoiceNumber}</p>
                      <p className="text-muted">
                        Ngày lập:{" "}
                        {new Date(activeInvoice.data.issuedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-control border border-border bg-surface-elevated p-3">
                    <p className="text-muted">Thông tin khách hàng:</p>
                    <p className="font-bold">
                      {activeInvoice.data.customerName} · {activeInvoice.data.customerPhone}
                    </p>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-muted">
                        <th className="py-2">Dịch vụ / Sân</th>
                        <th className="py-2">Khung giờ</th>
                        <th className="py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInvoice.data.snapshot.items.map((it, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-2 font-medium">{it.courtName}</td>
                          <td className="py-2 text-muted">
                            {it.date} ({formatHour(it.startMin)} - {formatHour(it.endMin)})
                          </td>
                          <td className="py-2 text-right font-medium">{formatVND(it.price)}</td>
                        </tr>
                      ))}
                      {activeInvoice.data.snapshot.coach && (
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-medium">HLV: {activeInvoice.data.snapshot.coach.coachName}</td>
                          <td className="py-2 text-muted">Dịch vụ huấn luyện</td>
                          <td className="py-2 text-right font-medium">
                            {formatVND(activeInvoice.data.snapshot.coach.fee)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="space-y-1 text-right">
                    <div className="flex justify-between text-muted">
                      <span>Tạm tính:</span>
                      <span>{formatVND(activeInvoice.data.subtotal)}</span>
                    </div>
                    {activeInvoice.data.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Giảm giá ({activeInvoice.data.snapshot.voucherCode}):</span>
                        <span>-{formatVND(activeInvoice.data.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-court-600">
                      <span>Tổng tiền:</span>
                      <span>{formatVND(activeInvoice.data.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-ink">
                      <span>Đã thanh toán:</span>
                      <span>{formatVND(activeInvoice.data.paidAmount)}</span>
                    </div>
                  </div>

                  <div className="rounded-control bg-amber-50 p-2 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    ⚠️ {activeInvoice.data.snapshot.disclaimer}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* MODAL: YÊU CẦU HOÀN TIỀN */}
      {activeRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-2xl">
            <button
              onClick={() => setActiveRefund(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted hover:bg-border/40 hover:text-ink"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-ink">Yêu cầu hoàn tiền</h3>
            <p className="text-xs text-muted">Đơn: {activeRefund.code}</p>

            {activeRefund.success ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
                <p className="text-sm font-semibold text-ink">{activeRefund.success}</p>
                <button
                  type="button"
                  onClick={() => setActiveRefund(null)}
                  className="rounded-control bg-court-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRefund} className="mt-4 space-y-3 text-xs">
                {activeRefund.error && <p className="text-rose-600">{activeRefund.error}</p>}

                <div>
                  <label className="block font-semibold text-muted">Ngân hàng thụ hưởng</label>
                  <input
                    required
                    placeholder="VD: Vietcombank, Techcombank, MB Bank..."
                    value={refundBank}
                    onChange={(e) => setRefundBank(e.target.value)}
                    className="mt-1 w-full rounded-control border border-border bg-surface p-2.5 text-ink"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted">Số tài khoản</label>
                  <input
                    required
                    placeholder="Nhập số tài khoản ngân hàng"
                    value={refundAccountNo}
                    onChange={(e) => setRefundAccountNo(e.target.value)}
                    className="mt-1 w-full rounded-control border border-border bg-surface p-2.5 text-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted">Tên chủ tài khoản (Không dấu)</label>
                  <input
                    required
                    placeholder="VD: NGUYEN VAN A"
                    value={refundAccountName}
                    onChange={(e) => setRefundAccountName(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-control border border-border bg-surface p-2.5 text-ink font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-muted">Lý do hoàn tiền</label>
                  <textarea
                    required
                    rows={2}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="mt-1 w-full rounded-control border border-border bg-surface p-2 text-ink"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveRefund(null)}
                    className="rounded-control border border-border px-3 py-2 text-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={refundSubmitting}
                    className="rounded-control bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {refundSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center text-xs text-muted">
          Đang tải lịch của bạn...
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
