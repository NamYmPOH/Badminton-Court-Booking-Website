import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import {
  getVenueStaffList,
  addVenueStaff,
  createVenueStaffAccount,
  setVenueStaffActive,
} from "@/services/venue-session.service";

export const dynamic = "force-dynamic";

const staffActionSchema = z.union([
  z.object({
    action: z.literal("CREATE_ACCOUNT"),
    venueId: z.string().min(1),
    name: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự").max(100),
    phone: z.string().trim().min(8, "Số điện thoại không hợp lệ").max(20),
    email: z.string().trim().email("Email không hợp lệ").optional().nullable(),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(100),
    role: z.enum(["RECEPTIONIST", "STAFF"]).default("RECEPTIONIST"),
  }),
  z.object({
    action: z.literal("ADD_EXISTING").optional(),
    venueId: z.string().min(1),
    identifier: z.string().trim().min(3).max(100),
    role: z.enum(["RECEPTIONIST", "STAFF"]).default("RECEPTIONIST"),
  }),
]);

const updateStaffSchema = z.object({
  venueId: z.string().min(1),
  userId: z.string().min(1),
  isActive: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    if (actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
    }

    const url = new URL(request.url);
    const venueId = url.searchParams.get("venueId");
    if (!venueId) throw new PaymentError(400, "Thiếu mã cơ sở sân (venueId).");

    const staffData = await getVenueStaffList(db, actor, venueId);
    return NextResponse.json(
      {
        success: true,
        venue: staffData.venue,
        staff: staffData.staff,
        staffMembers: staffData.staff,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
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

    if (actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
    }

    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = staffActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.");
    }

    if (parsed.data.action === "CREATE_ACCOUNT") {
      const result = await createVenueStaffAccount(db, actor, parsed.data.venueId, {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role,
      });
      return NextResponse.json(result, { status: 201 });
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
      parsed.data.isActive,
      parsed.data.reason
    );

    return NextResponse.json(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
