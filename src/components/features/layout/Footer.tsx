"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/config/brand";
import { ShieldCheck, Calendar, Phone, Heart, FileText, Lock, HelpCircle } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const isOperations = pathname.startsWith("/venue-operations");

  // Với khu vực vận hành của nhân viên: footer tinh gọn, không chiếm không gian thao tác nhưng vẫn truy cập đầy đủ chính sách/hỗ trợ
  if (isOperations) {
    return (
      <footer className="border-t border-border bg-surface px-4 py-3 text-xs text-muted print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p>© 2026 {BRAND.name} · Khu vực vận hành cơ sở sân</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/guide" className="hover:text-ink transition">
              Hướng dẫn vận hành
            </Link>
            <Link href="/policy" className="hover:text-ink transition">
              Chính sách hủy & hoàn tiền
            </Link>
            <Link href="/privacy" className="hover:text-ink transition">
              Bảo mật
            </Link>
            <Link href="/terms" className="hover:text-ink transition">
              Điều khoản
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border bg-surface pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 print:hidden">
      <div className="mx-auto max-w-content px-6 pt-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-border/80">
          {/* Cột 1: Giới thiệu SmashBook */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-base font-bold text-court-600">
              <span className="text-xl">🏸</span>
              <span>{BRAND.name}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Nền tảng đặt sân cầu lông online và quản lý vận hành cơ sở theo thời gian thực. Giúp người chơi dễ dàng tìm sân trống và giúp chủ sân tối ưu công suất hiệu quả.
            </p>
            <div className="pt-1 text-[11px] text-muted">
              <span>Hệ thống thử nghiệm vận hành · Phiên bản 2026</span>
            </div>
          </div>

          {/* Cột 2: Dành cho người chơi */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Người chơi</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/venues" className="hover:text-court-600 transition">
                  Tìm sân cầu lông
                </Link>
              </li>
              <li>
                <Link href="/venues?view=map" className="hover:text-court-600 transition">
                  Bản đồ sân xung quanh
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-court-600 transition">
                  Sân đã yêu thích
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-court-600 transition">
                  Mã ưu đãi & Voucher
                </Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-court-600 transition">
                  Hướng dẫn đặt sân & thanh toán
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Dành cho đối tác & chủ sân */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Đối tác & Chủ sân</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/venues/register" className="hover:text-court-600 transition">
                  Đăng ký mở cơ sở sân
                </Link>
              </li>
              <li>
                <Link href="/venue-operations" className="hover:text-court-600 transition">
                  Cổng vận hành & Bàn giao
                </Link>
              </li>
              <li>
                <Link href="/coach" className="hover:text-court-600 transition">
                  Dành cho Huấn luyện viên
                </Link>
              </li>
              <li>
                <Link href="/partner" className="hover:text-court-600 transition">
                  Đối tác & Nhà tài trợ
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Chính sách & Pháp lý */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Chính sách & Quy định</h4>
            <ul className="space-y-2 text-xs text-muted">
              <li>
                <Link href="/policy" className="hover:text-court-600 transition">
                  Chính sách đặt, hủy & hoàn tiền
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-court-600 transition">
                  Chính sách bảo mật dữ liệu
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-court-600 transition">
                  Điều khoản sử dụng dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-court-600 transition">
                  Về chúng tôi — SmashBook
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-court-600 transition">
                  Trung tâm trợ giúp & Liên hệ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng bản quyền phía dưới */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <p>© 2026 {BRAND.name}. Tất cả các quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Cập nhật: 31/10/2026</span>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">
              Bảo mật
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">
              Điều khoản
            </Link>
            <span>•</span>
            <Link href="/policy" className="hover:underline">
              Hủy & Hoàn tiền
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
