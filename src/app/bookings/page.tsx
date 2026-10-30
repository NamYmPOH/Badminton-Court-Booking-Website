"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getUserBookings } from "@/services/booking.service";
import type { Booking } from "@/types/booking";
import { formatVND } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Users,
  AlertCircle,
  LogIn,
  RotateCcw,
  Layers,
} from "lucide-react";
import { CancelBookingNoticeModal } from "@/components/features/booking/CancelBookingNoticeModal";
import { useAuth } from "@/context/AuthContext";

function BookingsContent() {
  const searchParams = useSearchParams();
  const currentTab =
    (searchParams.get("tab") as "upcoming" | "past" | "cancelled") || "upcoming";

  const { user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelModalData, setCancelModalData] = useState<{
    code: string;
    venueName: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [currentTab, refreshKey]);

  const formatHour = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Huy hiệu hiển thị trạng thái lịch chính xác theo PRODUCT.md
  const renderBookingStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Đang giữ sân
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            ✓ Đã xác nhận lịch
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            🏸 Đã nhận sân
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            ✓ Đã chơi
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
            ✕ Không đến chơi
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            ✕ Đã huỷ
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            ⏱ Hết hạn giữ sân
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-muted/10 px-2.5 py-0.5 text-[11px] font-medium text-muted">
            {status}
          </span>
        );
    }
  };

  // Nhãn hiển thị trạng thái tiền riêng biệt
  const renderPaymentStatus = (booking: Booking) => {
    if (booking.paymentStatus === "PAID") {
      return <span className="font-semibold text-emerald-600">Đã thanh toán</span>;
    }
    if (booking.paymentStatus === "PARTIALLY_PAID") {
      return <span className="font-semibold text-sky-600">Đã thu một phần</span>;
    }
    if (booking.paymentStatus === "REFUNDED") {
      return <span className="font-semibold text-muted">Đã hoàn tiền</span>;
    }
    if (booking.paymentStatus === "REFUND_PENDING") {
      return <span className="font-semibold text-amber-600">Đang chờ hoàn tiền</span>;
    }
    if (booking.paymentStatus === "FAILED") {
      return <span className="font-semibold text-rose-600">Thanh toán thất bại</span>;
    }
    if (booking.paymentMethod === "AT_VENUE") {
      return <span className="font-semibold text-amber-600">Thu tiền tại sân</span>;
    }
    return <span className="font-semibold text-rose-600">Chưa thanh toán</span>;
  };

  const isUnauthenticated =
    !authLoading &&
    (!user ||
      error.toLowerCase().includes("đăng nhập") ||
      error.toLowerCase().includes("unauthorized"));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Modal hướng dẫn huỷ lịch cá nhân */}
      <CancelBookingNoticeModal
        isOpen={cancelModalData !== null}
        bookingCode={cancelModalData?.code || ""}
        venueName={cancelModalData?.venueName || ""}
        onClose={() => setCancelModalData(null)}
        onCancelled={() => {
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Tiêu đề & Nút đặt sân mới */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Lịch của tôi
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Quản lý các lượt đặt sân cầu lông và theo dõi trạng thái thi đấu
          </p>
        </div>

        <Link
          href="/venues"
          className="inline-flex self-start sm:self-auto items-center rounded-control bg-racket-500 px-4 py-2 text-xs font-bold text-court-950 shadow-sm transition hover:bg-racket-600 active:scale-95"
        >
          + Đặt sân mới
        </Link>
      </div>

      {/* Tabs chuyển đổi theo đúng phân loại PRODUCT.md: Sắp tới | Đã chơi | Đã huỷ / Hết hạn */}
      <div className="mt-6 flex border-b border-border">
        <Link
          href="/bookings?tab=upcoming"
          className={`flex-1 border-b-2 py-3 text-center text-xs sm:text-sm font-semibold transition ${
            currentTab === "upcoming"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Sắp tới
        </Link>

        <Link
          href="/bookings?tab=past"
          className={`flex-1 border-b-2 py-3 text-center text-xs sm:text-sm font-semibold transition ${
            currentTab === "past"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Đã chơi
        </Link>

        <Link
          href="/bookings?tab=cancelled"
          className={`flex-1 border-b-2 py-3 text-center text-xs sm:text-sm font-semibold transition ${
            currentTab === "cancelled"
              ? "border-court-600 text-court-600"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Đã huỷ / Hết hạn
        </Link>
      </div>

      {/* Danh sách thẻ đặt lịch */}
      <div className="mt-6 space-y-4">
        {isUnauthenticated ? (
          /* Trạng thái chưa đăng nhập */
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-8 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-court-50 text-court-600 dark:bg-court-950/60 dark:text-court-300">
              <LogIn size={24} />
            </div>
            <h3 className="mt-3 text-base font-bold text-ink">
              Vui lòng đăng nhập
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted leading-relaxed">
              Bạn cần đăng nhập tài khoản để tra cứu lịch đã đặt và tiếp tục thanh toán.
            </p>
            <Link
              href="/login?callbackUrl=/bookings"
              className="mt-4 rounded-control bg-court-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-court-700 active:scale-95"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : loading ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center text-xs text-muted">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
            <span className="mt-3">Đang tải danh sách đặt lịch...</span>
          </div>
        ) : bookings.length > 0 ? (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-card border border-border bg-surface p-5 shadow-sm transition hover:border-court-300 dark:hover:border-court-700"
            >
              {/* Header thẻ: Mã đơn, Trạng thái lịch & Trạng thái tiền */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-court-600 dark:text-court-400">
                    #{booking.code}
                  </span>
                  {renderBookingStatusBadge(booking.status)}
                  {booking.groupToken && (
                    <span className="inline-flex items-center gap-1 rounded bg-court-50 px-2 py-0.5 text-[10px] font-semibold text-court-700 dark:bg-court-950/60 dark:text-court-300">
                      <Users size={11} />
                      Nhóm
                    </span>
                  )}
                </div>

                <div className="text-xs">{renderPaymentStatus(booking)}</div>
              </div>

              {/* Thông tin cơ sở & thời gian thi đấu */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink">
                    {booking.venueName}
                  </h3>
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-court-500" />
                    <span className="line-clamp-1">{booking.venueAddress}</span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium text-ink">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-court-500" />
                      <span>{booking.items[0]?.date}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock size={13} className="text-court-500" />
                      <span>
                        {formatHour(booking.items[0]?.startMin ?? 0)} –{" "}
                        {formatHour(booking.items[0]?.endMin ?? 0)}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Layers size={13} className="text-court-500" />
                      <span>{booking.items[0]?.courtName}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-[11px] text-muted">Tổng tiền</div>
                  <div className="text-lg font-black text-court-600 dark:text-court-400">
                    {formatVND(booking.total)}
                  </div>
                </div>
              </div>

              {/* Hàng hành động phù hợp ngữ cảnh */}
              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-border/70 pt-3 text-xs">
                {/* Nút yêu cầu huỷ đơn cá nhân */}
                {(booking.status === "PENDING_PAYMENT" ||
                  booking.status === "CONFIRMED") && (
                  <button
                    type="button"
                    onClick={() =>
                      setCancelModalData({
                        code: booking.code,
                        venueName: booking.venueName,
                      })
                    }
                    className="rounded-control border border-border px-3 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Huỷ lịch
                  </button>
                )}

                {/* Nút đặt lại khi đơn đã hoàn thành hoặc hết hạn */}
                {(booking.status === "COMPLETED" ||
                  booking.status === "CANCELLED" ||
                  booking.status === "EXPIRED" ||
                  booking.status === "NO_SHOW") && (
                  <Link
                    href={`/venues/${booking.venueSlug}`}
                    className="inline-flex items-center gap-1 rounded-control border border-border px-3.5 py-1.5 font-semibold text-ink transition hover:bg-court-50 active:scale-95"
                  >
                    <RotateCcw size={12} />
                    <span>Đặt lại sân này</span>
                  </Link>
                )}

                {/* Nút xem đơn hoặc tiếp tục thanh toán */}
                <Link
                  href={
                    booking.groupToken
                      ? `/groups/${booking.groupToken}`
                      : `/payment/result?booking=${encodeURIComponent(booking.code)}`
                  }
                  className={`inline-flex items-center gap-1.5 rounded-control px-4 py-1.5 font-semibold text-white shadow-sm transition active:scale-95 ${
                    booking.status === "PENDING_PAYMENT"
                      ? "bg-racket-500 text-court-950 hover:bg-racket-600"
                      : "bg-court-600 hover:bg-court-700"
                  }`}
                >
                  {booking.status === "PENDING_PAYMENT" ? (
                    <>
                      <QrCode size={13} />
                      <span>Thanh toán ngay</span>
                    </>
                  ) : booking.groupToken ? (
                    <>
                      <Users size={13} />
                      <span>Phòng chia tiền</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={13} />
                      <span>Xem vé & đơn</span>
                    </>
                  )}
                </Link>
              </div>
            </div>
          ))
        ) : (
          /* Trạng thái danh sách rỗng */
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface p-8 text-center shadow-sm">
            <span className="text-4xl">🏸</span>
            <h3 className="mt-3 text-base font-bold text-ink">
              {currentTab === "upcoming"
                ? "Chưa có lịch sắp tới nào"
                : currentTab === "past"
                ? "Chưa có lịch thi đấu nào đã hoàn thành"
                : "Không có đơn nào bị huỷ hoặc hết hạn"}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted leading-relaxed">
              {currentTab === "upcoming"
                ? "Tìm sân và đặt lịch hẹn để bắt đầu trận đấu đầu tiên của bạn!"
                : "Các đơn đặt sân sau khi hoàn tất sẽ được lưu trữ tại đây."}
            </p>
            <Link
              href="/venues"
              className="mt-4 rounded-control bg-court-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-court-700 active:scale-95"
            >
              Tìm và đặt sân ngay
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
        <div className="flex min-h-[300px] flex-col items-center justify-center text-xs text-muted">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
          <span className="mt-3">Đang tải lịch của bạn...</span>
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
