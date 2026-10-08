import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { getSepayConfig, PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { bookingDetails, publicBooking, choosePaymentMethod } from "@/services/reservation.service";
import { canPayBooking } from "@/lib/booking-payment";
import { assertSameOrigin } from "@/lib/admin-policy";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const userId = await requirePaymentUser();
    const booking = await db.booking.findFirst({ where: { code: params.code, userId }, include: bookingDetails });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    let config;
    if (canPayBooking(booking)) {
      try { config = getSepayConfig(); } catch (error) {
        if (!(error instanceof PaymentError) || error.status !== 503) throw error;
      }
    }
    return Response.json({ success: true, booking: publicBooking(booking, config) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: { code: string } }) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 1024);
    let body;
    try { body = JSON.parse(raw.toString("utf8")); } catch { throw new PaymentError(400, "JSON không hợp lệ."); }
    const parsed = z.object({ method: z.enum(["CASH", "BANK_TRANSFER"]) }).strict().safeParse(body);
    if (!parsed.success) throw new PaymentError(400, "Phương thức thanh toán không hợp lệ.");
    if (parsed.data.method === "BANK_TRANSFER") getSepayConfig();
    const booking = await choosePaymentMethod(db, userId, params.code, parsed.data.method);
    return Response.json({ success: true, booking: publicBooking(booking) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
