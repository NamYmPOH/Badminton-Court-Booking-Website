import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { manageCoach } from "@/services/admin-coach.service";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const [coach, venues] = await Promise.all([
      db.coachProfile.findUnique({ where: { id: params.id }, include: {
        user: { select: { name: true, email: true, phone: true } },
        venues: { include: { venue: { select: { id: true, name: true, status: true } } } },
        availabilities: { where: { endsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, include: { venue: { select: { name: true } } } },
        bookings: { where: { endsAt: { gt: new Date() }, OR: [{ status: "CONFIRMED" }, { status: "HELD", expiresAt: { gt: new Date() } }] }, select: { id: true, bookingItem: { select: { court: { select: { venue: { select: { name: true } } } } } }, startsAt: true, endsAt: true, status: true }, orderBy: { startsAt: "asc" } },
      } }),
      db.venue.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    if (!coach) throw new PaymentError(404, "Không tìm thấy HLV.");
    return NextResponse.json({ coach, venues });
  } catch (error) { return paymentErrorResponse(error); }
}
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const actor = await requireAdmin();
    const raw = await readPaymentBody(request, 8192);
    let body: unknown;
    try { body = JSON.parse(raw.toString("utf8")); } catch { throw new PaymentError(400, "JSON không hợp lệ."); }
    return NextResponse.json(await manageCoach(db, actor.id, params.id, body));
  } catch (error) { return paymentErrorResponse(error); }
}
