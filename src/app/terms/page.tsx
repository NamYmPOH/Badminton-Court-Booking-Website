import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config/brand";
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Điều khoản sử dụng — ${BRAND.name}`,
  description: `Các quy định, quyền và nghĩa vụ khi sử dụng nền tảng đặt sân cầu lông ${BRAND.name}.`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="space-y-3 border-b border-border pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-court-50 border border-court-200 px-3 py-1 text-xs font-semibold text-court-700">
          <FileText className="h-3.5 w-3.5 text-court-600" />
          <span>Điều khoản dịch vụ</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Điều khoản sử dụng dịch vụ
        </h1>
        <p className="text-xs text-muted">
          Phiên bản có hiệu lực từ ngày: <strong>31/10/2026</strong>
        </p>
      </div>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-ink/90">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">1. Chấp thuận điều khoản</h2>
          <p className="text-muted">
            Khi truy cập, tạo tài khoản hoặc tiến hành đặt sân trên nền tảng {BRAND.name}, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản và quy định được nêu trong văn bản này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng dừng sử dụng dịch vụ.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">2. Tài khoản và Bảo mật thông tin</h2>
          <ul className="list-disc list-inside space-y-1.5 text-muted text-xs leading-relaxed">
            <li>Người dùng chịu trách nhiệm về tính chính xác của các thông tin cá nhân (họ tên, số điện thoại, email) cung cấp khi đặt sân.</li>
            <li>Người dùng có trách nhiệm tự bảo mật mật khẩu và thiết bị đăng nhập của mình, thông báo ngay cho ban quản trị nếu phát hiện dấu hiệu truy cập trái phép.</li>
            <li>Nghiêm cấm các hành vi tạo tài khoản giả mạo, spam lịch đặt sân hoặc cố ý làm gián đoạn hệ thống.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">3. Quy định sử dụng sân & Trách nhiệm tại cơ sở</h2>
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-court-600" />
              Nội quy dành cho người chơi khi nhận sân
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted leading-relaxed">
              <li><strong>Trang phục thi đấu:</strong> Sử dụng giày thể thao chuyên dụng dành cho môn cầu lông (đế cao su không để lại vết đen hoặc làm rách thảm sân).</li>
              <li><strong>Đúng giờ:</strong> Đến sân đúng khung giờ đã đặt và bàn giao sân lại cho ca tiếp theo đúng giờ kết thúc.</li>
              <li><strong>Vệ sinh chung:</strong> Giữ gìn vệ sinh khu vực sân bãi, bỏ rác đúng nơi quy định, nghiêm cấm hút thuốc lá và sử dụng chất kích thích trong khuôn viên sân thi đấu.</li>
              <li><strong>Bảo vệ cơ sở vật chất:</strong> Bồi thường thiệt hại nếu cố ý gây hỏng hóc lưới, cột, đèn chiếu sáng hoặc mặt thảm sân.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">4. Trách nhiệm của chủ sân & Ban quản lý cơ sở</h2>
          <ul className="list-disc list-inside space-y-1.5 text-muted text-xs leading-relaxed">
            <li>Bàn giao đúng sân con và đúng khung giờ người chơi đã đặt và thanh toán thành công trên hệ thống.</li>
            <li>Đảm bảo các điều kiện cơ sở vật chất tiêu chuẩn như mặt sân sạch sẽ, hệ thống chiếu sáng hoạt động tốt và các tiện ích đã công bố trên hồ sơ sân.</li>
            <li>Trong trường hợp sự cố kỹ thuật đột xuất (mất điện, sửa chữa khẩn cấp), cơ sở có trách nhiệm chủ động liên hệ người chơi để đổi giờ tương đương hoặc hoàn tiền thỏa đáng.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">5. Giới hạn trách nhiệm pháp lý của nền tảng</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 space-y-2">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Miễn trừ trách nhiệm quan trọng
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 leading-relaxed">
              <li>
                {BRAND.name} là nền tảng trung gian kết nối công nghệ và không trực tiếp quản lý vật lý các trang thiết bị tại sân đối tác.
              </li>
              <li>
                <strong>An toàn cá nhân & Chấn thương:</strong> Cầu lông là môn thể thao vận động cường độ cao. Người chơi tự đánh giá tình trạng sức khỏe và tự chịu trách nhiệm đối với các rủi ro chấn thương trong lúc thi đấu.
              </li>
              <li>
                <strong>Tài sản cá nhân:</strong> Người chơi tự bảo quản đồ đạc, tư trang cá nhân hoặc gửi tủ đồ tại cơ sở (nếu có). Nền tảng không chịu trách nhiệm trong các trường hợp thất lạc tư trang tại sân.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-base font-bold text-ink">6. Điều chỉnh & Cập nhật điều khoản</h2>
          <p className="text-xs text-muted leading-relaxed">
            {BRAND.name} có quyền điều chỉnh nội dung các điều khoản này để phù hợp với quy định pháp luật và thực tế vận hành. Mọi thay đổi sẽ được thông báo bằng việc cập nhật ngày hiệu lực trên trang này.
          </p>
        </section>
      </div>
    </div>
  );
}
