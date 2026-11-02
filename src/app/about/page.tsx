import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config/brand";
import { Sparkles, Users, Award, ShieldCheck, MapPin, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: `Về chúng tôi — ${BRAND.name}`,
  description: `Tìm hiểu về ${BRAND.name} — Nền tảng đặt sân cầu lông và quản lý cơ sở thể thao thông minh tại Việt Nam.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-court-50 border border-court-200 px-3 py-1 text-xs font-semibold text-court-700">
          <Sparkles className="h-3.5 w-3.5 text-court-600" />
          <span>Về {BRAND.name}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Nâng tầm trải nghiệm đặt sân cầu lông
        </h1>
        <p className="text-base text-muted sm:text-lg leading-relaxed">
          {BRAND.name} ra đời với mục tiêu giải quyết triệt để vấn đề tìm sân trống, trùng lịch, và quy trình thanh toán thủ công phức tạp trong phong trào cầu lông tại Việt Nam.
        </p>
      </div>

      {/* Grid sứ mệnh & giá trị cốt lõi */}
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-court-100 text-court-600 flex items-center justify-center mb-4">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-ink">Thời gian thực</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Xem chính xác trạng thái từng khung giờ 30 phút theo thời gian thực. Giữ chỗ tức thì không lo bị người khác đặt mất hoặc hẹn trùng giờ.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-court-100 text-court-600 flex items-center justify-center mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-ink">Thanh toán tự động & Minh bạch</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Hỗ trợ chuyển khoản ngân hàng quét mã QR chuẩn SePay. Tự động khớp lệnh, bảo lưu giao dịch và ghi nhận vé đặt ngay lập tức.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-court-100 text-court-600 flex items-center justify-center mb-4">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-ink">Tối ưu cho cả hai phía</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Người chơi tìm sân gần nhất nhanh chóng; Chủ sân và Nhân viên trực ca có bàn điều hành trực quan để quản lý check-in, đổi sân và doanh thu.
          </p>
        </div>
      </div>

      {/* Thông tin hoạt động */}
      <div className="mt-14 rounded-2xl border border-border bg-surface p-8">
        <h2 className="text-xl font-bold text-ink mb-4">Mô hình hoạt động & Trách nhiệm</h2>
        <div className="space-y-4 text-sm text-muted leading-relaxed">
          <p>
            {BRAND.name} đóng vai trò là sàn công nghệ kết nối người chơi có nhu cầu đặt sân với các cơ sở thể thao/câu lạc bộ cầu lông đối tác. Hệ thống cung cấp công cụ hiển thị lịch, xử lý yêu cầu giữ chỗ, thanh toán và gửi thông báo vận hành.
          </p>
          <p>
            Chất lượng cơ sở vật chất (thảm sân, ánh sáng, quạt/điều hòa, phòng tắm, tủ đồ) và việc đón tiếp người chơi tại sân do các chủ sân và ban quản lý cơ sở trực tiếp chịu trách nhiệm và đảm bảo.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-border">
          <Link
            href="/venues"
            className="inline-flex items-center gap-2 rounded-xl bg-court-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-court-700 transition"
          >
            Khám phá danh sách sân
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/guide"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-muted/5 transition"
          >
            Xem hướng dẫn đặt sân
          </Link>
        </div>
      </div>
    </div>
  );
}
