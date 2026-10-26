"use client";

import Link from "next/link";
import { Navigation, Sparkles, Tag, Wind, Car } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FilterItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const FILTERS: FilterItem[] = [
  { label: "Gần tôi", href: "/venues?sort=distance", icon: Navigation },
  { label: "Còn trống tối nay", href: "/venues?hasSlotTonight=true", icon: Sparkles },
  { label: "Dưới 80.000 ₫", href: "/venues?maxPrice=80000", icon: Tag },
  { label: "Có điều hoà", href: "/venues?amenity=AC", icon: Wind },
  { label: "Có chỗ đậu xe", href: "/venues?amenity=PARKING", icon: Car },
];

export function QuickFilters() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-court-200">Gợi ý nhanh:</span>
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        return (
          <Link
            key={filter.label}
            href={filter.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur transition-all duration-150 hover:border-white/50 hover:bg-white/20 active:scale-95"
          >
            <Icon size={12} className="text-racket-400" />
            <span>{filter.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
