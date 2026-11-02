"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, AlertCircle, LogIn, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const token = searchParams.get("token") || "";

  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!token) {
      setError("Thiếu mã xác thực trong đường dẫn.");
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          token: token.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Xác thực email không thành công.");
      }

      setSuccess(true);
      toast.success("Xác thực địa chỉ email thành công!");
      await refreshUser();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setError(msg);
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center">
        <p className="text-xs text-muted">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  // Nếu người dùng chưa đăng nhập: Yêu cầu đăng nhập trước
  if (!user) {
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/verify-email?token=${token}`)}`;
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-card border border-border bg-surface p-8 shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-court-50 text-court-600 dark:bg-court-950">
            <LogIn size={26} />
          </div>
          <h1 className="text-base font-bold text-ink">Đăng nhập để xác nhận email</h1>
          <p className="text-xs text-muted leading-relaxed">
            Bạn cần đăng nhập vào tài khoản SmashBook để hoàn tất việc xác thực và liên kết địa chỉ
            email này.
          </p>
          <div className="pt-2">
            <Link
              href={loginUrl}
              className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-court-600 py-2.5 text-xs font-bold text-white hover:bg-court-700 transition"
            >
              <LogIn size={15} />
              <span>Đăng nhập ngay</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Khi xác thực thành công
  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-card border border-emerald-200 bg-surface p-8 shadow-sm space-y-4 dark:border-emerald-900/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-base font-bold text-ink">Xác thực Email thành công!</h1>
          <p className="text-xs text-muted leading-relaxed">
            Địa chỉ email của bạn đã được xác minh chính thức và liên kết an toàn với tài khoản SmashBook.
          </p>
          <div className="pt-2">
            <Link
              href="/account"
              className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-court-600 py-2.5 text-xs font-bold text-white hover:bg-court-700 transition"
            >
              <span>Về trang tài khoản</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Màn hình xác nhận (Bảo vệ chống Bot quét email tự động tiêu thụ token)
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="rounded-card border border-border bg-surface p-8 shadow-sm space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-court-50 text-court-600 dark:bg-court-950">
          <ShieldCheck size={28} />
        </div>

        <h1 className="text-base font-bold text-ink">Xác nhận liên kết địa chỉ Email</h1>

        <p className="text-xs text-muted leading-relaxed">
          Đang thao tác trên tài khoản: <strong className="text-ink">{user.name}</strong> ({user.phone}).
          Bấm nút bên dưới để hoàn tất việc xác thực hộp thư của bạn.
        </p>

        {error && (
          <div className="rounded-control border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2 text-left">
            <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-3 space-y-2">
          <button
            type="button"
            disabled={confirming || !token}
            onClick={handleConfirm}
            className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-court-600 py-2.5 text-xs font-bold text-white hover:bg-court-700 transition disabled:opacity-50 active:scale-95 shadow-sm"
          >
            <Mail size={15} />
            <span>{confirming ? "Đang xác thực..." : "Xác nhận liên kết email ngay"}</span>
          </button>

          <Link
            href="/account"
            className="block text-xs font-medium text-muted hover:text-ink pt-2 transition"
          >
            Quay lại trang tài khoản
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Suspense
        fallback={
          <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center">
            <p className="text-xs text-muted">Đang tải...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
