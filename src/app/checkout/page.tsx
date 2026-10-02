"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { ArrowLeft, Clock, ShieldCheck, Tag } from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const venueName = searchParams.get("venueName") || "Sân Cầu Lông Thanh Xuân Xanh";
  const date = searchParams.get("date") || "2026-10-05";
  const totalParam = searchParams.get("total");
  const baseTotal = totalParam ? parseInt(totalParam, 10) : 165000;

  // Form states
  const [name, setName] = useState("Nguyễn Văn Nam");
  const [phone, setPhone] = useState("0912345678");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "AT_VENUE">("VNPAY");
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherCode.toUpperCase() === "CHAOBAN10") {
      const disc = Math.round(baseTotal * 0.1);
      setDiscount(disc);
      setVoucherApplied(true);
    } else if (voucherCode.toUpperCase() === "GIAM20K") {
      setDiscount(20000);
      setVoucherApplied(true);
    } else {
      alert("Mã ưu đãi không hợp lệ hoặc đã hết lượt.");
    }
  };

  const finalTotal = Math.max(0, baseTotal - discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tạo mã đặt sân ngẫu nhiên theo chuẩn SB-yymmdd-XXXX
    const randomCode = `SB-261005-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    router.push(
      `/payment/result?code=${randomCode}&venue=${encodeURIComponent(
        venueName
      )}&total=${finalTotal}&method=${paymentMethod}`
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Nút quay lại */}
      <div className="mb-6">
        <Link
          href="/venues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          <span>Quay lại chọn sân</span>
        </Link>
      </div>

      {/* Thanh 3 bước theo §9.5 */}
      <div className="mb-8 flex items-center justify-center gap-2 text-xs font-semibold sm:gap-4 sm:text-sm">
        <span className="text-muted">① Chọn sân và giờ</span>
        <span className="text-muted">─</span>
        <span className="text-court-600 font-bold">② Thanh toán</span>
        <span className="text-muted">─</span>
        <span className="text-muted">③ Hoàn tất</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cột trái (2 phần): Thông tin người đặt + Phương thức thanh toán */}
        <div className="space-y-6 lg:col-span-2">
          {/* Thông tin liên hệ */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-ink">Thông tin người đặt</h2>
            <p className="mt-1 text-xs text-muted">
              Thông tin sẽ được dùng để xác nhận tại quầy và nhận thông báo lịch thi đấu
            </p>

            <form onSubmit={handleSubmit} id="checkout-form" className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-control border border-border bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-court-600 dark:bg-court-950/40"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-control border border-border bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-court-600 dark:bg-court-950/40"
                  placeholder="0912 345 678"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink">
                  Ghi chú cho cơ sở (tuỳ chọn)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-control border border-border bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-court-600 dark:bg-court-950/40"
                  placeholder="Ví dụ: Cần mượn thêm vợt, cần bật thêm đèn..."
                />
              </div>
            </form>
          </div>

          {/* Mã ưu đãi */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-ink">Mã ưu đãi / Voucher</h2>
            <form onSubmit={handleApplyVoucher} className="mt-3 flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-control border border-border bg-white px-3 py-2 text-sm dark:bg-court-950/40">
                <Tag size={16} className="text-muted" />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã (thử: CHAOBAN10 hoặc GIAM20K)"
                  className="w-full bg-transparent uppercase outline-none text-ink text-xs sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-control bg-court-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-court-700"
              >
                Áp dụng
              </button>
            </form>
            {voucherApplied && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">
                ✓ Đã áp dụng giảm {formatVND(discount)}
              </p>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-ink">Phương thức thanh toán</h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border p-3.5 transition hover:bg-court-50/50">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "VNPAY"}
                  onChange={() => setPaymentMethod("VNPAY")}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-bold text-ink">
                    Cổng VNPAY (Quét mã QR / Thẻ ATM & Tài khoản ngân hàng)
                  </span>
                  <p className="mt-0.5 text-xs text-muted">
                    Thanh toán bảo mật tức thì, xác nhận ngay không cần gọi điện
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border p-3.5 transition hover:bg-court-50/50">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "AT_VENUE"}
                  onChange={() => setPaymentMethod("AT_VENUE")}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-bold text-ink">
                    Trả tiền mặt tại sân (Nếu cơ sở hỗ trợ)
                  </span>
                  <p className="mt-0.5 text-xs text-muted">
                    Thanh toán trực tiếp cho nhân viên khi đến nhận sân
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Cột phải: Tóm tắt đơn đặt */}
        <div>
          <div className="sticky top-20 rounded-card border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-base font-bold text-ink">Tóm tắt đặt sân</h3>

            <div className="mt-4 space-y-2 border-b border-border/80 pb-4 text-xs">
              <div className="font-bold text-ink text-sm">{venueName}</div>
              <div className="text-muted">Ngày thi đấu: {date}</div>
              <div className="text-muted">Khung giờ: 18:00 – 19:30 (Sân 1)</div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính:</span>
                <span className="font-medium text-ink">{formatVND(baseTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá voucher:</span>
                  <span>-{formatVND(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-ink">
                <span>Tổng thanh toán:</span>
                <span className="text-base text-court-600">
                  {formatVND(finalTotal)}
                </span>
              </div>
            </div>

            {/* Đồng hồ đếm ngược giữ chỗ */}
            <div className="mt-4 flex items-center justify-center gap-1.5 rounded-control bg-amber-50 p-2.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Clock size={15} />
              <span>Thời gian giữ chỗ còn: 09:45</span>
            </div>

            {/* Nút gửi form */}
            <button
              type="submit"
              form="checkout-form"
              className="mt-6 flex w-full items-center justify-center rounded-control bg-racket-500 py-3 text-center text-sm font-bold text-court-900 transition hover:bg-racket-600"
            >
              Thanh toán {formatVND(finalTotal)}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Giao dịch được mã hoá bảo mật 256-bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center text-sm text-muted">
          Đang tải thông tin thanh toán...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
