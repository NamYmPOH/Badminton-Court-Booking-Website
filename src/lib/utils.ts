import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Kết hợp class names với tailwind-merge để xử lý xung đột */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format VND theo quy ước Việt Nam — NFR-07 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
