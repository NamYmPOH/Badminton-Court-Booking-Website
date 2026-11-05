import { z } from "zod";

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1, "Hãy chọn từ 1 đến 5 sao.").max(5, "Hãy chọn từ 1 đến 5 sao."),
  comment: z.string().trim().max(2000, "Nhận xét tối đa 2.000 ký tự.").default(""),
}).strict();

export function hasFinishedPlaying(booking: {
  status: string;
  items: { date: Date | string; endMin: number }[];
}, now = new Date()) {
  return booking.status === "COMPLETED" && booking.items.length > 0 && booking.items.every(item => {
    const date = item.date instanceof Date ? item.date.toISOString().slice(0, 10) : item.date.slice(0, 10);
    const end = new Date(`${date}T00:00:00+07:00`).getTime() + item.endMin * 60000;
    return Number.isFinite(end) && end <= now.getTime();
  });
}

