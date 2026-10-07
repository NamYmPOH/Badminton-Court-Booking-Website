import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { bookingRequestSchema } from "@/lib/booking-request";
import { getSepayConfig, PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { bookingDetails, createReservation, publicBooking } from "@/services/reservation.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requirePaymentUser();
    const config = getSepayConfig();
    const raw = await readPaymentBody(request, 16384);
    let body: unknown;
    try { body = JSON.parse(raw.toString("utf8")); } catch { throw new PaymentError(400, "JSON không hợp lệ."); }
    const parsed = bookingRequestSchema.safeParse(body);
    if (!parsed.success) throw new PaymentError(400, "Thông tin đặt sân không hợp lệ.");
    const booking = await createReservation(db, userId, parsed.data);
    return Response.json({ success: true, booking: publicBooking(booking, config) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}

export async function GET() {
  try {
    const userId = await requirePaymentUser();
    const bookings = await db.booking.findMany({ where: { userId }, include: bookingDetails, orderBy: { createdAt: "desc" }, take: 100 });
    return Response.json({ success: true, bookings: bookings.map(b => publicBooking(b)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
