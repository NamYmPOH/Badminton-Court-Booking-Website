import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { refundLedger } from "@/services/refund.service";
import { approveBookingCancellation, recordManualRefund } from "@/services/venue-session.service";
import { serializable } from "@/lib/transaction";
import { z } from "zod";
export const dynamic = "force-dynamic";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), id: z.string().min(1), amount: z.number().int().nonnegative(), reason: z.string().trim().min(5).max(500) }).strict(),
  z.object({ action: z.literal("refund"), id: z.string().min(1), amount: z.number().int().positive(), reason: z.string().trim().min(5).max(500), refundId: z.string().min(1), reference: z.string().trim().min(5).max(160) }).strict(),
]);
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new PaymentError(400, "Thiếu mã đơn.");
    const data = await serializable(db, async tx => {
      const booking = await tx.booking.findUnique({ where: { id }, select: { id: true, code: true, status: true, customerName: true, customerPhone: true, cancelRequestedAt: true, cancelApprovedAt: true, cancelReason: true } });
      if (!booking) throw new PaymentError(404, "Không tìm thấy đơn.");
      const ledger = await refundLedger(tx, id);
      return { booking, available: ledger.available, received: ledger.received, refunds: ledger.refunds.map(r => ({ id: r.id, amount: r.amount, completedAmount: r.completedAmount, txnRef: ledger.payments.find(p => p.id === r.paymentId)?.txnRef })) };
    });
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return paymentErrorResponse(e); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try { body = JSON.parse(raw.toString("utf8")); } catch { throw new PaymentError(400, "JSON không hợp lệ."); }
    const parsed = input.safeParse(body);
    if (!parsed.success) throw new PaymentError(400, "Kiểm tra số tiền, lý do và mã chứng từ (ít nhất 5 ký tự).");
    const d = parsed.data;
    const result = d.action === "approve"
      ? await approveBookingCancellation(db, actor, d.id, d.amount, d.reason)
      : await recordManualRefund(db, actor, d.id, d.amount, d.reason, d.refundId, d.reference);
    return Response.json(result);
  } catch (e) { return paymentErrorResponse(e); }
}
