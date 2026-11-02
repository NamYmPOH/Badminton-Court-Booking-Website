"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  Bell,
  Shield,
  LogOut,
  AlertCircle,
  LogIn,
  Edit3,
  Check,
  X,
  CheckCircle2,
  Clock,
  Send,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ProfileResponse {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  emailVerified: string | null;
  role: string;
  status: string;
  loyaltyPoints: number;
  image: string | null;
  pendingEmail: string | null;
  pendingEmailExpires: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, logout, refreshUser } = useAuth();

  // State thông tin chi tiết từ server
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Chế độ chỉnh sửa thông tin cá nhân
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editImage, setEditImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Quản lý email & xác thực email
  const [emailInput, setEmailInput] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [previewVerifyUrl, setPreviewVerifyUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/auth/profile", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setProfile(json.data);
        setEditName(json.data.name || "");
        setEditPhone(json.data.phone || "");
        setEditImage(json.data.image || "");
      }
    } catch (err) {
      console.error("Lỗi tải thông tin tài khoản:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      void fetchProfile();
    }
  }, [isLoading, user, router, fetchProfile]);

  // Bộ đếm lùi thời gian chờ gửi lại email (cooldown)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleStartEdit = () => {
    if (profile) {
      setEditName(profile.name || "");
      setEditPhone(profile.phone || "");
      setEditImage(profile.image || "");
      setEditError(null);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditName(profile.name || "");
      setEditPhone(profile.phone || "");
      setEditImage(profile.image || "");
    }
    setEditError(null);
    setIsEditing(false);
  };

  // Lưu thông tin cá nhân (Họ tên, SĐT, Ảnh)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setEditError(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          image: editImage.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Cập nhật thông tin thất bại.");
      }

      toast.success("Đã cập nhật thông tin cá nhân thành công!");
      setIsEditing(false);
      await fetchProfile();
      await refreshUser();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setEditError(msg);
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Gửi email xác thực
  const handleSendVerification = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim();
    if (!cleanEmail) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setSendingEmail(true);
    setPreviewVerifyUrl(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          email: cleanEmail,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Không thể gửi email xác thực.");
      }

      toast.success(json.message || "Đã gửi email xác thực.");
      if (json.cooldownSeconds) {
        setCooldown(json.cooldownSeconds);
      }
      if (json.previewUrl) {
        setPreviewVerifyUrl(json.previewUrl);
      }
      setEmailInput("");
      setIsChangingEmail(false);
      await fetchProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi khi gửi email.";
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  // Hủy yêu cầu xác thực email đang chờ
  const handleCancelPendingEmail = async () => {
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.info("Đã hủy yêu cầu xác thực email.");
        setPreviewVerifyUrl(null);
        await fetchProfile();
      }
    } catch {
      toast.error("Không thể hủy yêu cầu xác thực.");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất tài khoản thành công.");
    router.push("/");
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-court-600 border-t-transparent" />
          <p className="mt-2 text-xs text-muted">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted">Vui lòng đăng nhập để xem thông tin tài khoản.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-control bg-court-600 px-4 py-2 text-xs font-bold text-white hover:bg-court-700"
        >
          <LogIn size={16} />
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  // Xác định 4 trạng thái email:
  // 1. Chưa thêm email: !profile.email && !profile.pendingEmail
  // 2. Chưa xác thực: profile.email && !profile.emailVerified && !profile.pendingEmail
  // 3. Đang chờ xác thực email mới: profile.pendingEmail != null
  // 4. Đã xác thực: profile.email && profile.emailVerified && !profile.pendingEmail
  const isPendingNewEmail = Boolean(profile.pendingEmail);
  const isVerified = Boolean(profile.email && profile.emailVerified && !isPendingNewEmail);
  const isUnverified = Boolean(profile.email && !profile.emailVerified && !isPendingNewEmail);
  const isNoEmail = Boolean(!profile.email && !isPendingNewEmail);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Tiêu đề & Lối tắt */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Tài khoản của tôi
          </h1>
          <p className="mt-1 text-xs text-muted">
            Quản lý hồ sơ cá nhân và bảo mật tài khoản SmashBook
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-control bg-court-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-700 transition"
            >
              Quản trị hệ thống
            </Link>
          )}
          {["ADMIN", "OWNER"].includes(user.role) && (
            <Link
              href="/venue-operations"
              className="rounded-control border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-court-50 transition"
            >
              Vận hành sân
            </Link>
          )}
        </div>
      </div>

      {/* 1. Thẻ thông tin cá nhân & Chế độ Chỉnh sửa */}
      <div className="mt-6 rounded-card border border-border bg-surface p-6 shadow-xs relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-court-200 bg-court-100 dark:border-court-900 dark:bg-court-950 flex items-center justify-center text-court-700 dark:text-court-300 shrink-0">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <User size={30} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink">{profile.name}</h2>
                <span className="rounded bg-court-100 px-2 py-0.5 text-[10px] font-bold text-court-800 dark:bg-court-950 dark:text-court-300">
                  {profile.role === "ADMIN"
                    ? "Quản trị viên"
                    : profile.role === "OWNER"
                    ? "Chủ sân"
                    : profile.role === "STAFF"
                    ? "Nhân viên"
                    : "Hội viên"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Điểm tích lũy: <strong className="text-court-600">{profile.loyaltyPoints}</strong> điểm
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 rounded-control border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-ink hover:border-court-400 hover:text-court-600 transition"
            >
              <Edit3 size={13} />
              <span>Chỉnh sửa thông tin</span>
            </button>
          )}
        </div>

        {/* Chế độ Chỉnh sửa thông tin cá nhân */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-5 border-t border-border space-y-4">
            <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Edit3 size={14} className="text-court-600" />
              Chỉnh sửa hồ sơ cá nhân
            </h3>

            {editError && (
              <div className="rounded-control border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-control border border-border bg-bg px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full rounded-control border border-border bg-bg px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
                placeholder="VD: 0912345678"
              />
              <p className="mt-1 text-[10px] text-muted">
                Số điện thoại dùng để đăng nhập và nhận thông tin xác nhận đặt sân
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Đường dẫn ảnh đại diện (URL)
              </label>
              <input
                type="url"
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                className="w-full rounded-control border border-border bg-bg px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingProfile}
                className="inline-flex items-center gap-1 rounded-control border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
              >
                <X size={14} />
                <span>Hủy bỏ</span>
              </button>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-court-700 disabled:opacity-50 transition"
              >
                <Check size={14} />
                <span>{savingProfile ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-3 divide-y divide-border/60 text-xs">
            <div className="flex items-center justify-between pt-2">
              <span className="flex items-center gap-2 text-muted">
                <Phone size={14} className="text-court-500" />
                Số điện thoại
              </span>
              <span className="font-semibold text-ink">{profile.phone}</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="flex items-center gap-2 text-muted">
                <Mail size={14} className="text-court-500" />
                Địa chỉ Email
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">
                  {profile.email || "Chưa thiết lập"}
                </span>
                {isVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    Đã xác thực
                  </span>
                )}
                {isUnverified && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Chưa xác thực
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Khu vực Quản lý & Xác thực Email (4 trạng thái nghiệp vụ chuẩn xác) */}
      <div className="mt-6 rounded-card border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-court-600" />
            <div>
              <h3 className="text-sm font-bold text-ink">Xác thực & Liên kết Email</h3>
              <p className="text-[11px] text-muted">
                Dùng nhận vé điện tử, hóa đơn thanh toán và khôi phục tài khoản
              </p>
            </div>
          </div>

          {/* Badge trạng thái */}
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck size={13} />
              Đã xác thực
            </span>
          )}
          {isPendingNewEmail && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Clock size={13} />
              Chờ xác nhận email mới
            </span>
          )}
          {isUnverified && (
            <span className="rounded bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              Chưa xác thực
            </span>
          )}
        </div>

        {/* Trạng thái 1: Chưa thêm email */}
        {isNoEmail && !isChangingEmail && (
          <div className="rounded-control border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Chưa liên kết email khôi phục</p>
                <p className="mt-0.5 text-[11px] text-amber-800/90 dark:text-amber-400">
                  Thêm email để nhận thông báo đặt sân và khôi phục mật khẩu khi cần thiết.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsChangingEmail(true)}
              className="shrink-0 rounded-control bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
            >
              Thêm email ngay
            </button>
          </div>
        )}

        {/* Trạng thái 2: Chưa xác thực (đã có email nhưng chưa xác nhận) */}
        {isUnverified && !isChangingEmail && (
          <div className="rounded-control border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Địa chỉ {profile.email} chưa được xác thực</p>
                <p className="mt-0.5 text-[11px] text-amber-800/90 dark:text-amber-400">
                  Vui lòng bấm gửi thư xác thực để hoàn tất liên kết hộp thư này vào tài khoản của bạn.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={sendingEmail || cooldown > 0}
                onClick={() => handleSendVerification(profile.email!)}
                className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-court-700 transition disabled:opacity-50"
              >
                <Send size={13} />
                <span>
                  {sendingEmail
                    ? "Đang gửi thư..."
                    : cooldown > 0
                    ? `Gửi lại sau (${cooldown}s)`
                    : "Gửi email xác thực"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangingEmail(true)}
                className="rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink transition"
              >
                Đổi sang email khác
              </button>
            </div>
          </div>
        )}

        {/* Trạng thái 3: Đang chờ xác thực email mới */}
        {isPendingNewEmail && (
          <div className="rounded-control border border-court-300 bg-court-50/70 p-4 text-xs text-court-950 dark:border-court-800 dark:bg-court-950/40 dark:text-court-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <Clock size={17} className="text-court-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Đang chờ xác minh địa chỉ:{" "}
                  <span className="text-court-700 underline dark:text-court-300 font-mono">
                    {profile.pendingEmail}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {profile.email
                    ? `Email hiện tại (${profile.email}) vẫn hoạt động bình thường cho tới khi email mới được xác thực thành công.`
                    : "Một email xác nhận đã được gửi đi. Vui lòng mở hộp thư và nhấn xác nhận."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={sendingEmail || cooldown > 0}
                onClick={() => handleSendVerification(profile.pendingEmail!)}
                className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-court-700 transition disabled:opacity-50"
              >
                <Send size={13} />
                <span>
                  {sendingEmail
                    ? "Đang gửi lại..."
                    : cooldown > 0
                    ? `Gửi lại sau (${cooldown}s)`
                    : "Gửi lại email xác thực"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCancelPendingEmail}
                className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                <X size={13} />
                <span>Hủy yêu cầu đổi</span>
              </button>
            </div>
          </div>
        )}

        {/* Trạng thái 4: Đã xác thực */}
        {isVerified && !isChangingEmail && (
          <div className="rounded-control border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Hộp thư đã được bảo vệ & xác thực</p>
                <p className="mt-0.5 text-[11px] text-emerald-800/80 dark:text-emerald-300">
                  Địa chỉ <strong>{profile.email}</strong> đã xác minh quyền sở hữu chính thức.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsChangingEmail(true)}
              className="shrink-0 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink transition"
            >
              Đổi địa chỉ email
            </button>
          </div>
        )}

        {/* Form nhập email khi Thêm mới hoặc Đổi email */}
        {isChangingEmail && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendVerification(emailInput);
            }}
            className="rounded-control border border-border bg-bg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink">
                {profile.email ? "Đổi sang địa chỉ email mới" : "Thêm địa chỉ email"}
              </label>
              <button
                type="button"
                onClick={() => setIsChangingEmail(false)}
                className="text-muted hover:text-ink text-xs"
              >
                Đóng
              </button>
            </div>

            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="VD: vidu@gmail.com"
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-court-500"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsChangingEmail(false)}
                className="rounded-control border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={sendingEmail || !emailInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-control bg-court-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-court-700 disabled:opacity-50 transition"
              >
                <Send size={13} />
                <span>{sendingEmail ? "Đang gửi..." : "Gửi email xác thực"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Thông báo URL xác thực Preview trong môi trường dev nếu chưa có RESEND_API_KEY */}
        {previewVerifyUrl && (
          <div className="rounded-control border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              Liên kết xác nhận kiểm thử (Môi trường Dev):
            </p>
            <p className="text-[11px] text-muted break-all font-mono bg-white dark:bg-black/30 p-2 rounded">
              {previewVerifyUrl}
            </p>
            <div className="pt-1">
              <Link
                href={previewVerifyUrl}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Mở liên kết xác nhận ngay →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 3. Lối tắt quản lý & Đăng xuất */}
      <div className="mt-6 rounded-card border border-border bg-surface divide-y divide-border/60 text-sm">
        {["ADMIN", "OWNER", "STAFF"].includes(user.role) && (
          <Link
            href="/venue-operations"
            className="flex items-center justify-between p-4 transition hover:bg-court-50/50"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-court-600" />
              <span className="font-medium text-ink">Quản lý đơn tại sân</span>
            </div>
            <span className="text-xs text-muted">Vận hành →</span>
          </Link>
        )}

        <Link
          href="/bookings"
          className="flex items-center justify-between p-4 transition hover:bg-court-50/50"
        >
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-court-600" />
            <span className="font-medium text-ink">Lịch đặt sân của tôi</span>
          </div>
          <span className="text-xs text-muted">Xem chi tiết →</span>
        </Link>

        <Link
          href="/favorites"
          className="flex items-center justify-between p-4 transition hover:bg-court-50/50"
        >
          <div className="flex items-center gap-3">
            <Heart size={18} className="text-rose-500" />
            <span className="font-medium text-ink">Sân yêu thích</span>
          </div>
          <span className="text-xs text-muted">Xem danh sách →</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-between p-4 text-left text-rose-600 transition hover:bg-rose-50/50"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} />
            <span className="font-medium">Đăng xuất tài khoản</span>
          </div>
        </button>
      </div>
    </div>
  );
}
