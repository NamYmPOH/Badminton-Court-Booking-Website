"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Bell, User, LogIn, LogOut, Calendar, ChevronDown } from "lucide-react";
import { BRAND } from "@/lib/config/brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-court-600"
          >
            {/* Biểu tượng cầu lông */}
            <span className="text-2xl">🏸</span>
            <span>{BRAND.name}</span>
          </Link>

          {/* Các mục điều hướng chính */}
          <div className="flex items-center gap-1">
            <NavLink href="/venues">Sân cầu lông</NavLink>
            <NavLink href="/venues?view=map">
              <MapPin size={16} />
              Bản đồ
            </NavLink>
          </div>
        </div>

        {/* Actions bên phải */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          <Link
            href="/notifications"
            className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-court-50 dark:hover:bg-surface"
            aria-label="Thông báo"
          >
            <Bell size={20} />
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
                  </div>

                  <div className="py-1">
                    {user.role === "ADMIN" && <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-semibold text-court-500 hover:bg-court-500/10">Quản trị hệ thống</Link>}
                    <Link href="/venues/register" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-court-500/10">Đăng ký cơ sở sân</Link>
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-court-50 hover:text-ink dark:hover:bg-court-950/40"
                    >
                      <User size={15} />
                      Tài khoản của tôi
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-court-50 hover:text-ink dark:hover:bg-court-950/40"
                    >
                      <Calendar size={15} />
                      Lịch đặt của tôi
                    </Link>
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
