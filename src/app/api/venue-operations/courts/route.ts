import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { createCourt, getVenueCourts } from "@/services/court.service";

export const dynamic = "force-dynamic";

const createCourtSchema = z.object({
  venueId: z.string().min(1, "Thiếu mã cơ sở."),
  name: z.string().trim().min(1, "Tên sân không được để trống.").max(50, "Tên sân tối đa 50 ký tự."),
  description: z.string().trim().max(500, "Mô tả tối đa 500 ký tự.").optional().nullable(),
  surface: z.string().trim().max(100).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  positionRow: z.number().int().min(1, "Hàng phải >= 1").optional(),
  positionCol: z.number().int().min(1, "Cột phải >= 1").optional(),
  orientation: z.enum(["HORIZONTAL", "VERTICAL"]).optional(),
});

export async function GET(request: Request) {
  try {
    const operatorId = await requirePaymentUser();
    const url = new URL(request.url);
    const venueId = url.searchParams.get("venueId");
    if (!venueId) {
      throw new PaymentError(400, "Thiếu mã cơ sở (venueId).");
    }

    const courts = await getVenueCourts(db, operatorId, venueId);
    return Response.json({ success: true, courts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const operatorId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = createCourtSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.");
    }

    const court = await createCourt(db, operatorId, parsed.data);
    return Response.json({ success: true, court }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
