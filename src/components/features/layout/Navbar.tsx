"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Bell, User, LogIn, LogOut, Calendar, ChevronDown, Heart } from "lucide-react";
import { BRAND } from "@/lib/config/brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { NavbarSearch } from "./NavbarSearch";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { favoriteIds } = useFavorites();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tải số thông báo chưa đọc định kỳ khi đăng nhập
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let active = true;
    async function checkUnread() {
      try {
        const res = await fetch("/api/notifications?pageSize=1", { cache: "no-store" });
        const json = await res.json();
        if (active && res.ok && json.success) {
          setUnreadCount(json.unreadCount || 0);
        }
      } catch {}
    }
    void checkUnread();
    const interval = setInterval(checkUnread, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    toast.success("Đã đăng xuất thành công");
    router.push("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 hidden border-b border-border bg-surface/80 backdrop-blur-md lg:block",
        className
      )}
    >
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        {/* Logo + Brand */}
        <div className="flex items-center gap-8">
          <Link
            href={user?.role === "STAFF" ? "/venue-operations" : "/"}
            className="flex items-center gap-2 text-lg font-bold text-court-600"
          >
            {/* Biểu tượng cầu lông */}
            <span className="text-2xl">🏸</span>
            <span>{BRAND.name}</span>
            {user?.role === "STAFF" && (
              <span className="ml-1 rounded bg-court-100 px-2 py-0.5 text-xs font-semibold text-court-700 dark:bg-court-950 dark:text-court-300">
                Lễ tân / Nhân viên sân
              </span>
            )}
          </Link>

          {/* Các mục điều hướng chính */}
          <div className="flex items-center gap-1">
            {user?.role === "STAFF" ? (
              <NavLink href="/venue-operations">
                Quản lý & Bàn giao sân
              </NavLink>
            ) : (
              <>
                <NavLink href="/venues">Sân cầu lông</NavLink>
                <NavLink href="/venues?view=map">
                  <MapPin size={16} />
                  Bản đồ
                </NavLink>
                <NavLink href="/offers">Ưu đãi</NavLink>
              </>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm nhanh ở giữa (chỉ cho khách hàng & quản trị viên) */}
        {user?.role !== "STAFF" && (
          <div className="mx-6 hidden md:flex flex-1 justify-center max-w-md xl:max-w-lg">
            <NavbarSearch />
          </div>
        )}
        {user?.role === "STAFF" && <div className="flex-1" />}

        {/* Actions bên phải */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Nút Yêu thích cạnh Thông báo */}
          <Link
            href="/favorites"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-court-50 hover:text-rose-500 dark:hover:bg-surface"
            aria-label="Danh sách sân yêu thích"
            title="Sân yêu thích"
          >
            <Heart size={20} className={favoriteIds.length > 0 ? "fill-rose-500 text-rose-500" : ""} />
            {favoriteIds.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {favoriteIds.length}
              </span>
            )}
          </Link>

          <Link
            href="/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-court-50 hover:text-ink dark:hover:bg-surface"
            aria-label="Thông báo"
            title="Thông báo"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-court-600 px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Trạng thái xác thực */}
          {!isLoading && user ? (
            <div className="relative ml-2" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-court-50 dark:hover:bg-surface/80"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-court-600 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown size={14} className="text-muted" />
              </button>

              {/* Menu thả xuống */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-card border border-border bg-surface p-2 shadow-lg animate-in fade-in zoom-in-95">
                  <div className="border-b border-border/60 px-3 py-2">
                    <p className="text-xs font-bold text-ink truncate">{user.name}</p>
                    <p className="text-[11px] text-muted truncate">
                      {user.phone || user.email}
                    </p>
                    <span className="mt-1 inline-block rounded bg-court-100 px-1.5 py-0.5 text-[10px] font-semibold text-court-700 dark:bg-court-950 dark:text-court-300">
                      Vai trò: {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-semibold text-court-500 hover:bg-court-500/10"
                      >
                        Quản trị hệ thống
                      </Link>
                    )}
                    {["ADMIN", "OWNER", "STAFF"].includes(user.role) && (
                      <Link
                        href="/venue-operations"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-semibold text-court-600 hover:bg-court-50 dark:hover:bg-court-950/40"
                      >
                        Quản lý & Bàn giao sân
                      </Link>
                    )}
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-court-50 hover:text-ink dark:hover:bg-court-950/40"
                    >
                      <User size={15} />
                      Tài khoản của tôi
                    </Link>

                    {/* Chỉ hiển thị cho khách / chủ sân */}
                    {user.role !== "STAFF" && (
                      <>
                        <Link
                          href="/bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-court-50 hover:text-ink dark:hover:bg-court-950/40"
                        >
                          <Calendar size={15} />
                          Lịch đặt của tôi
                        </Link>
                        <Link
                          href="/favorites"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-court-50 hover:text-ink dark:hover:bg-court-950/40"
                        >
                          <Heart size={15} className="text-rose-500" />
                          Sân yêu thích ({favoriteIds.length})
                        </Link>
                        <Link
                          href="/venues/register"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-court-500/10"
                        >
                          Đăng ký cơ sở sân
                        </Link>
                        <Link
                          href="/coach"
                          onClick={() => setDropdownOpen(false)}
                          className="block rounded-control px-3 py-2 text-xs font-medium text-muted hover:text-ink"
                        >
                          Cổng Huấn luyện viên
                        </Link>
                        <Link
                          href="/partner"
                          onClick={() => setDropdownOpen(false)}
                          className="block rounded-control px-3 py-2 text-xs font-medium text-muted hover:text-ink"
                        >
                          Cổng Đối tác & Tài trợ
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="border-t border-border/60 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut size={15} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-2 rounded-control px-4 text-sm font-medium text-muted transition-colors hover:bg-court-50 dark:hover:bg-surface"
              >
                <LogIn size={16} />
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-control bg-court-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-court-700"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-court-50 hover:text-ink dark:hover:bg-surface"
    >
      {children}
    </Link>
  );
}
