import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { rescheduleBooking } from "@/services/reschedule.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày phải là YYYY-MM-DD."),
  slots: z
    .array(
      z.object({
        courtId: z.string().min(1, "Thiếu ID sân."),
        startMin: z.number().int().min(0).max(1440),
        endMin: z.number().int().min(0).max(1440),
      })
    )
    .min(1, "Vui lòng chọn ít nhất 1 khung giờ.")
    .max(8, "Chỉ được chọn tối đa 8 khung giờ."),
  reason: z.string().trim().max(500).optional(),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();

    const raw = await readPaymentBody(request, 8192);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Dữ liệu đổi lịch không hợp lệ.");
    }

    const result = await rescheduleBooking(db, {
      bookingCode: params.code,
      actorId: userId,
      newDate: parsed.data.date,
      newSlots: parsed.data.slots,
      reason: parsed.data.reason,
    });

    return NextResponse.json({
      ...result,
      message:
        result.priceDifference > 0
          ? `Đổi lịch thành công. Vui lòng thanh toán khoản chênh lệch ${result.priceDifference.toLocaleString("vi-VN")} đ.`
          : result.priceDifference < 0
          ? `Đổi lịch thành công. Khoản thừa ${Math.abs(result.priceDifference).toLocaleString("vi-VN")} đ đã được ghi nhận hoàn tiền.`
          : "Đổi lịch thành công.",
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

