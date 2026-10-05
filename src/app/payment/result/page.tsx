"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MOCK_VENUES } from "@/services/venue.service";
import { parseSelection, formatHour, voucherDiscount } from "@/lib/booking";
import { formatVND } from "@/lib/utils";

type Result = NonNullable<ReturnType<typeof parseSelection>> & { code: string; method: string; discount: number };
function PaymentResultContent() {
  const params = useSearchParams();
  const id = params.get("demo");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setResult(null);
    try {
      const saved = JSON.parse(sessionStorage.getItem("smashbook-demo-" + id) || "null");
      if (saved && typeof saved.code === "string" && typeof saved.voucher === "string" && Number.isFinite(Date.parse(saved.createdAt))) {
        const selection = parseSelection(MOCK_VENUES, new URLSearchParams({ venueId: saved.venueId, date: saved.date, slots: JSON.stringify(saved.slots) }), new Date(saved.createdAt));
        if (selection) setResult({ ...selection, code: saved.code, method: selection.venue.paymentMode === "AT_VENUE" ? "Trả tại sân" : "VNPAY", discount: voucherDiscount(saved.voucher, selection.total) });
      }
    } catch { /* Missing or corrupted session data cannot confirm a booking. */ }
    setLoading(false);
  }, [id]);
  if (loading) return <p className="p-8">Đang tải kết quả...</p>;
  if (!result) return <div className="mx-auto max-w-xl p-8"><h1 className="text-xl font-bold">Không tìm thấy kết quả đặt sân</h1><p className="my-4">Vui lòng bắt đầu từ bước chọn sân. Liên kết này không xác nhận thanh toán.</p><Link href="/venues" className="text-court-600 underline">Chọn sân</Link></div>;
  const { venue, date, slots, total, discount, code, method } = result;
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-card border border-border bg-surface p-6 shadow-md sm:p-8">
        <h1 className="text-2xl font-bold text-ink">Kết quả đặt sân thử nghiệm</h1>
        <p className="mt-4 rounded-control bg-amber-50 p-3 text-sm text-amber-900">Chưa giữ chỗ, chưa thanh toán. Kết quả này chỉ được lưu trong phiên trình duyệt và không dùng để nhận sân.</p>
        <dl className="mt-6 space-y-4 text-sm">
          <div><dt className="text-muted">Mã thử nghiệm</dt><dd className="font-mono font-bold">{code}</dd></div>
          <div><dt className="text-muted">Cơ sở</dt><dd>{venue.name}</dd></div>
          <div><dt className="text-muted">Ngày thi đấu</dt><dd>{date}</dd></div>
          <div><dt className="text-muted">Khung giờ</dt><dd>{formatHour(slots[0].startMin)} – {formatHour(slots[slots.length - 1].endMin)}</dd></div>
          <div><dt className="text-muted">Sân đấu</dt><dd>{slots[0].courtName}</dd></div>
          <div><dt className="text-muted">Phương thức dự kiến</dt><dd>{method} (chưa thanh toán)</dd></div>
          <div><dt className="text-muted">Tạm tính</dt><dd>{formatVND(total)}</dd></div>
          {discount > 0 && <div><dt className="text-muted">Giảm giá</dt><dd>{formatVND(discount)}</dd></div>}
          <div className="border-t border-border pt-4 font-bold"><dt>Tổng tiền dự kiến</dt><dd className="text-court-600">{formatVND(total - discount)}</dd></div>
        </dl>
        <Link href={`/venues/${venue.slug}/book`} className="mt-6 block rounded-control bg-court-600 p-3 text-center text-sm font-bold text-white">Chọn lịch khác</Link>
        <Link href="/" className="mt-4 block text-center text-sm text-court-600">Về trang chủ</Link>
      </div>
    </div>
  );
}
export default function PaymentResultPage() {
  return <Suspense fallback={<p className="p-8">Đang tải kết quả...</p>}><PaymentResultContent /></Suspense>;
}
