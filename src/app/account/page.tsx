"use client";

import Link from "next/link";
import { User, Mail, Phone, Calendar, Heart, Bell, Shield, LogOut, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function AccountPage() {
  const [emailLinked, setEmailLinked] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleLinkEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setEmailLinked(true);
      setShowEmailModal(false);
      alert("Đã liên kết email thành công! Bạn có thể dùng email này để đăng nhập và khôi phục mật khẩu.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Tài khoản của tôi
      </h1>
      <p className="mt-1 text-sm text-muted">
        Quản lý thông tin cá nhân và bảo mật tài khoản
      </p>

      {/* Banner liên kết email để khôi phục mật khẩu (§1.3 & D-08) */}
      {!emailLinked && (
        <div className="mt-6 flex flex-col gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Chưa liên kết email khôi phục
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-400">
                Thêm email để nhận thông báo đặt sân và khôi phục mật khẩu khi cần thiết.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="shrink-0 rounded-control bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
          >
            Thêm email
          </button>
        </div>
      )}

      {/* Modal nhập email */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-base font-bold text-ink">Liên kết địa chỉ Email</h3>
            <p className="mt-1 text-xs text-muted">
              Nhập email để nhận vé điện tử và lấy lại mật khẩu nếu bị quên
            </p>
            <form onSubmit={handleLinkEmail} className="mt-4 space-y-4">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="vidu@gmail.com"
                className="w-full rounded-control border border-border bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-court-600 dark:bg-court-950/50"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="rounded-control border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-court-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="rounded-control bg-court-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-court-700"
                >
                  Lưu email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thẻ thông tin cá nhân */}
      <div className="mt-6 rounded-card border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-court-100 text-court-700 dark:bg-court-900/60 dark:text-court-300">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Nguyễn Văn Nam</h2>
            <p className="text-xs text-muted">Hội viên Bạc • 120 điểm thưởng</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 divide-y divide-border/60 text-xs">
          <div className="flex items-center justify-between pt-2">
            <span className="flex items-center gap-2 text-muted">
              <Phone size={14} className="text-court-500" />
              Số điện thoại
            </span>
            <span className="font-semibold text-ink">0912 345 678</span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="flex items-center gap-2 text-muted">
              <Mail size={14} className="text-court-500" />
              Email
            </span>
            <span className="font-semibold text-ink">
              {emailLinked ? emailInput : "Chưa liên kết"}
            </span>
          </div>
        </div>
      </div>

      {/* Lối tắt quản lý */}
      <div className="mt-6 rounded-card border border-border bg-surface divide-y divide-border/60 text-sm">
        <Link
          href="/bookings"
          className="flex items-center justify-between p-4 transition hover:bg-court-50/50"
        >
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-court-600" />
            <span className="font-medium text-ink">Lịch của tôi</span>
          </div>
          <span className="text-xs text-muted">›</span>
        </Link>

        <Link
          href="/notifications"
          className="flex items-center justify-between p-4 transition hover:bg-court-50/50"
        >
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-court-600" />
            <span className="font-medium text-ink">Thông báo hệ thống</span>
          </div>
          <span className="text-xs text-muted">›</span>
        </Link>

        <Link
          href="/venues"
          className="flex items-center justify-between p-4 transition hover:bg-court-50/50"
        >
          <div className="flex items-center gap-3">
            <Heart size={18} className="text-court-600" />
            <span className="font-medium text-ink">Sân bãi yêu thích</span>
          </div>
          <span className="text-xs text-muted">›</span>
        </Link>
      </div>

      {/* Nút đăng xuất */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => alert("Đã đăng xuất tài khoản thành công.")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline"
        >
          <LogOut size={14} />
          <span>Đăng xuất tài khoản</span>
        </button>
      </div>
    </div>
  );
}
