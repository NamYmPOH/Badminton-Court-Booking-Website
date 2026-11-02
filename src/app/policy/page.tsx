import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config/brand";
import { Clock, RefreshCcw, ShieldCheck, AlertCircle, HelpCircle, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: `Chính sách đặt, hủy & hoàn tiền — ${BRAND.name}`,
  description: `Quy định chi tiết về thời gian giữ chỗ, quy trình thanh toán QR, điều kiện hủy lịch và quy trình hoàn tiền trên ${BRAND.name}.`,
};

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="space-y-3 border-b border-border pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-court-50 border border-court-200 px-3 py-1 text-xs font-semibold text-court-700">
          <RefreshCcw className="h-3.5 w-3.5 text-court-600" />
          <span>Quy định & Chính sách</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Chính sách Đặt sân, Hủy lịch & Hoàn tiền
        </h1>
        <p className="text-xs text-muted">
          Phiên bản có hiệu lực từ ngày: <strong>31/10/2026</strong>
        </p>
      </div>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-ink/90">
        {/* Phần 1: Giữ chỗ & Thanh toán */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Clock className="h-5 w-5 text-court-600" />
            1. Quy tắc Giữ chỗ tạm thời (TTL) & Thanh toán
          </h2>
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <p className="text-xs text-muted leading-relaxed">
              Nhằm đảm bảo tính công bằng và tránh việc chiếm dụng khung giờ ảo, hệ thống áp dụng cơ chế khóa giờ tạm thời:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-muted leading-relaxed">
              <li>
                <strong>Thời hạn giữ chỗ (TTL):</strong> Khi bạn chọn khung giờ và bấm <em>&quot;Tiếp tục&quot;</em> đến trang thanh toán, hệ thống sẽ tạm khóa các ô giờ đã chọn trong vòng <strong>5 đến 10 phút</strong>.
              </li>
              <li>
                <strong>Xử lý khi hết hạn:</strong> Nếu quá thời gian giữ chỗ mà giao dịch chuyển khoản chưa hoàn tất, đơn sẽ tự động chuyển sang trạng thái hết hạn và các khung giờ sẽ được giải phóng ngay lập tức cho người chơi khác đặt.
              </li>
              <li>
                <strong>Khớp lệnh tự động:</strong> Khi chuyển khoản đúng cú pháp qua mã VietQR (SePay), đơn đặt sẽ được chuyển sang trạng thái <strong>Đã xác nhận (CONFIRMED)</strong> trong vòng vài giây mà không cần nhân viên duyệt thủ công.
              </li>
            </ul>
          </div>
        </section>

        {/* Phần 2: Điều kiện Hủy lịch */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-court-600" />
            2. Quy định & Điều kiện Hủy đặt sân
          </h2>
          <div className="space-y-3 text-xs text-muted leading-relaxed">
            <p>
              Quy định hủy đơn được thiết lập linh hoạt theo từng cơ sở sân đối tác nhằm bảo đảm kế hoạch vận hành của sân:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <h3 className="font-bold text-emerald-900 text-xs mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Hủy trước thời hạn quy định (Tự hủy online)
                </h3>
                <p className="text-emerald-800 leading-normal">
                  Người chơi có thể chủ động bấm <strong>&quot;Hủy đơn&quot;</strong> trong mục Chi tiết đơn đặt nếu thao tác trước thời hạn tối thiểu do sân cấu hình (thông thường trước từ <strong>12 đến 24 giờ</strong> trước giờ bắt đầu thi đấu).
                </p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <h3 className="font-bold text-rose-900 text-xs mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  Hủy sát giờ thi đấu (Dưới thời hạn quy định)
                </h3>
                <p className="text-rose-800 leading-normal">
                  Nếu yêu cầu hủy phát sinh sát giờ thi đấu, hệ thống sẽ khóa chức năng tự hủy online. Khách hàng vui lòng liên hệ trực tiếp hotline của cơ sở sân để ban quản lý trực tiếp xem xét theo tình huống cụ thể.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Phần 3: Phân biệt Yêu cầu hoàn tiền vs Đã hoàn tiền */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-court-600" />
            3. Quy trình Xử lý Hoàn tiền minh bạch
          </h2>
          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              Để đảm bảo minh bạch tài chính, quý khách lưu ý sự khác biệt rõ rệt giữa hai giai đoạn:
            </p>

            <div className="space-y-3">
              <div className="rounded-lg bg-muted/10 p-3.5 border border-border/80">
                <div className="font-semibold text-ink text-xs mb-1">
                  1. Giai đoạn: Gửi yêu cầu hoàn tiền (Refund Requested / Pending)
                </div>
                <p className="text-xs text-muted leading-normal">
                  Sau khi đơn được hủy hợp lệ, hệ thống sẽ ghi nhận yêu cầu hoàn tiền vào danh sách chờ xử lý đối soát của cơ sở. Tại thời điểm này, tiền chưa chuyển về tài khoản của bạn ngay lập tức.
                </p>
              </div>

              <div className="rounded-lg bg-court-50/70 p-3.5 border border-court-200">
                <div className="font-semibold text-court-800 text-xs mb-1">
                  2. Giai đoạn: Đã hoàn tiền thành công (Refund Completed)
                </div>
                <p className="text-xs text-court-700 leading-normal">
                  Chủ sân hoặc bộ phận kế toán sẽ thực hiện lệnh chuyển khoản hoàn tiền về số tài khoản ngân hàng của bạn. Thời gian nhận được tiền phụ thuộc vào thời gian đối soát và ngân hàng thụ hưởng (thông thường từ 1 đến 3 ngày làm việc).
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted italic">
              * Lưu ý: Tùy thuộc vào chính sách riêng của từng câu lạc bộ/cơ sở sân, một khoản phí hủy đơn hoặc phí dịch vụ cổng giao dịch có thể được khấu trừ theo quy định đã công bố tại trang thông tin sân.
            </p>
          </div>
        </section>

        {/* Phần 4: Sự cố bất khả kháng */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-ink">4. Trường hợp bất khả kháng từ phía cơ sở</h2>
          <p className="text-xs text-muted leading-relaxed">
            Trong trường hợp cơ sở thể thao buộc phải dừng hoạt động đột xuất (sự cố mất điện diện rộng, thời tiết ngập lụt, lệnh khẩn cấp từ cơ quan chức năng), cơ sở sân cam kết sẽ chủ động liên hệ người chơi để sắp xếp dời lịch thi đấu sang ngày khác hoặc thực hiện hoàn trả 100% số tiền đơn đặt của khung giờ bị ảnh hưởng.
          </p>
        </section>

        {/* Phần 5: Liên hệ */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-ink">5. Bạn cần hỗ trợ thêm về đơn đặt sân?</h2>
          <p className="text-xs text-muted leading-relaxed">
            Nếu có bất kỳ vấn đề gì về tình trạng đơn hàng hoặc thắc mắc về tiến độ hoàn tiền, bạn có thể kiểm tra danh sách đơn tại trang{" "}
            <Link href="/bookings" className="text-court-600 font-semibold underline">
              Lịch sử đặt sân
            </Link>{" "}
            hoặc liên hệ nhân viên trực quầy của cơ sở qua số điện thoại hiển thị trên vé đặt.
          </p>
        </section>
      </div>
    </div>
  );
}
