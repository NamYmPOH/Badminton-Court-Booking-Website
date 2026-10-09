"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/config/brand";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Phone, User, Mail, Lock, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Đo độ mạnh mật khẩu (≥ 8 ký tự, có cả chữ và số per D-07)
  const hasMinLen = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordStrong = hasMinLen && hasLetter && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu nhập lại không khớp!");
      return;
    }
    if (!isPasswordStrong) {
      setErrorMsg("Mật khẩu phải từ 8 ký tự trở lên và bao gồm cả chữ và số.");
      return;
    }

    setIsLoading(true);
    const res = await registerUser({
      name,
      phone,
      password,
      email: email.trim() || undefined,
    });
    setIsLoading(false);

    if (res.success) {
      toast.success("Đăng ký tài khoản thành công! Bạn đã được đăng nhập.");
      router.push("/");
      router.refresh();
    } else {
      setErrorMsg(res.error || "Đăng ký thất bại");
      toast.error(res.error || "Đăng ký thất bại");
    }
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

        <div className="text-center">
          <span className="text-3xl">🏸</span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
            Tạo tài khoản {BRAND.name}
          </h1>
          <p className="mt-1 text-xs text-muted">
            Tham gia cộng đồng cầu lông phong trào lớn nhất
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-control border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5 text-sm focus-within:border-court-500 focus-within:ring-1 focus-within:ring-court-500">
              <Phone size={16} className="text-muted" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5 text-sm focus-within:border-court-500 focus-within:ring-1 focus-within:ring-court-500">
              <User size={16} className="text-muted" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink">
              Email (tuỳ chọn để khôi phục mật khẩu)
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5 text-sm focus-within:border-court-500 focus-within:ring-1 focus-within:ring-court-500">
              <Mail size={16} className="text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5 text-sm focus-within:border-court-500 focus-within:ring-1 focus-within:ring-court-500">
              <Lock size={16} className="text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, có chữ và số"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
              />
            </div>

            {/* Chỉ báo độ mạnh mật khẩu */}
            {password.length > 0 && (
              <div className="mt-2 flex gap-3 text-[11px]">
                <span
                  className={
                    hasMinLen ? "text-emerald-600 font-medium" : "text-muted"
                  }
                >
                  {hasMinLen ? "✓" : "○"} Tối thiểu 8 ký tự
                </span>
                <span
                  className={
                    hasLetter ? "text-emerald-600 font-medium" : "text-muted"
                  }
                >
                  {hasLetter ? "✓" : "○"} Có chữ
                </span>
                <span
                  className={
                    hasNumber ? "text-emerald-600 font-medium" : "text-muted"
                  }
                >
                  {hasNumber ? "✓" : "○"} Có số
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink">
              Nhập lại mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5 text-sm focus-within:border-court-500 focus-within:ring-1 focus-within:ring-court-500">
              <Lock size={16} className="text-muted" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-control bg-court-600 py-3 text-xs font-bold text-white transition hover:bg-court-700 disabled:opacity-50"
          >
            {isLoading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-semibold text-court-600 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
