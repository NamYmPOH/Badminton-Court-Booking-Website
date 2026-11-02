import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import {
  sendEmailVerification,
  confirmEmailVerification,
} from "@/services/email.service";
import { paymentErrorResponse, PaymentError } from "@/lib/sepay";
import { assertSameOrigin } from "@/lib/admin-policy";

export const dynamic = "force-dynamic";

const verifyEmailActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send"),
    email: z.string().trim().email("Địa chỉ email không đúng định dạng (VD: example@gmail.com)"),
  }),
  z.object({
    action: z.literal("confirm"),
    token: z.string().trim().min(1, "Mã xác thực không được để trống"),
  }),
  z.object({
    action: z.literal("cancel"),
  }),
]);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();

    const body: unknown = await request.json();
    const parseResult = verifyEmailActionSchema.safeParse(body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new PaymentError(
        400,
        firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Dữ liệu không hợp lệ."
      );
    }

    const payload = parseResult.data;

    if (payload.action === "send") {
      const result = await sendEmailVerification(userId, payload.email);
      return NextResponse.json({
        success: result.success,
        message: result.message,
        cooldownSeconds: result.cooldownSeconds,
        previewUrl: result.previewUrl,
        realEmailSent: result.realEmailSent,
      });
    }

    if (payload.action === "confirm") {
      const result = await confirmEmailVerification(userId, payload.token);
      if (!result.success) {
        throw new PaymentError(400, result.error || "Xác thực email thất bại.");
      }
      return NextResponse.json({
        success: true,
        message: "Xác thực và liên kết email thành công!",
        email: result.email,
        emailVerified: result.emailVerified,
      });
    }

    if (payload.action === "cancel") {
      await db.verificationToken.deleteMany({
        where: {
          identifier: { startsWith: `email_verify:${userId}:` },
        },
      });
      return NextResponse.json({
        success: true,
        message: "Đã hủy yêu cầu xác thực email.",
      });
    }

    throw new PaymentError(400, "Thao tác không được hỗ trợ.");
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
