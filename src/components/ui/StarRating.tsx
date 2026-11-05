import { Star } from "lucide-react";
import { starFillPercent } from "@/lib/rating";

/** Sao cuối được tô theo phần thập phân, ví dụ 4,3 = 4 sao và 30% sao thứ 5. */
export function StarRating({ rating, count, demoCount = 0, size = 14 }: { rating: number; count?: number; demoCount?: number; size?: number }) {
  const value = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span role="img" aria-label={`${value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} trên 5 sao`} className="inline-flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} aria-hidden="true" className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            <Star size={size} className="text-muted/40" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${starFillPercent(value, index)}%` }}>
              <Star size={size} className="max-w-none fill-amber-400 text-amber-400" />
            </span>
          </span>
        ))}
      </span>
      <span className="font-semibold text-ink">{value.toFixed(1)}</span>
      {count !== undefined && <span className="font-normal text-muted">({count})</span>}
      {demoCount > 0 && <span className="text-[10px] font-normal text-muted">gồm {demoCount} mẫu</span>}
    </span>
  );
}
