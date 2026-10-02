"use client";

import Link from "next/link";

const filters = [
  { label: "Gần tôi", href: "/venues?sort=distance" },
  { label: "Còn trống tối nay", href: "/venues?hasSlotTonight=true" },
  { label: "Dưới 80.000 ₫", href: "/venues?maxPrice=80000" },
  { label: "Có điều hoà", href: "/venues?amenity=AC" },
  { label: "Có chỗ đậu xe", href: "/venues?amenity=PARKING" },
];

export function QuickFilters() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Link
          key={filter.label}
          href={filter.href}
          className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/20"
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
