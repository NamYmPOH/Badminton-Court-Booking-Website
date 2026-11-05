export function starFillPercent(rating: number, index: number) {
  return Math.max(0, Math.min(1, (Number.isFinite(rating) ? rating : 0) - index)) * 100;
}
