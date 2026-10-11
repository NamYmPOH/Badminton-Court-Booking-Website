import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { createGroupSchema } from "@/lib/group-payment";
import { createGroup } from "@/services/group-payment.service";
import { groupConfig, groupBody } from "@/lib/group-route";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const parsed = createGroupSchema.safeParse(await groupBody(request));
    if (!parsed.success)
      throw new PaymentError(
        400,
        "Kiểm tra số người và các phần tiền trong nhóm.",
      );
    return Response.json(
      await createGroup(db, userId, parsed.data, groupConfig()),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
