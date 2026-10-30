"use client";

import React from "react";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";
import {
  Search,
  Filter,
  Printer,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Banknote,
  RotateCcw,
} from "lucide-react";

export interface BookingOrderItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  total: number;
  totalPaid: number;
  remaining: number;
  status: string;
  sessionStatus: string;
  paymentStatus: string;
  paymentMethod: string | null;
  hasCashPayment: boolean;
  isFullyPaid: boolean;
  isOverdue: boolean;
  source?: string;
  cancelRequestedAt?: string | null;
  cancelApprovedAt?: string | null;
  refundAvailable: number;
  refundPending: number;
  refundNeedsReview: boolean;
  items: Array<{
    date: string;
    startMin: number;
    endMin: number;
    court: { id: string; name: string };
  }>;
}

interface VenueAllBookingsSectionProps {
  bookings: BookingOrderItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  courts: Array<{ id: string; name: string }>;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  courtFilter: string;
  onCourtFilterChange: (courtId: string) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  onAction: (booking: BookingOrderItem, actionType: "CHECK_IN" | "CASH" | "COMPLETE" | "CANCEL" | "PRINT") => void;
}

export default function VenueAllBookingsSection({
  bookings,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  courts,
  statusFilter,
  onStatusFilterChange,
  courtFilter,
  onCourtFilterChange,
  dateFilter,
  onDateFilterChange,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  loading = false,
  onAction,
}: VenueAllBookingsSectionProps) {
  return (
    <section className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-sm">
      {/* Tiêu đề & Đếm tổng */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div>
          <h2 className="text-base font-bold text-ink">
            Danh sách đơn đặt sân ({total})
          </h2>
          <p className="text-xs text-muted">
            Quản lý toàn bộ lịch sử đơn đặt, đơn trực tuyến và đơn tại quầy của cơ sở.
          </p>
        </div>
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Tìm kiếm */}
        <form onSubmit={onSearchSubmit} className="relative flex">
          <input
            type="text"
            placeholder="Mã DATSAN, tên, SĐT..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-control border border-border bg-surface pl-8 pr-3 py-2 text-xs text-ink focus:border-court-500"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted pointer-events-none" />
        </form>

        {/* Lọc Trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-control border border-border bg-surface px-3 py-2 text-xs font-medium text-ink focus:border-court-500"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="CHECKED_IN">Đang sử dụng (Check-in)</option>
          <option value="COMPLETED">Đã hoàn tất bàn giao</option>
          <option value="PENDING_PAYMENT">Chờ thanh toán</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="REFUND_PENDING">Chờ hoàn tiền</option>
        </select>

        {/* Lọc Sân con */}
        <select
          value={courtFilter}
          onChange={(e) => onCourtFilterChange(e.target.value)}
          className="rounded-control border border-border bg-surface px-3 py-2 text-xs font-medium text-ink focus:border-court-500"
        >
          <option value="">Tất cả sân con</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Lọc Ngày */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="w-full rounded-control border border-border bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-court-500"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => onDateFilterChange("")}
              className="text-[11px] text-muted hover:text-ink whitespace-nowrap px-1"
            >
              Xóa ngày
            </button>
          )}
        </div>
      </div>

      {/* Bảng danh sách đơn */}
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-surface">
        <table className="min-w-full divide-y divide-border/60 text-xs text-left">
          <thead className="bg-court-50/60 dark:bg-surface/90 text-muted uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Mã đơn & Khách</th>
              <th className="py-2.5 px-3">Sân & Thời gian</th>
              <th className="py-2.5 px-3">Nguồn</th>
              <th className="py-2.5 px-3">Thanh toán</th>
              <th className="py-2.5 px-3">Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-normal">
            {!bookings.length ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted">
                  {loading ? "Đang tải danh sách đơn..." : "Không tìm thấy đơn đặt sân nào phù hợp."}
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const courtInfo = b.items.map((i) => i.court.name).join(", ") || "Chưa gán sân";
                const timeInfo = b.items
                  .map((i) => `${formatHour(i.startMin)} - ${formatHour(i.endMin)} (${i.date ? i.date.slice(0, 10) : ""})`)
                  .join(" · ");
                const isPaid = b.isFullyPaid && b.remaining <= 0 && b.status !== "CANCELLED";

                return (
                  <tr key={b.id} className="hover:bg-court-50/30 transition-colors">
                    {/* Mã & Khách */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-ink">{b.code}</div>
                      <div className="text-muted text-[11px]">
                        {b.customerName} {b.customerPhone && `· ${b.customerPhone}`}
                      </div>
                    </td>

                    {/* Sân & Thời gian */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-ink">{courtInfo}</div>
                      <div className="text-[11px] text-muted">{timeInfo}</div>
                    </td>

                    {/* Nguồn đơn */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          b.source === "COUNTER"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-court-100 text-court-800 dark:bg-court-950 dark:text-court-300"
                        }`}
                      >
                        {b.source === "COUNTER" ? "Tại quầy" : "Online"}
                      </span>
                    </td>

                    {/* Thanh toán */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-ink">{formatVND(b.total)}</div>
                      <div className="text-[11px]">
                        {b.remaining > 0 ? (
                          <span className="text-rose-600 font-medium">Thiếu: {formatVND(b.remaining)}</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Đã trả đủ</span>
                        )}
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        {b.status === "CONFIRMED" && (
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            Đã xác nhận
                          </span>
                        )}
                        {b.status === "CHECKED_IN" && (
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            Đang chơi
                          </span>
                        )}
                        {b.status === "COMPLETED" && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Đã hoàn tất
                          </span>
                        )}
                        {b.status === "CANCELLED" && (
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Đã hủy
                          </span>
                        )}
                        {b.status === "PENDING_PAYMENT" && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Chờ thanh toán
                          </span>
                        )}

                        {b.isOverdue && b.status !== "COMPLETED" && b.status !== "CANCELLED" && (
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 animate-pulse">
                            Quá giờ
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Thu tiền mặt nếu còn thiếu */}
                        {b.remaining > 0 && b.status !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => onAction(b, "CASH")}
                            className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-600 transition"
                            title="Xác nhận thu tiền mặt"
                          >
                            <Banknote size={12} /> Thu tiền
                          </button>
                        )}

                        {/* Check in nếu CONFIRMED */}
                        {b.status === "CONFIRMED" && (
                          <button
                            type="button"
                            onClick={() => onAction(b, "CHECK_IN")}
                            className="inline-flex items-center gap-1 rounded bg-court-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-court-700 transition"
                            title="Check-in nhận sân"
                          >
                            Nhận sân
                          </button>
                        )}

                        {/* Hoàn tất bàn giao */}
                        {(b.status === "CONFIRMED" || b.status === "CHECKED_IN") && (
                          <button
                            type="button"
                            onClick={() => onAction(b, "COMPLETE")}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition"
                            title="Hoàn tất và bàn giao sân"
                          >
                            Bàn giao
                          </button>
                        )}

                        {/* In hóa đơn nếu đã trả đủ */}
                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => onAction(b, "PRINT")}
                            className="inline-flex items-center gap-1 rounded border border-court-500 bg-court-50 px-2 py-1 text-[11px] font-semibold text-court-700 hover:bg-court-100 dark:bg-court-950 dark:text-court-300 transition"
                            title="In hóa đơn thanh toán (80mm)"
                          >
                            <Printer size={12} /> In
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/60">
          <div>
            Trang <strong className="text-ink">{page}</strong> / {totalPages} (Tổng {total} đơn)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-control border border-border p-1.5 text-muted hover:bg-court-50 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-control border border-border p-1.5 text-muted hover:bg-court-50 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
