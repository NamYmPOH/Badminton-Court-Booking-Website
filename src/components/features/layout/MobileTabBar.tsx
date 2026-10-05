"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, CalendarDays, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string;
}

import { useAuth } from "@/context/AuthContext";

export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const mobileTabs = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/venues?view=map", label: "Bản đồ", icon: Map, match: "/venues" },
    { href: user ? "/bookings" : "/login", label: "Lịch của tôi", icon: CalendarDays },
    { href: user ? "/account" : "/login", label: user ? "Tài khoản" : "Đăng nhập", icon: UserCircle },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
      aria-label="Điều hướng chính"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {mobileTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.match && pathname.startsWith(tab.match));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex min-w-[64px] flex-col items-center gap-0.5 px-2 py-1.5 text-xs transition-colors",
                isActive
                  ? "font-semibold text-court-600"
                  : "text-muted hover:text-ink"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
