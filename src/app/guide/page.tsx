import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config/brand";
import { Calendar, CheckCircle2, Clock, CreditCard, MapPin, QrCode, Search, Share2, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: `Hướng dẫn đặt sân — ${BRAND.name}`,
  description: `Hướng dẫn chi tiết từng bước đặt sân cầu lông online, thanh toán QR tự động và check-in tại sân với ${BRAND.name}.`,
};

export default function GuidePage() {
  const steps = [
    {
      step: 1,
      title: "Tìm kiếm cơ sở sân",
      icon: Search,
      desc: "Truy cập danh sách sân hoặc chế độ bản đồ. Bạn có thể lọc theo quận/huyện, mức giá hoặc các tiện ích cần thiết như máy lạnh/điều hòa, bãi xe ô tô, phòng tắm, thuê vợt.",
    },
    {
      step: 2,
      title: "Chọn ngày & Khung giờ chơi",
      icon: Calendar,
      desc: "Vào trang chi tiết của sân và bấm 'Xem lịch & đặt sân'. Bảng chọn giờ được chia theo từng ô 30 phút. Bạn có thể chọn một hoặc nhiều ô liên tiếp trên cùng sân con mong muốn.",
    },
    {
      step: 3,
      title: "Tạm giữ chỗ an toàn (TTL 5–10 phút)",
      icon: Clock,
      desc: "Khi bấm 'Tiếp tục', hệ thống sẽ tạm khóa khung giờ bạn vừa chọn trong 5 đến 10 phút để người khác không thể đặt trùng trong lúc bạn tiến hành thanh toán.",
    },
    {
      step: 4,
      title: "Quét mã QR thanh toán tức thì",
      icon: QrCode,
      desc: "Mở ứng dụng ngân hàng và quét mã VietQR hiển thị trên màn hình. Nội dung chuyển khoản và số tiền đã được điền tự động. Hệ thống đối soát SePay sẽ kích hoạt vé ngay khi giao dịch thành công.",
    },
    {
      step: 5,
      title: "Nhận sân & Check-in",
      icon: CheckCircle2,
      desc: "Đến cơ sở trước 5–10 phút so với giờ bắt đầu. Mở trang vé đơn đặt hoặc cung cấp mã đặt sân/số điện thoại cho nhân viên trực quầy để nhận sân và bắt đầu trận đấu.",
    },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Hướng dẫn đặt sân & Sử dụng dịch vụ
        </h1>
        <p className="text-base text-muted sm:text-lg">
          Quy trình 5 bước đơn giản để tìm sân trống, thanh toán tự động và vào sân thi đấu trong tích tắc.
        </p>
      </div>

      {/* Các bước */}
      <div className="mt-12 space-y-6 max-w-3xl mx-auto">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="flex flex-col sm:flex-row gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm hover:border-court-300 transition"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-court-600 text-white font-bold text-lg shadow-sm">
                {item.step}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-court-600" />
                  <h2 className="text-lg font-bold text-ink">{item.title}</h2>
                </div>
                <p className="text-sm text-muted leading-relaxed pt-1">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lưu ý quan trọng */}
      <div className="mt-12 max-w-3xl mx-auto rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-amber-900">Lưu ý khi thanh toán và giữ chỗ</h3>
            <ul className="list-disc list-inside text-xs text-amber-800 space-y-1.5 leading-relaxed">
              <li>
                <strong>Nội dung chuyển khoản:</strong> Vui lòng giữ nguyên mã giao dịch trong nội dung chuyển khoản để hệ thống đối soát tự động xử lý ngay lập tức.
              </li>
              <li>
                <strong>Hết thời hạn giữ chỗ:</strong> Nếu quá thời gian giữ chỗ (5–10 phút) mà hệ thống chưa nhận được thông báo chuyển tiền từ ngân hàng, khung giờ sẽ tự động giải phóng cho người khác đặt.
              </li>
              <li>
                <strong>Đúng số tiền:</strong> Vui lòng chuyển chính xác số tiền được hiển thị (bao gồm cả mã giảm giá nếu có) để tránh đơn bị treo xác thực.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/venues"
          className="inline-flex items-center gap-2 rounded-xl bg-court-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-court-700 transition"
        >
          Đặt sân ngay hôm nay
        </Link>
      </div>
    </div>
  );
}
