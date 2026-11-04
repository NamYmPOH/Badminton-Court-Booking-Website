import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { transferBooking } from "@/services/transfer.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const transferSchema = z.object({
  receiverName: z.string().trim().min(2, "Họ và tên người nhận ít nhất 2 ký tự.").max(100),
  receiverPhone: z.string().trim().regex(/^(0[35789]\d{8}|\+84[35789]\d{8})$/, "Số điện thoại không hợp lệ (ví dụ: 0912345678)."),
  note: z.string().trim().max(500).optional(),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();

    const raw = await readPaymentBody(request, 2048);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thông tin người nhận không hợp lệ.");
    }

    const result = await transferBooking(db, {
      bookingCode: params.code,
      actorId: userId,
      receiverName: parsed.data.receiverName,
      receiverPhone: parsed.data.receiverPhone,
      note: parsed.data.note,
    });

    return NextResponse.json({
      ...result,
      message: `Đã chuyển nhượng lịch thành công cho ${result.transfereeName}.`,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

