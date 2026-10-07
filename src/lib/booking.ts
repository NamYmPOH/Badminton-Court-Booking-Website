import type { Venue } from "../types/venue";

export interface SelectedSlot {
  courtId: string;
  courtName: string;
  startMin: number;
  endMin: number;
  price: number;
}

export const formatHour = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const vietnamDate = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
export function bookingDates(now = new Date()) {
  const today = vietnamDate(now);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(`${today}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + i);
    const value = day.toISOString().slice(0, 10);
    return { value, sub: `${value.slice(8)}/${value.slice(5, 7)}`, label: i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : day.getUTCDay() === 0 ? "Chủ nhật" : `Thứ ${day.getUTCDay() + 1}` };
  });
}

export function slotPrice(venue: Pick<Venue, "openMin" | "closeMin" | "pricingRules">, date: string, start: number, end: number): number | null {
  const day = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date || !Number.isInteger(start) || !Number.isInteger(end) || end - start !== 30 || (start - venue.openMin) % 30 !== 0 || start < venue.openMin || end > venue.closeMin) return null;
  const weekday = day.getUTCDay() || 7;
  let amount = 0;
  for (let minute = start; minute < end; minute++) {
    const rule = venue.pricingRules.find(r => r.daysOfWeek.includes(weekday) && minute >= r.startMin && minute < r.endMin);
    if (!rule) return null;
    amount += rule.walkInPrice / 60;
  }
  return Math.round(amount);
}

export function isPastSlot(date: string, startMin: number, now = new Date()) {
  return new Date(`${date}T${formatHour(startMin)}:00+07:00`).getTime() <= now.getTime();
}

export function isDemoBooked(courtId: string, startMin: number) {
  return ["court-1-1-1080", "court-1-1-1110", "court-1-2-1140", "court-1-3-1200"].includes(`${courtId}-${startMin}`);
}

export function selectionError(slots: SelectedSlot[]) {
  if (!slots.length) return "Vui lòng chọn giờ chơi.";
  const sorted = [...slots].sort((a, b) => a.startMin - b.startMin);
  if (sorted.some(s => s.courtId !== sorted[0].courtId)) return "Vui lòng chọn các ô trên cùng một sân.";
  if (sorted.some((s, i) => i > 0 && sorted[i - 1].endMin !== s.startMin)) return "Vui lòng chọn các ô giờ liên tiếp.";
  return "";
}

// Rebuild all names and prices from the catalogue; URL amounts are never trusted.
// This validates the demo only. Real reservations require a server-side availability check.
export function parseSelection(venues: Venue[], params: Pick<URLSearchParams, "get">, now = new Date(), demo = true) {
  const venue = venues.find(v => v.id === params.get("venueId"));
  const date = params.get("date") || "";
  if (!venue || !bookingDates(now).some(d => d.value === date)) return null;
  try {
    const raw: unknown = JSON.parse(params.get("slots") || "null");
    if (!Array.isArray(raw) || !raw.length || raw.length > 48) return null;
    const slots: SelectedSlot[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") return null;
      const court = venue.courts.find(c => c.id === item.courtId && c.isActive);
      const price = slotPrice(venue, date, item.startMin, item.endMin);
      if (!court || price === null || isPastSlot(date, item.startMin, now) || (demo && isDemoBooked(court.id, item.startMin))) return null;
      slots.push({ courtId: court.id, courtName: court.name, startMin: item.startMin, endMin: item.endMin, price });
    }
    if (selectionError(slots)) return null;
    slots.sort((a, b) => a.startMin - b.startMin);
    return { venue, date, slots, total: slots.reduce((sum, slot) => sum + slot.price, 0) };
  } catch { return null; }
}

export function voucherDiscount(code: string, total: number) {
  const normalized = code.trim().toUpperCase();
  return normalized === "CHAOBAN10" ? Math.round(total * 0.1) : normalized === "GIAM20K" ? Math.min(total, 20000) : 0;
}
