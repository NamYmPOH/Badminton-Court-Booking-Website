"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, CalendarDays, UserCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string;
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isStaff = user?.role === "STAFF";

  // Trong luồng đặt sân (chi tiết sân, chọn giờ, checkout), ẩn MobileTabBar
  // để nhường chỗ hoàn toàn cho thanh thao tác đặt sân và thanh tóm tắt checkout,
  // tránh tình trạng 2 thanh fixed bottom-0 đè lên nhau gây mất nút thao tác trên mobile.
  const isBookingFlow =
    pathname.startsWith("/checkout") ||
    /^\/venues\/[^/]+(\/book)?$/.test(pathname);

  if (isBookingFlow) {
    return null;
  }

  const mobileTabs: Tab[] = isStaff
    ? [
        { href: "/venue-operations", label: "Quản lý sân", icon: CalendarDays },
        { href: "/account", label: "Tài khoản", icon: UserCircle },
      ]
    : [
        { href: "/", label: "Trang chủ", icon: Home },
        { href: "/venues", label: "Tìm sân", icon: Map, match: "/venues" },
        { href: "/favorites", label: "Yêu thích", icon: Heart },
        { href: user ? "/bookings" : "/login", label: "Lịch đặt", icon: CalendarDays },
        { href: user ? "/account" : "/login", label: user ? "Tài khoản" : "Đăng nhập", icon: UserCircle },
      ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
      aria-label="Điều hướng chính"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {mobileTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.match && pathname.startsWith(tab.match) && pathname === tab.match);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-1 px-1.5 py-1 text-xs transition-colors",
                isActive
                  ? "font-bold text-court-600 dark:text-court-400"
                  : "text-muted hover:text-ink"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
