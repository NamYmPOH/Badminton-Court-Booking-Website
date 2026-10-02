"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, QrCode, ArrowRight, Home } from "lucide-react";
import { formatVND } from "@/lib/utils";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "SB-261005-7K2F";
  const venue = searchParams.get("venue") || "Sân Cầu Lông Thanh Xuân Xanh";
  const total = searchParams.get("total") ? parseInt(searchParams.get("total")!, 10) : 145000;
  const method = searchParams.get("method") || "VNPAY";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-card border border-border bg-surface p-6 sm:p-8 text-center shadow-md">
        {/* Biểu tượng thành công */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 size={36} />
        </div>

        <h1 className="mt-4 text-2xl font-black text-ink">
          Đặt sân thành công!
        </h1>
        <p className="mt-1 text-sm text-muted">
          Lịch thi đấu của bạn đã được xác nhận vào hệ thống
        </p>

        {/* Mã đặt sân nổi bật */}
        <div className="mt-6 rounded-control border border-dashed border-court-400 bg-court-50/60 p-4 dark:bg-court-950/30">
          <span className="text-xs uppercase tracking-wider text-muted">
            Mã đặt lịch (Booking Code)
          </span>
          <div className="mt-1 font-mono text-xl font-black text-court-600">
            {code}
          </div>
        </div>

        {/* Mô phỏng mã QR check-in tại quầy */}
        <div className="mt-6 flex flex-col items-center justify-center">
          <div className="rounded-card border border-border bg-white p-3 shadow-inner">
            <QrCode size={130} className="text-court-900" />
          </div>
          <span className="mt-2 text-xs text-muted">
            Xuất trình mã này cho nhân viên khi đến sân để nhận sân nhanh
          </span>
        </div>

        {/* Bảng chi tiết đơn */}
        <div className="mt-6 space-y-2 border-t border-border pt-4 text-left text-xs">
          <div className="flex justify-between py-1">
            <span className="text-muted">Cơ sở:</span>
            <span className="font-bold text-ink">{venue}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Thời gian:</span>
            <span className="font-medium text-ink">18:00 – 19:30 (Thứ 6, 05/10/2026)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Sân đấu:</span>
            <span className="font-medium text-ink">Sân 1 (Sân trung tâm)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Hình thức:</span>
            <span className="font-medium text-ink">
              {method === "AT_VENUE" ? "Trả tại sân" : "VNPAY (Đã thanh toán)"}
            </span>
          </div>
          <div className="flex justify-between border-t border-border/80 pt-2 font-bold text-sm">
            <span>Tổng tiền:</span>
            <span className="text-court-600">{formatVND(total)}</span>
          </div>
        </div>

        {/* Các nút hành động */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/bookings"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control bg-court-600 py-3 text-xs font-bold text-white transition hover:bg-court-700"
          >
            <Calendar size={16} />
            <span>Xem lịch của tôi</span>
          </Link>

          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-control border border-border bg-surface py-3 text-xs font-semibold text-ink transition hover:bg-court-50"
          >
            <Home size={16} />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-sm text-muted">
          Đang xác nhận kết quả thanh toán...
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
