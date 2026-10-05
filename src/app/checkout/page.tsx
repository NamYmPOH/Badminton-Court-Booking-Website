"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatVND } from "@/lib/utils";
import { ArrowLeft, Clock, ShieldCheck, Tag } from "lucide-react";

import { MOCK_VENUES } from "@/services/venue.service";
import { parseSelection, formatHour, voucherDiscount } from "@/lib/booking";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const selection = ready ? parseSelection(MOCK_VENUES, searchParams) : null;
  if (!ready) return <p className="p-8">Đang tải thông tin đặt sân...</p>;
  if (!selection) return <div className="mx-auto max-w-xl p-8"><h1 className="text-xl font-bold">Lựa chọn sân không hợp lệ hoặc đã hết hạn</h1><p className="my-4">Vui lòng chọn lại sân, ngày và các ô giờ liên tiếp.</p><Link href="/venues" className="text-court-600 underline">Chọn sân</Link></div>;
  const { venue, date, slots, total: baseTotal } = selection;
  const venueName = venue.name;
  const paymentMethod = venue.paymentMode === "AT_VENUE" ? "AT_VENUE" : "VNPAY";
  const discount = voucherDiscount(appliedCode, baseTotal);
  const voucherApplied = !!appliedCode;
  const finalTotal = baseTotal - discount;
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (!["CHAOBAN10", "GIAM20K"].includes(code)) {
      setAppliedCode(""); setError("Mã ưu đãi không hợp lệ hoặc đã hết lượt."); return;
    }
    setAppliedCode(code); setError("");
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !/^(0[35789]\d{8}|\+84[35789]\d{8})$/.test(phone.replace(/\s/g, ""))) {
      setError("Nhập họ tên và số điện thoại Việt Nam hợp lệ."); return;
    }
    if (!parseSelection(MOCK_VENUES, searchParams)) {
      setError("Lựa chọn đã hết hạn. Vui lòng chọn lại giờ chơi."); return;
    }
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      const code = "DEMO-" + date.replace(/-/g, "").slice(2) + "-" + id.slice(0, 8).toUpperCase();
      sessionStorage.setItem("smashbook-demo-" + id, JSON.stringify({ code, venueId: venue.id, date, slots, voucher: appliedCode, method: paymentMethod, createdAt: new Date().toISOString() }));
      router.push("/payment/result?demo=" + id);
    } catch {
      setSubmitting(false); setError("Không lưu được kết quả thử nghiệm. Vui lòng cho phép lưu trữ trong trình duyệt rồi thử lại.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Nút quay lại */}
      <div className="mb-6">
        <Link
          href={`/venues/${venue.slug}/book`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          <span>Quay lại chọn sân</span>
        </Link>
      </div>

      <p className="mb-6 rounded-card bg-amber-50 p-4 text-sm text-amber-900">Bản thử nghiệm: chưa giữ chỗ hoặc thu tiền. Thông tin này dùng để xem trước lượt đặt sân.</p>
      {error && <p role="alert" className="mb-4 text-sm text-rose-600">{error}</p>}
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
              Nhập thông tin để kiểm tra biểu mẫu đặt sân.
            </p>

            <form onSubmit={handleSubmit} id="checkout-form" className="mt-4 space-y-4">
              <div>
                <label htmlFor="booking-name" className="block text-xs font-medium text-ink">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  id="booking-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-control border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-court-600 dark:bg-court-950/60 placeholder:text-muted/70"
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>

              <div>
                <label htmlFor="booking-phone" className="block text-xs font-medium text-ink">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-control border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-court-600 dark:bg-court-950/60 placeholder:text-muted/70"
                  placeholder="0912 345 678"
                />
              </div>

              <div>
                <label htmlFor="booking-note" className="block text-xs font-medium text-ink">
                  Ghi chú cho cơ sở (tuỳ chọn)
                </label>
                <textarea id="booking-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 w-full rounded-control border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-court-600 dark:bg-court-950/60 placeholder:text-muted/70"
                  placeholder="Ví dụ: Cần mượn thêm vợt, cần bật thêm đèn..."
                />
              </div>
            </form>
          </div>

          {/* Mã ưu đãi */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-ink">Mã ưu đãi / Voucher</h2>
            <form onSubmit={handleApplyVoucher} className="mt-3 flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-control border border-border bg-white px-3 py-2.5 text-sm dark:bg-court-950/60">
                <Tag size={16} className="text-muted" />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value); setAppliedCode(""); }}
                  placeholder="Nhập mã (thử: CHAOBAN10 hoặc GIAM20K)"
                  className="w-full bg-transparent uppercase outline-none text-ink text-xs sm:text-sm placeholder:text-muted/70"
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
            <p className="mt-4 text-sm text-ink">{paymentMethod === "AT_VENUE" ? "Trả tiền tại sân" : "VNPAY"}</p>
            <p className="mt-2 text-xs text-muted">Phương thức theo chính sách cơ sở. Chưa thực hiện giao dịch trong bản thử nghiệm.</p>
          </div>
        </div>

        {/* Cột phải: Tóm tắt đơn đặt */}
        <div>
          <div className="sticky top-20 rounded-card border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-base font-bold text-ink">Tóm tắt đặt sân</h3>

            <div className="mt-4 space-y-2 border-b border-border/80 pb-4 text-xs">
              <div className="font-bold text-ink text-sm">{venueName}</div>
              <div className="text-muted">Ngày thi đấu: {date}</div>
              <div className="text-muted">Khung giờ: {formatHour(slots[0].startMin)} – {formatHour(slots[slots.length - 1].endMin)} ({slots[0].courtName})</div>
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
              <span>Chưa giữ chỗ — bản thử nghiệm</span>
            </div>

            {/* Nút gửi form */}
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center rounded-control bg-racket-500 py-3 text-center text-sm font-bold text-court-900 transition hover:bg-racket-600"
            >
              {submitting ? "Đang xử lý..." : `Xem kết quả thử nghiệm · ${formatVND(finalTotal)}`}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Không thu tiền trong bản thử nghiệm</span>
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
