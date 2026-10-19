import { NextResponse } from "next/server";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { paymentErrorResponse, PaymentError, readPaymentBody } from "@/lib/sepay";
import {
  getMyCoachAvailabilities,
  createCoachAvailability,
  deleteCoachAvailability,
} from "@/services/coach.service";
import { coachAvailabilityInputSchema } from "@/lib/coach-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requirePaymentUser();
    const url = new URL(request.url);
    const fromDate = url.searchParams.get("fromDate") || undefined;
    const toDate = url.searchParams.get("toDate") || undefined;

    const slots = await getMyCoachAvailabilities(undefined, userId, fromDate, toDate);
    return NextResponse.json({ success: true, slots, availabilities: slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

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

    const parsed = coachAvailabilityInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin ca dạy không hợp lệ.");
    }

    const slot = await createCoachAvailability(undefined, userId, parsed.data);
    return NextResponse.json({ success: true, slot }, { status: 201 });
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
    if (!id) throw new PaymentError(400, "Thiếu mã ca dạy cần xóa.");

    await deleteCoachAvailability(undefined, userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
