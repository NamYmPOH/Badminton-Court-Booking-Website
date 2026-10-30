import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { requestBookingCancellation } from "@/services/venue-session.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cancelSchema = z.object({
  reason: z.string().trim().min(5, "Vui lòng nhập lý do hủy ít nhất 5 ký tự.").max(500),
});

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true, status: true, name: true },
    });

    if (actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
    }

    const raw = await readPaymentBody(request, 1024);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Lý do hủy không hợp lệ.");
    }

    const booking = await db.booking.findFirst({
      where: { code: params.code, userId: actor.id },
      select: { id: true, code: true, status: true },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân của bạn hoặc bạn không có quyền hủy đơn này.");
    }

    const result = await requestBookingCancellation(db, actor, booking.id, parsed.data.reason);

    return NextResponse.json({
      ...result,
      message: result.requiresApproval
        ? "Yêu cầu hủy đơn đã được gửi tới chủ sân để phê duyệt và xử lý hoàn tiền."
        : "Đơn đặt sân đã được hủy thành công.",
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
