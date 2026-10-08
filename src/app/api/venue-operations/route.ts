import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { operatorVenueScope } from "@/lib/venue-operations";
import { adminActionSchema, assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { performAdminAction } from "@/services/admin.service";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({ where: { id }, select: { id: true, role: true, status: true } });
    const q = (new URL(request.url).searchParams.get("q") || "").slice(0, 80);
    const bookings = await db.booking.findMany({
      where: { venue: operatorVenueScope(actor), ...(q ? { code: { contains: q, mode: "insensitive" } } : {}),
        OR: [{ status: "CONFIRMED" }, { status: "CHECKED_IN" }, { status: "PENDING_PAYMENT", expiresAt: { gt: new Date() } }] },
      take: 100, orderBy: { createdAt: "desc" },
      select: { id: true, code: true, customerName: true, customerPhone: true, total: true, status: true, paymentStatus: true, paymentMethod: true, expiresAt: true,
        venue: { select: { name: true, paymentMode: true } }, items: { select: { date: true, startMin: true, endMin: true, court: { select: { name: true } } } } },
    });
    return Response.json({ bookings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const id = await requirePaymentUser();
    const raw = await readPaymentBody(request, 2048);
    let body;
    try { body = JSON.parse(raw.toString("utf8")); } catch { throw new PaymentError(400, "JSON không hợp lệ."); }
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success || !["CONFIRM", "CANCEL", "CASH_PAID", "CHECK_IN", "COMPLETE"].includes(parsed.data.action)) throw new PaymentError(400, "Thao tác không hợp lệ.");
    return Response.json(await performAdminAction(db, id, parsed.data));
  } catch (error) { return paymentErrorResponse(error); }
}
