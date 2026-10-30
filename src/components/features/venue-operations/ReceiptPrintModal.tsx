"use client";

import React, { useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, AlertCircle, CheckCircle } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { formatHour } from "@/lib/booking";

export interface ReceiptBookingItem {
  date: string;
  startMin: number;
  endMin: number;
  court: { id: string; name: string };
}

export interface ReceiptOrder {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  total: number;
  totalPaid: number;
  remaining: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  hasCashPayment: boolean;
  isFullyPaid: boolean;
  items: ReceiptBookingItem[];
  source?: string;
  cancelRequestedAt?: string | null;
  cancelApprovedAt?: string | null;
}

export interface ReceiptVenue {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

interface ReceiptPrintModalProps {
  booking: ReceiptOrder | null;
  venue: ReceiptVenue | null;
  staffName?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptPrintModal({
  booking,
  venue,
  staffName,
  isOpen,
  onClose,
}: ReceiptPrintModalProps) {
  const isPaid = Boolean(
    booking &&
      booking.isFullyPaid &&
      booking.remaining <= 0 &&
      booking.status !== "CANCELLED" &&
      !booking.cancelApprovedAt
  );

  const printTime = useMemo(() => {
    return new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [booking?.id]);

  const handlePrint = () => {
    if (!isPaid) return;
    window.print();
  };

  if (!booking) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm print:hidden" />
        <Dialog.Content
          aria-describedby="receipt-dialog-desc"
          className="fixed left-1/2 top-1/2 z-50 max-h-[95vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl border border-border print:hidden"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <Dialog.Title className="text-lg font-bold text-ink flex items-center gap-2">
                <Printer size={20} className="text-court-600" /> Xem trước & In hóa đơn
              </Dialog.Title>
              <p id="receipt-dialog-desc" className="text-xs text-muted">
                Chuẩn khổ giấy nhiệt 80mm dành cho máy in bill tại quầy
              </p>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted hover:bg-court-50 hover:text-ink">
              <X size={20} />
            </Dialog.Close>
          </div>

          {!isPaid && (
            <div className="my-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                Đơn đặt sân này chưa được thanh toán đủ 100% hoặc đã bị hủy. Hệ thống chỉ cho phép xuất hóa đơn &quot;ĐÃ THANH TOÁN&quot; khi đơn hoàn tất thanh toán.
              </div>
            </div>
          )}

          {/* Khung mô phỏng giấy in bill 80mm */}
          <div className="my-4 flex justify-center bg-zinc-200/50 dark:bg-zinc-950/60 p-4 rounded-xl">
            <div
              id="smashbook-receipt-print-area"
              className="w-[320px] bg-white text-zinc-900 p-5 shadow-md border border-zinc-300 font-mono text-[11px] leading-relaxed selection:bg-zinc-200"
            >
              {/* Header cơ sở */}
              <div className="text-center pb-2 border-b border-dashed border-zinc-400">
                <h2 className="text-sm font-extrabold uppercase tracking-wide">
                  {venue?.name || "Sân Cầu Lông SmashBook"}
                </h2>
                {venue?.address && (
                  <p className="text-[10px] text-zinc-600 mt-0.5 break-words">
                    {venue.address}
                  </p>
                )}
                {venue?.phone && (
                  <p className="text-[10px] text-zinc-600">Hotline: {venue.phone}</p>
                )}
              </div>

              {/* Tiêu đề hóa đơn */}
              <div className="text-center py-2.5 border-b border-dashed border-zinc-400">
                <h1 className="text-base font-black tracking-tight uppercase">
                  HÓA ĐƠN THANH TOÁN
                </h1>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle size={13} />
                  <span>ĐÃ THANH TOÁN</span>
                </div>
              </div>

              {/* Thông tin đơn */}
              <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Số phiếu:</span>
                  <span className="font-bold">{booking.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Khách hàng:</span>
                  <span className="font-semibold">{booking.customerName}</span>
                </div>
                {booking.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Số ĐT:</span>
                    <span>{booking.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600">Giờ in:</span>
                  <span>{printTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Thu ngân:</span>
                  <span>{staffName || "Lễ tân cơ sở"}</span>
                </div>
              </div>

              {/* Bảng chi tiết dịch vụ / sân con */}
              <div className="py-2.5 border-b border-dashed border-zinc-400">
                <div className="flex justify-between font-bold text-[10px] uppercase text-zinc-600 border-b border-zinc-300 pb-1 mb-1.5">
                  <span className="w-1/2">Nội dung</span>
                  <span className="w-1/4 text-center">T.Lượng</span>
                  <span className="w-1/4 text-right">T.Tiền</span>
                </div>

                <div className="space-y-1.5">
                  {booking.items.map((item, idx) => {
                    const duration = item.endMin - item.startMin;
                    const dateFormatted = item.date ? item.date.slice(0, 10) : "";
                    const itemShare = Math.round(booking.total / Math.max(1, booking.items.length));
                    return (
                      <div key={idx} className="flex justify-between items-start text-[11px]">
                        <div className="w-1/2 pr-1">
                          <p className="font-bold">{item.court.name}</p>
                          <p className="text-[10px] text-zinc-600">
                            {formatHour(item.startMin)}-{formatHour(item.endMin)} ({dateFormatted})
                          </p>
                        </div>
                        <div className="w-1/4 text-center text-zinc-700">
                          {duration}p
                        </div>
                        <div className="w-1/4 text-right font-medium">
                          {formatVND(itemShare)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tổng cộng & Phương thức */}
              <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1">
                <div className="flex justify-between text-zinc-700">
                  <span>Tiền sân:</span>
                  <span>{formatVND(booking.total)}</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>Giảm giá:</span>
                  <span>0 đ</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-xs uppercase">TỔNG THANH TOÁN:</span>
                  <span className="font-black text-base tracking-tight text-right">
                    {formatVND(booking.total)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-700 pt-1 text-[10px]">
                  <span>Đã thanh toán:</span>
                  <span className="font-bold text-zinc-900">{formatVND(booking.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-zinc-700 text-[10px]">
                  <span>Còn lại:</span>
                  <span>0 đ</span>
                </div>
                <div className="flex justify-between text-zinc-700 text-[10px]">
                  <span>Phương thức:</span>
                  <span className="font-medium">
                    {booking.paymentMethod === "CASH" || booking.hasCashPayment
                      ? "Tiền mặt tại quầy"
                      : "Chuyển khoản (VietQR / SePay)"}
                  </span>
                </div>
              </div>

              {/* Lời cảm ơn cuối bill */}
              <div className="pt-3 text-center space-y-1 text-[10px] text-zinc-600">
                <p className="font-semibold text-zinc-800 italic">
                  Quý khách nên đặt sân cố định để được hưởng nhiều ưu đãi
                </p>
                <p>Cảm ơn Quý khách và hẹn gặp lại!</p>
                <p className="text-[9px] text-zinc-400 pt-1">
                  SmashBook Court Management System · {booking.source || "ONLINE"}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-control border border-border px-4 py-2 text-xs font-semibold text-muted hover:bg-court-50 hover:text-ink"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={!isPaid}
              onClick={handlePrint}
              className={`inline-flex items-center gap-1.5 rounded-control px-5 py-2 text-xs font-bold shadow transition ${
                isPaid
                  ? "bg-court-600 text-white hover:bg-court-700 active:scale-95"
                  : "bg-zinc-300 text-zinc-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
              }`}
            >
              <Printer size={15} /> In hóa đơn (80mm / PDF)
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #smashbook-receipt-print-area,
          #smashbook-receipt-print-area * {
            visibility: visible !important;
          }
          #smashbook-receipt-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm 5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </Dialog.Root>
  );
}
