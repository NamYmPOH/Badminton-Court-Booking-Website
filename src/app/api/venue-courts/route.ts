import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import {
  getVenueCourtsAndPricing,
  createCourt,
  updateCourt,
  deleteCourt,
  upsertPricingRule,
  deletePricingRule,
  createCourtBlock,
  deleteCourtBlock,
} from "@/services/venue-court.service";

export const dynamic = "force-dynamic";

const courtActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE_COURT"),
    venueId: z.string().min(1),
    name: z.string().trim().min(1, "Tên sân không được để trống").max(50),
    surface: z.string().trim().max(50).optional().nullable(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    action: z.literal("UPDATE_COURT"),
    courtId: z.string().min(1),
    name: z.string().trim().min(1).max(50).optional(),
    surface: z.string().trim().max(50).optional().nullable(),
    status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
    sortOrder: z.number().int().optional(),
  }),
  z.object({
    action: z.literal("DELETE_COURT"),
    courtId: z.string().min(1),
  }),
  z.object({
    action: z.literal("UPSERT_PRICING"),
    id: z.string().optional(),
    venueId: z.string().min(1),
    label: z.string().trim().max(100).optional().nullable(),
    daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1, "Chọn ít nhất 1 ngày trong tuần"),
    startMin: z.number().int().min(0).max(1440),
    endMin: z.number().int().min(0).max(1440),
    walkInPrice: z.number().int().positive("Giá thuê phải lớn hơn 0"),
    fixedPrice: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal("DELETE_PRICING"),
    pricingRuleId: z.string().min(1),
  }),
  z.object({
    action: z.literal("LOCK_SLOT"),
    courtId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày không hợp lệ (YYYY-MM-DD)"),
    startMin: z.number().int().min(0).max(1440),
    endMin: z.number().int().min(0).max(1440),
    reason: z.string().trim().max(500).optional().nullable(),
  }),
  z.object({
    action: z.literal("UNLOCK_SLOT"),
    courtBlockId: z.string().min(1),
  }),
]);

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

    const date = url.searchParams.get("date") || undefined;

    const data = await getVenueCourtsAndPricing(db, actor, venueId, date);
    return NextResponse.json({ success: true, ...data }, { headers: { "Cache-Control": "no-store" } });
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

    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = courtActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thao tác không hợp lệ.");
    }

    const data = parsed.data;

    switch (data.action) {
      case "CREATE_COURT":
        return NextResponse.json(await createCourt(db, actor, data));
      case "UPDATE_COURT":
        return NextResponse.json(await updateCourt(db, actor, data));
      case "DELETE_COURT":
        return NextResponse.json(await deleteCourt(db, actor, data.courtId));
      case "UPSERT_PRICING":
        return NextResponse.json(await upsertPricingRule(db, actor, data));
      case "DELETE_PRICING":
        return NextResponse.json(await deletePricingRule(db, actor, data.pricingRuleId));
      case "LOCK_SLOT":
        return NextResponse.json(await createCourtBlock(db, actor, data));
      case "UNLOCK_SLOT":
        return NextResponse.json(await deleteCourtBlock(db, actor, data.courtBlockId));
    }
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
