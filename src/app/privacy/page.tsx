import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config/brand";
import { ShieldCheck, Lock, Eye, Database, Server, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: `Chính sách bảo mật — ${BRAND.name}`,
  description: `Chính sách bảo mật thông tin cá nhân và dữ liệu người dùng tại ${BRAND.name}.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="space-y-3 border-b border-border pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-court-50 border border-court-200 px-3 py-1 text-xs font-semibold text-court-700">
          <ShieldCheck className="h-3.5 w-3.5 text-court-600" />
          <span>Chính sách bảo mật</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Chính sách bảo mật thông tin
        </h1>
        <p className="text-xs text-muted">
          Phiên bản có hiệu lực từ ngày: <strong>31/10/2026</strong>
        </p>
      </div>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-ink/90">
        {/* Phần 1: Giới thiệu */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            1. Nguyên tắc cam kết bảo mật
          </h2>
          <p className="text-muted">
            {BRAND.name} cam kết tôn trọng quyền riêng tư và bảo vệ thông tin cá nhân của người dùng. Chính sách này minh bạch hóa các loại dữ liệu hệ thống thực tế thu thập, mục đích sử dụng, phạm vi chia sẻ cần thiết và các quyền kiểm soát dữ liệu của bạn.
          </p>
        </section>

        {/* Phần 2: Dữ liệu thực tế thu thập */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            2. Các loại dữ liệu hệ thống thực tế thu thập
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-court-600" />
                Thông tin tài khoản đăng ký
              </h3>
              <p className="text-xs text-muted leading-normal">
                Họ và tên, địa chỉ email, số điện thoại liên lạc. Mật khẩu được mã hóa an toàn bằng thuật toán băm một chiều (bcrypt hash) trước khi lưu vào cơ sở dữ liệu.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-court-600" />
                Dữ liệu đặt sân & Giao dịch
              </h3>
              <p className="text-xs text-muted leading-normal">
                Chi tiết sân con, ngày chơi, khung giờ (30 phút/ô), mã định danh đơn đặt, giá trị thanh toán và mã tham chiếu đối soát tự động qua cổng SePay/ngân hàng.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-court-600" />
                Bộ nhớ trình duyệt & Cookie
              </h3>
              <p className="text-xs text-muted leading-normal">
                Cookie phiên làm việc bảo mật (NextAuth session) phục vụ duy trì đăng nhập. Với khách chưa đăng nhập, danh sách cơ sở yêu thích được lưu cục bộ trên thiết bị qua localStorage.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Server className="h-4 w-4 text-court-600" />
                Dữ liệu lưu lượng ẩn danh
              </h3>
              <p className="text-xs text-muted leading-normal">
                Vercel Web Analytics được tích hợp để thống kê lượt truy cập và hiệu năng tải trang ở dạng tổng hợp ẩn danh, hoàn toàn không theo dõi thông tin định danh cá nhân người dùng.
              </p>
            </div>
          </div>
        </section>

        {/* Phần 3: Mục đích sử dụng */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">3. Mục đích sử dụng thông tin</h2>
          <ul className="list-disc list-inside space-y-1.5 text-muted text-xs leading-relaxed">
            <li>Xác thực quyền truy cập và duy trì trạng thái đăng nhập tài khoản.</li>
            <li>Xử lý việc giữ chỗ khung giờ, tạo vé đặt sân và đối soát trạng thái chuyển khoản tự động.</li>
            <li>Gửi thông báo vận hành liên quan trực tiếp đến đơn đặt sân (xác nhận thành công, hủy lịch, đổi ca trực, sự cố đột xuất).</li>
            <li>Ngăn chặn các hành vi giữ chỗ ảo, gian lận thanh toán hoặc spam lịch thi đấu.</li>
          </ul>
        </section>

        {/* Phần 4: Chia sẻ thông tin */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">4. Phạm vi chia sẻ dữ liệu với bên thứ ba</h2>
          <p className="text-muted">
            {BRAND.name} không bán, cho thuê hoặc phát tán dữ liệu người dùng cho bất kỳ bên thứ ba nào vì mục đích quảng cáo thương mại. Dữ liệu chỉ được chia sẻ trong phạm vi cần thiết kỹ thuật và vận hành:
          </p>
          <div className="space-y-2 rounded-xl bg-surface border border-border p-4 text-xs text-muted">
            <p>
              <strong>• Với cơ sở sân thể thao được đặt:</strong> Tên người đặt, số điện thoại và thông tin giờ đặt được cung cấp cho ban quản lý/nhân viên trực ca của đúng sân đó để làm thủ tục đối chiếu nhận sân. Cơ sở sân khác không thể xem thông tin này.
            </p>
            <p>
              <strong>• Với nhà cung cấp giải pháp thanh toán:</strong> Mã đơn và giá trị giao dịch được chuyển tới hạ tầng cổng thanh toán SePay / hệ thống ngân hàng nhằm đối chiếu mã chuyển khoản VietQR tự động.
            </p>
            <p>
              <strong>• Theo yêu cầu pháp lý:</strong> Cung cấp thông tin khi có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền theo quy định của pháp luật Việt Nam.
            </p>
          </div>
        </section>

        {/* Phần 5: Quyền người dùng */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">5. Quyền lợi và kiểm soát dữ liệu của người dùng</h2>
          <p className="text-muted">
            Bạn có đầy đủ các quyền theo quy định bảo vệ dữ liệu cá nhân:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-muted text-xs leading-relaxed">
            <li>
              Xem và cập nhật thông tin cá nhân (họ tên, số điện thoại) bất kỳ lúc nào tại mục{" "}
              <Link href="/account" className="text-court-600 font-semibold underline">
                Hồ sơ tài khoản
              </Link>.
            </li>
            <li>
              Quản lý danh sách sân yêu thích trực tiếp tại trang{" "}
              <Link href="/favorites" className="text-court-600 font-semibold underline">
                Sân yêu thích
              </Link>.
            </li>
            <li>
              Yêu cầu trích xuất lịch sử hoặc yêu cầu vô hiệu hóa/xóa tài khoản cá nhân khỏi hệ thống bằng cách gửi yêu cầu qua kênh hỗ trợ tài khoản.
            </li>
          </ul>
        </section>

        {/* Phần 6: Bảo mật và liên hệ */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-ink">6. Bảo vệ an toàn & Liên hệ hỗ trợ</h2>
          <p className="text-xs text-muted leading-relaxed">
            Chúng tôi áp dụng giao thức mã hóa HTTPS/TLS trên toàn bộ kết nối. Để bảo đảm an toàn, bạn vui lòng không chia sẻ mật khẩu tài khoản cho người khác và đăng xuất khỏi trình duyệt sau khi sử dụng trên thiết bị dùng chung.
          </p>
          <div className="pt-2 text-xs text-ink">
            Nếu có thắc mắc hoặc yêu cầu liên quan đến chính sách bảo vệ dữ liệu, vui lòng truy cập{" "}
            <Link href="/account" className="text-court-600 font-semibold hover:underline">
              Trung tâm hỗ trợ SmashBook
            </Link>.
          </div>
        </section>
      </div>
    </div>
  );
}
