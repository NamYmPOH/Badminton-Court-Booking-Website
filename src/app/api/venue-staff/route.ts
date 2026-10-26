import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import {
  getVenueStaffList,
  addVenueStaff,
  setVenueStaffActive,
} from "@/services/venue-session.service";

export const dynamic = "force-dynamic";

const addStaffSchema = z.object({
  venueId: z.string().min(1),
  identifier: z.string().trim().min(3).max(100),
  role: z.enum(["RECEPTIONIST", "STAFF"]).default("RECEPTIONIST"),
});

const updateStaffSchema = z.object({
  venueId: z.string().min(1),
  userId: z.string().min(1),
  isActive: z.boolean(),
});

export async function GET(request: Request) {
  try {
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    const url = new URL(request.url);
    const venueId = url.searchParams.get("venueId");
    if (!venueId) throw new PaymentError(400, "Thiếu mã cơ sở sân (venueId).");

    const staffList = await getVenueStaffList(db, actor, venueId);
    return NextResponse.json({ success: true, staff: staffList }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = addStaffSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.");
    }

    const result = await addVenueStaff(
      db,
      actor,
      parsed.data.venueId,
      parsed.data.identifier,
      parsed.data.role
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.");
    }

    const result = await setVenueStaffActive(
      db,
      actor,
      parsed.data.venueId,
      parsed.data.userId,
      parsed.data.isActive
    );

    return NextResponse.json(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
