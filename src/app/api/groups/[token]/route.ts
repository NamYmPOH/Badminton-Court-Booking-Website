import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { groupActionSchema } from "@/lib/group-payment";
import { getGroupView, groupAction } from "@/services/group-payment.service";
import { groupConfig, groupBody } from "@/lib/group-route";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
type Context = { params: { token: string } };
export async function GET(_request: Request, { params }: Context) {
  try {
    return Response.json(
      {
        group: await getGroupView(db, await requirePaymentUser(), params.token),
      },
      { headers },
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const parsed = groupActionSchema.safeParse(await groupBody(request));
    if (!parsed.success)
      throw new PaymentError(
        400,
        "Thao tác nhóm hoặc dữ liệu xác nhận không hợp lệ.",
      );
    await groupAction(db, userId, params.token, parsed.data, groupConfig());
    return Response.json(
      { group: await getGroupView(db, userId, params.token) },
      { headers },
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
