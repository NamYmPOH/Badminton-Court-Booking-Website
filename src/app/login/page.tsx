"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/config/brand";
import { ArrowLeft, Phone, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Giả lập đăng nhập thành công sau 600ms
    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 600);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-lg sm:p-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </Link>

        {/* Brand logo & tiêu đề */}
        <div className="text-center">
          <span className="text-3xl">🏸</span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
            Đăng nhập vào {BRAND.name}
          </h1>
          <p className="mt-1 text-xs text-muted">
            Đặt lịch thi đấu nhanh chóng, quản lý lịch trình thuận tiện
          </p>
        </div>

        {/* Tabs chọn Số điện thoại / Email per §1.3 */}
        <div className="mt-6 flex rounded-control border border-border bg-court-50/50 p-1 dark:bg-court-950/40">
          <button
            type="button"
            onClick={() => setTab("phone")}
            className={`flex-1 rounded-control py-2 text-xs font-semibold transition ${
              tab === "phone"
                ? "bg-surface text-court-600 shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Số điện thoại
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`flex-1 rounded-control py-2 text-xs font-semibold transition ${
              tab === "email"
                ? "bg-surface text-court-600 shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Email
          </button>
        </div>

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink">
              {tab === "phone" ? "Số điện thoại" : "Địa chỉ Email"}
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2 text-sm dark:bg-court-950/40">
              {tab === "phone" ? (
                <Phone size={16} className="text-muted" />
              ) : (
                <Mail size={16} className="text-muted" />
              )}
              <input
                type={tab === "phone" ? "tel" : "email"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  tab === "phone" ? "0912 345 678" : "ten@gmail.com"
                }
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-ink">
                Mật khẩu
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Vui lòng liên hệ ban quản trị hoặc kiểm tra email nếu bạn đã liên kết email khôi phục.");
                }}
                className="text-xs text-court-600 hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-control border border-border bg-white px-3 py-2 text-sm dark:bg-court-950/40">
              <Lock size={16} className="text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-control bg-court-600 py-3 text-xs font-bold text-white transition hover:bg-court-700 disabled:opacity-50"
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        {/* Chuyển sang đăng ký */}
        <p className="mt-6 text-center text-xs text-muted">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-court-600 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
