"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Calendar, Tag, CheckCheck } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "BOOKING" | "PROMO" | "SYSTEM";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n-1",
      type: "BOOKING",
      title: "Xác nhận đặt sân thành công",
      body: "Lượt đặt sân tại Sân Cầu Lông Thanh Xuân Xanh (Sân 1, 18:00–19:30) ngày 05/10/2026 đã được xác nhận.",
      createdAt: "10 phút trước",
      read: false,
    },
    {
      id: "n-2",
      type: "PROMO",
      title: "Tặng bạn mã giảm giá CHAOBAN10",
      body: "Giảm ngay 10% (tối đa 30.000 ₫) cho lần đặt sân tiếp theo của bạn trong tuần này!",
      createdAt: "Hôm qua",
      read: true,
    },
    {
      id: "n-3",
      type: "BOOKING",
      title: "Nhắc nhở giờ thi đấu",
      body: "Bạn có trận cầu lông tại CLB Cầu Lông Hồ Tây lúc 19:00 tối nay. Hãy đến sớm 10 phút để khởi động nhé.",
      createdAt: "3 ngày trước",
      read: true,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted transition hover:bg-court-50 hover:text-ink"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink sm:text-2xl">
              Thông báo
            </h1>
            <p className="text-xs text-muted">
              Cập nhật mới nhất về lịch đặt và ưu đãi dành cho bạn
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={markAllAsRead}
          className="inline-flex items-center gap-1 text-xs font-semibold text-court-600 hover:underline"
        >
          <CheckCheck size={15} />
          <span>Đọc tất cả</span>
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3.5 rounded-card border p-4 transition ${
              n.read
                ? "border-border bg-surface"
                : "border-court-200 bg-court-50/50 dark:border-court-900/60 dark:bg-court-950/20"
            }`}
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                n.type === "BOOKING"
                  ? "bg-court-100 text-court-600 dark:bg-court-900"
                  : "bg-racket-100 text-racket-600 dark:bg-racket-950"
              }`}
            >
              {n.type === "BOOKING" ? (
                <Calendar size={16} />
              ) : (
                <Tag size={16} />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-ink">{n.title}</h4>
                <span className="text-[11px] text-muted">{n.createdAt}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
