"use client";

import Link from "next/link";
import { MapPin, Bell, User, LogIn } from "lucide-react";
import { BRAND } from "@/lib/config/brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

// TODO(decision): Session sẽ được truyền vào sau M2 khi có Auth.js
interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
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
            {/* Biểu tượng cầu lông đơn giản bằng emoji — sẽ thay bằng SVG logo sau */}
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

          {/* Chưa có session → hiện nút đăng nhập/đăng ký. Sau M2 sẽ kiểm tra session */}
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
