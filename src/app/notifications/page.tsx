"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Tag,
  CheckCheck,
  AlertTriangle,
  Building2,
  RefreshCw,
  Clock,
  ChevronRight,
  ShieldAlert,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  tag: string;
  bookingId?: string;
  bookingCode?: string;
  venueId?: string;
  url?: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

function formatRelativeTimeVN(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "Hôm qua";
    if (diffDay < 7) return `${diffDay} ngày trước`;
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return isoString;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [venueFilter, setVenueFilter] = useState<string>("");

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (venueFilter) params.set("venueId", venueFilter);

      const res = await fetch(`/api/notifications?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không tải được danh sách thông báo.");
      }

      setNotifications(json.data || []);
      setUnreadCount(json.unreadCount || 0);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tải thông báo.");
    } finally {
      setLoading(false);
    }
  }, [user, page, venueFilter]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        void loadNotifications();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, loadNotifications]);

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          all: true,
          ...(venueFilter ? { venueId: venueFilter } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể cập nhật.");
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    } catch {
      toast.error("Không thể đánh dấu đã đọc.");
    }
  };

  const handleClickNotification = async (item: NotificationItem) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!item.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Bỏ qua lỗi nền
      }
    }

    // Điều hướng đến đúng đơn hoặc cơ sở
    if (item.url) {
      router.push(item.url);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-court-50 text-court-600 dark:bg-court-950">
          <Bell size={26} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink">Đăng nhập để xem thông báo</h2>
        <p className="mt-1 text-xs text-muted">
          Thông báo đơn đặt sân, nhắc giờ thi đấu và cập nhật vận hành chỉ hiển thị sau khi bạn đăng nhập tài khoản.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-control bg-racket-500 px-6 py-2.5 text-xs font-bold text-court-950 shadow-sm transition hover:bg-racket-600"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-28 sm:px-6 md:pb-16">
      {/* Header thanh điều hướng */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition hover:bg-court-50 hover:text-ink active:scale-95"
            aria-label="Quay lại trang chủ"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink sm:text-2xl">Thông báo</h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-court-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Cập nhật thời gian thực về lịch đặt sân, thanh toán và sự kiện vận hành cơ sở.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-court-700 shadow-xs hover:bg-court-50 dark:hover:bg-surface/80 transition"
            >
              <CheckCheck size={14} />
              <span>Đọc tất cả</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted hover:bg-court-50 transition"
            title="Làm mới thông báo"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Danh sách thông báo */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-card border border-border bg-surface p-4"
            >
              <div className="h-4 w-1/3 rounded bg-muted/20" />
              <div className="mt-2 h-3 w-3/4 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-card border border-rose-200 bg-rose-50/60 p-6 text-center text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertTriangle size={22} className="mx-auto mb-2 text-rose-600" />
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="mt-3 rounded-control bg-rose-600 px-4 py-1.5 text-white font-medium hover:bg-rose-700"
          >
            Tải lại
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-court-50 text-court-500 dark:bg-court-950/50">
            <Bell size={24} className="stroke-[1.6]" />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink">Chưa có thông báo nào</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted">
            Khi có đơn đặt sân mới, xác nhận thanh toán hoặc nhắc giờ thi đấu, thông báo sẽ hiển thị ngay tại đây.
          </p>
          <div className="mt-5">
            <Link
              href="/venues"
              className="inline-flex rounded-control bg-racket-500 px-5 py-2.5 text-xs font-bold text-court-950 shadow-sm transition hover:bg-racket-600"
            >
              Đặt sân thi đấu
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isBooking = n.type.includes("BOOKING") || n.tag?.includes("BOOKING");
            const isStaffAlert = n.tag?.includes("STAFF");
            const isOverdue = n.tag?.includes("OVERDUE");

            return (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`group flex items-start gap-3.5 rounded-card border p-4 transition cursor-pointer select-none ${
                  n.read
                    ? "border-border bg-surface hover:border-court-300 hover:bg-court-50/20"
                    : "border-court-200 bg-court-50/60 dark:border-court-900/60 dark:bg-court-950/25 shadow-xs"
                }`}
              >
                {/* Icon loại thông báo */}
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isOverdue
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : isStaffAlert
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : isBooking
                      ? "bg-court-100 text-court-700 dark:bg-court-950 dark:text-court-300"
                      : "bg-racket-100 text-racket-800 dark:bg-racket-950 dark:text-racket-300"
                  }`}
                >
                  {isOverdue ? (
                    <Clock size={16} />
                  ) : isStaffAlert ? (
                    <Building2 size={16} />
                  ) : isBooking ? (
                    <Calendar size={16} />
                  ) : (
                    <Tag size={16} />
                  )}
                </div>

                {/* Nội dung thông báo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs ${
                          n.read ? "font-semibold text-ink" : "font-extrabold text-ink"
                        } truncate`}
                      >
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-court-600 animate-pulse shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted whitespace-nowrap">
                      {formatRelativeTimeVN(n.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                    {n.body}
                  </p>

                  {n.url && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-court-600 group-hover:underline">
                      <span>Xem chi tiết</span>
                      <ChevronRight size={13} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-control border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-court-50 disabled:opacity-40"
          >
            Trang trước
          </button>
          <span className="text-xs font-medium text-muted">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-control border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-court-50 disabled:opacity-40"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
