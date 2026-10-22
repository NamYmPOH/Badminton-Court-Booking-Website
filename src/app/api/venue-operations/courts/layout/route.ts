import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { saveVenueCourtLayout } from "@/services/court.service";

export const dynamic = "force-dynamic";

const layoutSchema = z.object({
  venueId: z.string().min(1, "Thiếu mã cơ sở."),
  layout: z.array(
    z.object({
      courtId: z.string().min(1, "Thiếu ID sân."),
      positionRow: z.number().int().min(1, "Hàng phải >= 1."),
      positionCol: z.number().int().min(1, "Cột phải >= 1."),
      orientation: z.enum(["HORIZONTAL", "VERTICAL"]).optional(),
      sortOrder: z.number().int().min(0).optional(),
    })
  ).min(1, "Bố cục phải có ít nhất 1 sân."),
});

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const operatorId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 16384);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = layoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu bố cục không hợp lệ.");
    }

    const result = await saveVenueCourtLayout(
      db,
      operatorId,
      parsed.data.venueId,
      parsed.data.layout
    );
    return Response.json(result);
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
