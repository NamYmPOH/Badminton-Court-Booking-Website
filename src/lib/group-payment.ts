import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { PaymentError } from "./sepay";

export const createGroupSchema = z
  .object({
    bookingCode: z.string().regex(/^DATSAN\d{1,10}$/),
    count: z.number().int().min(2).max(30),
    amounts: z
      .array(z.number().int().positive().max(100000000))
      .min(2)
      .max(30)
      .optional(),
  })
  .strict();
const ids = z
  .array(z.string().min(1).max(100))
  .min(1)
  .max(30)
  .refine((v) => new Set(v).size === v.length);
const reason = z.string().trim().min(5).max(500);
export const groupActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("JOIN"),
      position: z.number().int().min(1).max(30),
    })
    .strict(),
  z
    .object({
      action: z.literal("METHOD"),
      method: z.enum(["CASH", "BANK_TRANSFER"]),
    })
    .strict(),
  z.object({ action: z.literal("COVER"), shareIds: ids }).strict(),
  z.object({ action: z.literal("REQUEST_CASH_ALL") }).strict(),
  z
    .object({ action: z.literal("APPROVE_CASH"), shareIds: ids, reason })
    .strict(),
  z
    .object({ action: z.literal("COLLECT_CASH"), shareIds: ids, reason })
    .strict(),
  z
    .object({
      action: z.literal("CHECK_IN_TICKET"),
      ticket: z.string().min(10).max(300),
      reason,
    })
    .strict(),
  z.object({ action: z.literal("CANCEL"), reason }).strict(),
  z
    .object({
      action: z.literal("REFUND_DONE"),
      refundId: z.string().max(100),
      reference: z.string().trim().min(5).max(200),
      reason,
    })
    .strict(),
]);
export type GroupAction = z.infer<typeof groupActionSchema>;

export function splitAmounts(total: number, count: number, custom?: number[]) {
  if (!Number.isSafeInteger(total) || total < count || count < 2 || count > 30)
    throw new PaymentError(400, "Số người hoặc tổng tiền không hợp lệ.");
  const amounts =
    custom ||
    Array.from(
      { length: count },
      (_, i) => Math.floor(total / count) + (i < total % count ? 1 : 0),
    );
  if (
    amounts.length !== count ||
    amounts.some((a) => !Number.isSafeInteger(a) || a <= 0) ||
    amounts.reduce((a, b) => a + b, 0) !== total
  )
    throw new PaymentError(
      400,
      "Tổng các phần phải bằng tiền đơn và mỗi phần lớn hơn 0đ.",
    );
  return amounts;
}

export function extractGroupCode(content: string) {
  const codes = Array.from(
    content.matchAll(/(?<![A-Z0-9])GP([A-F0-9]{24})(?![A-Z0-9])/gi),
    (m) => `GP${m[1].toUpperCase()}`,
  );
  const unique = Array.from(new Set(codes));
  // Reject mixed references rather than accidentally paying a legacy order.
  return unique.length === 1 && !/DATSAN\d/i.test(content) ? unique[0] : null;
}

export function groupTotals(
  shares: {
    amount: number;
    paymentId: string | null;
    cashApprovedAt: Date | null;
  }[],
) {
  const total = shares.reduce((s, v) => s + v.amount, 0);
  const received = shares
    .filter((s) => s.paymentId)
    .reduce((sum, s) => sum + s.amount, 0);
  return {
    total,
    received,
    remaining: total - received,
    canConfirm: shares.every((s) => s.paymentId || s.cashApprovedAt),
  };
}

export function slotTime(
  item: { date: Date; startMin: number },
  endMin?: number,
) {
  return (
    new Date(
      item.date.toISOString().slice(0, 10) + "T00:00:00+07:00",
    ).getTime() +
    (endMin ?? item.startMin) * 60000
  );
}

export function ticketValue(
  share: { id: string; ticketNonce: string },
  secret = process.env.AUTH_SECRET || "",
) {
  if (secret.length < 32)
    throw new PaymentError(503, "Chưa cấu hình vé nhận sân.");
  return `GT.${share.id}.${createHmac("sha256", secret).update(`group-ticket:${share.id}:${share.ticketNonce}`).digest("hex")}`;
}
export function validTicket(
  ticket: string,
  share: { id: string; ticketNonce: string },
) {
  const expected = Buffer.from(ticketValue(share));
  const actual = Buffer.from(ticket);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
