"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getUserBookings } from "@/services/booking.service";
import type { Booking } from "@/types/booking";
import { formatVND } from "@/lib/utils";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react";

function BookingsContent() {
  const searchParams = useSearchParams();
  const currentTab = (searchParams.get("tab") as "upcoming" | "past" | "cancelled") || "upcoming";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    getUserBookings(currentTab).then((data) => {
      if (isMounted) {
        setBookings(data);
        setLoading(false);
      }
    }).catch(error => {
      if (isMounted) { setError(error.message || "Không tải được lịch đặt sân."); setBookings([]); setLoading(false); }
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

  const handleCancelBooking = (code: string) => {
    alert(`Vui lòng liên hệ cơ sở để yêu cầu hủy đơn ${code}. Đơn chưa được hủy trên hệ thống.`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {error && <p role="alert" className="mb-4 text-rose-600">{error} <Link href="/login" className="underline">Đăng nhập</Link></p>}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Lịch của tôi
          </h1>
          <p className="mt-1 text-sm text-muted">
            Quản lý và tra cứu các lượt đặt sân cầu lông của bạn
          </p>
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
                  <span className="font-mono text-xs font-bold text-court-600">
                    {booking.code}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      booking.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : booking.status === "COMPLETED"
                        ? "bg-court-100 text-court-800 dark:bg-court-950/60 dark:text-court-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {booking.status === "CONFIRMED"
                      ? "● Đã xác nhận"
                      : booking.status === "COMPLETED"
                      ? "✓ Đã hoàn tất"
                      : "✕ Đã huỷ"}
                  </span>
                </div>

                <span className="text-xs font-semibold text-muted">
                  {booking.paymentStatus === "PAID"
                    ? "Đã thanh toán VNPAY"
                    : "Trả tại sân"}
                </span>
              </div>

              {/* Thông tin cơ sở & thời gian */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">
                    {booking.venueName}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={13} className="text-court-500" />
                    <span>{booking.venueAddress}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-ink">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-court-500" />
                      <span>{booking.items[0]?.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-court-500" />
                      <span>
                        {formatHour(booking.items[0]?.startMin ?? 0)} –{" "}
                        {formatHour(booking.items[0]?.endMin ?? 0)} (
                        {booking.items[0]?.courtName})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 sm:mt-0 sm:text-right">
                  <div className="text-xs text-muted">Tổng tiền</div>
                  <div className="text-base font-black text-court-600">
                    {formatVND(booking.total)}
                  </div>
                </div>
              </div>

              {/* Hàng hành động */}
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-3 text-xs">
                {currentTab === "upcoming" && (
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(booking.code)}
                    className="rounded-control border border-border px-3 py-1.5 font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Huỷ lịch
                  </button>
                )}

                {currentTab === "past" && (
                  <Link
                    href={`/venues/${booking.venueSlug}`}
                    className="rounded-control border border-border px-3 py-1.5 font-medium text-ink hover:bg-court-50"
                  >
                    Đặt lại
                  </Link>
                )}

                <Link
                  href={`/payment/result?booking=${encodeURIComponent(booking.code)}`}
                  className="inline-flex items-center gap-1 rounded-control bg-court-600 px-3.5 py-1.5 font-semibold text-white hover:bg-court-700"
                >
                  <QrCode size={13} />
                  <span>{booking.status === "PENDING_PAYMENT" ? "Thanh toán" : "Xem đơn"}</span>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-8 text-center">
            <span className="text-4xl">📅</span>
            <h3 className="mt-3 text-base font-bold text-ink">
              Chưa có lịch nào ở mục này
            </h3>
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
