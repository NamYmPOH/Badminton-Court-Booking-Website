import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { paymentErrorResponse, PaymentError } from "@/lib/sepay";
import { getInvoiceByBookingCode } from "@/services/invoice.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const userId = await requirePaymentUser();
    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn không có quyền truy cập.");
    }

    const invoice = await getInvoiceByBookingCode(db, params.code, actor);

    return Response.json(
      { success: true, invoice },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
