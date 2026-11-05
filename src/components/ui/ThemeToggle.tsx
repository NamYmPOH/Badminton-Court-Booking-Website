"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Tránh hydration mismatch — render placeholder cùng kích thước
    return <div className={cn("h-10 w-10", className)} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-control text-muted transition-[background-color,color,transform] duration-150 ease-out hover:bg-court-50 dark:hover:bg-surface active:scale-95 motion-reduce:active:scale-100",
        className
      )}
    >
      {isDark ? <Sun size={20} className="transition-transform duration-200 rotate-0 dark:rotate-0" /> : <Moon size={20} className="transition-transform duration-200 rotate-0" />}
    </button>
  );
}
