import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import { addCoachCertificate, deleteCoachCertificate } from "@/services/coach.service";
import { coachCertificateInputSchema } from "@/lib/coach-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = coachCertificateInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin chứng chỉ không hợp lệ.");
    }

    const certificate = await addCoachCertificate(undefined, userId, parsed.data);
    return NextResponse.json({ success: true, certificate }, { status: 201 });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw new PaymentError(400, "Thiếu mã chứng chỉ cần xóa.");

    await deleteCoachCertificate(undefined, userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
