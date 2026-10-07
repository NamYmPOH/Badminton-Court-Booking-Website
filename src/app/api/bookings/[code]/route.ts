import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { getSepayConfig, PaymentError, paymentErrorResponse } from "@/lib/sepay";
import { bookingDetails, publicBooking } from "@/services/reservation.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const userId = await requirePaymentUser();
    const booking = await db.booking.findFirst({ where: { code: params.code, userId }, include: bookingDetails });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    const config = booking.status === "PENDING_PAYMENT" ? getSepayConfig() : undefined;
    return Response.json({ success: true, booking: publicBooking(booking, config) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
