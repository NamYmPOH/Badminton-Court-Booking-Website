import { z } from "zod";
import { isPastSlot, selectionError, slotPrice, vietnamDate } from "./booking";
import { PaymentError } from "./sepay";

export const bookingRequestSchema = z.object({
  requestId: z.string().uuid(),
  venueId: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(z.object({ courtId: z.string().min(1).max(100), startMin: z.number().int(), endMin: z.number().int() })).min(1).max(48),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().regex(/^(0[35789]\d{8}|\+84[35789]\d{8})$/),
  note: z.string().trim().max(1000).default(""),
  coachId: z.string().min(1).max(100).optional().nullable(),
  voucherCode: z.string().trim().min(3).max(30).optional().nullable(),
}).strict();
export type BookingRequest = z.infer<typeof bookingRequestSchema>;

type Catalogue = {
  openMin: number; closeMin: number; advanceDays: number; minBookingMin: number; maxBookingMin: number;
  courts: { id: string; name: string; status: string }[];
  pricing: { daysOfWeek: number[]; startMin: number; endMin: number; walkInPrice: number; courtId?: string | null }[];
};
export function priceBooking(input: BookingRequest, venue: Catalogue, now = new Date()) {
  const date = new Date(`${input.date}T00:00:00Z`);
  const delta = (date.getTime() - new Date(`${vietnamDate(now)}T00:00:00Z`).getTime()) / 86400000;
  if (!Number.isFinite(delta) || date.toISOString().slice(0, 10) !== input.date || delta < 0 || delta >= venue.advanceDays) {
    throw new PaymentError(400, "Ngày đặt sân không hợp lệ.");
  }
  const slots = input.slots.map(item => {
    const court = venue.courts.find(c => c.id === item.courtId && c.status === "ACTIVE");
    const price = slotPrice({ ...venue, pricingRules: venue.pricing.map(rule => ({ ...rule, id: "", fixedPrice: 0 })) }, input.date, item.startMin, item.endMin, item.courtId);
    if (!court || price === null || price <= 0 || isPastSlot(input.date, item.startMin, now)) throw new PaymentError(400, "Sân hoặc giờ chơi không còn hợp lệ.");
    return { ...item, courtName: court.name, price };
  }).sort((a, b) => a.courtId.localeCompare(b.courtId) || a.startMin - b.startMin);

  const error = selectionError(slots, venue.courts);
  if (error) {
    throw new PaymentError(400, error);
  }

  // Kiểm tra thời lượng liên tục trên từng sân con riêng biệt
  const byCourt = new Map<string, typeof slots>();
  for (const s of slots) {
    if (!byCourt.has(s.courtId)) byCourt.set(s.courtId, []);
    byCourt.get(s.courtId)!.push(s);
  }

  for (const [courtId, courtSlots] of Array.from(byCourt.entries())) {
    const courtSorted = [...courtSlots].sort((a, b) => a.startMin - b.startMin);
    const courtDuration = courtSorted[courtSorted.length - 1].endMin - courtSorted[0].startMin;
    if (courtDuration < venue.minBookingMin || courtDuration > venue.maxBookingMin) {
      const courtObj = venue.courts.find(c => c.id === courtId);
      const name = courtObj ? courtObj.name : "Sân";
      throw new PaymentError(
        400,
        `Thời lượng đặt trên ${name} phải từ ${venue.minBookingMin} đến ${venue.maxBookingMin} phút.`
      );
    }
  }

  const total = slots.reduce((sum, slot) => sum + slot.price, 0);
  if (!Number.isSafeInteger(total) || total > 2147483647) throw new PaymentError(400, "Số tiền không hợp lệ.");
  return { slots, total, date };
}
