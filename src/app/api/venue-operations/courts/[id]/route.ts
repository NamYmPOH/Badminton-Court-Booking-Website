import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { updateCourt, deleteCourt } from "@/services/court.service";

export const dynamic = "force-dynamic";

const updateCourtSchema = z.object({
  name: z.string().trim().min(1, "Tên sân không được để trống.").max(50).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  surface: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
  positionRow: z.number().int().min(1, "Hàng phải >= 1").optional(),
  positionCol: z.number().int().min(1, "Cột phải >= 1").optional(),
  orientation: z.enum(["HORIZONTAL", "VERTICAL"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    assertSameOrigin(request);
    const operatorId = await requirePaymentUser();
    const courtId = params.id;
    if (!courtId) throw new PaymentError(400, "Thiếu ID sân.");

    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = updateCourtSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu cập nhật không hợp lệ.");
    }

    const court = await updateCourt(db, operatorId, courtId, parsed.data);
    return Response.json({ success: true, court });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    assertSameOrigin(request);
    const operatorId = await requirePaymentUser();
    const courtId = params.id;
    if (!courtId) throw new PaymentError(400, "Thiếu ID sân.");

    const result = await deleteCourt(db, operatorId, courtId);
    return Response.json(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
