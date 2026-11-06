import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { getUserById } from "@/services/auth.service";
import { getPendingEmailVerification } from "@/services/email.service";
import { paymentErrorResponse, PaymentError } from "@/lib/sepay";
import { assertSameOrigin } from "@/lib/admin-policy";
import { invalidatePublicCoachCache } from "@/lib/public-cache";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Họ và tên tối thiểu 2 ký tự").max(50, "Họ và tên tối đa 50 ký tự"),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[35789][0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ (VD: 0912345678)"),
  image: z.string().url("Đường dẫn ảnh đại diện không hợp lệ").optional().nullable(),
});

/**
 * GET: Lấy thông tin cá nhân của người dùng đang đăng nhập cùng trạng thái email đang chờ xác thực
 */
export async function GET() {
  try {
    const userId = await requirePaymentUser();
    const user = await getUserById(userId);

    if (!user) {
      throw new PaymentError(404, "Không tìm thấy thông tin tài khoản.");
    }

    const pending = await getPendingEmailVerification(userId);

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        pendingEmail: pending ? pending.targetEmail : null,
        pendingEmailExpires: pending ? pending.expires.toISOString() : null,
      },
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

/**
 * PATCH: Cập nhật thông tin cá nhân (Họ tên, SĐT, Ảnh đại diện)
 * Chặn sửa role, status, points, emailVerified hoặc tài khoản người khác.
 */
export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const userId = await requirePaymentUser();

    const body: unknown = await request.json();
    const parseResult = updateProfileSchema.safeParse(body);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new PaymentError(
        400,
        firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Dữ liệu không hợp lệ."
      );
    }

    const { name, phone, image } = parseResult.data;

    // Chuẩn hóa số điện thoại về dạng 0xxxxxxxxx
    const normalizedPhone = phone.startsWith("+84") ? "0" + phone.slice(3) : phone;

    // Kiểm tra tính duy nhất của số điện thoại
    const existingPhoneUser = await db.user.findFirst({
      where: {
        phone: normalizedPhone,
        id: { not: userId },
      },
      select: { id: true },
    });

    if (existingPhoneUser) {
      throw new PaymentError(400, "Số điện thoại này đã được sử dụng bởi một tài khoản khác.");
    }

    // Cập nhật nguyên tử
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name,
        phone: normalizedPhone,
        ...(image !== undefined ? { image } : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        emailVerified: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        image: true,
      },
    });

    await invalidatePublicCoachCache();
    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công.",
      data: {
        ...updatedUser,
        phone: updatedUser.phone || "",
        emailVerified: updatedUser.emailVerified ? updatedUser.emailVerified.toISOString() : null,
      },
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
