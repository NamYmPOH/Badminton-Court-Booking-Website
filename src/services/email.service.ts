import crypto from "node:crypto";
import { db } from "@/lib/db";

const VERIFY_COOLDOWN_SECONDS = 60;
const TOKEN_TTL_HOURS = 24;

export interface SendVerificationResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  previewUrl?: string;
  realEmailSent: boolean;
}

export interface ConfirmVerificationResult {
  success: boolean;
  email?: string;
  emailVerified?: string;
  error?: string;
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function getAppOrigin(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

/**
 * Lấy yêu cầu xác minh email đang chờ xử lý của người dùng (nếu có)
 */
export async function getPendingEmailVerification(userId: string): Promise<{
  targetEmail: string;
  expires: Date;
} | null> {
  const prefix = `email_verify:${userId}:`;
  const tokenRecord = await db.verificationToken.findFirst({
    where: {
      identifier: { startsWith: prefix },
      expires: { gt: new Date() },
    },
    orderBy: { expires: "desc" },
  });

  if (!tokenRecord) return null;

  const targetEmail = tokenRecord.identifier.replace(prefix, "");
  return {
    targetEmail,
    expires: tokenRecord.expires,
  };
}

/**
 * Gửi email xác thực tài khoản / đổi email
 */
export async function sendEmailVerification(
  userId: string,
  targetEmail: string
): Promise<SendVerificationResult> {
  const emailNormalized = targetEmail.trim().toLowerCase();

  // 1. Kiểm tra email có đang được sử dụng bởi tài khoản khác không
  const existingUser = await db.user.findFirst({
    where: {
      email: emailNormalized,
      id: { not: userId },
    },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("Địa chỉ email này đã được sử dụng bởi một tài khoản khác.");
  }

  // 2. Kiểm tra giới hạn gửi lại (cooldown)
  const identifierPrefix = `email_verify:${userId}:`;
  const recentToken = await db.verificationToken.findFirst({
    where: {
      identifier: { startsWith: identifierPrefix },
    },
    orderBy: { expires: "desc" },
  });

  if (recentToken) {
    // Thời điểm tạo = expires - 24 giờ
    const createdAtMs = recentToken.expires.getTime() - TOKEN_TTL_HOURS * 3600 * 1000;
    const elapsedSeconds = Math.floor((Date.now() - createdAtMs) / 1000);
    if (elapsedSeconds < VERIFY_COOLDOWN_SECONDS) {
      const waitTime = VERIFY_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        message: `Vui lòng đợi ${waitTime} giây trước khi yêu cầu gửi lại email xác thực.`,
        cooldownSeconds: waitTime,
        realEmailSent: false,
      };
    }
  }

  // 3. Tạo token ngẫu nhiên bảo mật cao (32 bytes = 64 ký tự hex)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const identifier = `email_verify:${userId}:${emailNormalized}`;
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000);

  // 4. Hủy các token xác thực cũ của người dùng này và lưu token mới
  await db.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({
      where: {
        identifier: { startsWith: identifierPrefix },
      },
    });

    await tx.verificationToken.create({
      data: {
        identifier,
        token: hashedToken,
        expires,
      },
    });
  });

  // 5. Xây dựng liên kết xác nhận trang web (anti-scanner: không tự tiêu thụ token qua GET)
  const origin = getAppOrigin();
  const verifyUrl = `${origin}/verify-email?token=${rawToken}`;

  // 6. Gửi qua dịch vụ Email (Resend)
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "SmashBook <onboarding@resend.dev>";

  let realEmailSent = false;

  if (resendApiKey) {
    try {
      const emailHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Xác nhận địa chỉ email - SmashBook</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px;">🏸</span>
      <h2 style="color: #0f172a; margin: 8px 0 0 0; font-size: 20px;">SmashBook — Nền tảng Đặt sân Cầu lông</h2>
    </div>

    <p style="font-size: 14px; line-height: 1.6;">Xin chào bạn,</p>
    <p style="font-size: 14px; line-height: 1.6;">
      Chúng tôi nhận được yêu cầu xác thực và liên kết địa chỉ hộp thư <strong>${emailNormalized}</strong> với tài khoản của bạn tại SmashBook.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
        Xác nhận địa chỉ Email
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
      • Liên kết xác nhận này có thời hạn trong <strong>${TOKEN_TTL_HOURS} giờ</strong>.<br>
      • Nếu bạn không yêu cầu liên kết email này, bạn có thể an tâm bỏ qua thư. Tài khoản của bạn vẫn an toàn tuyệt đối.
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
      SmashBook Badminton Court Booking · Thư tự động, vui lòng không phản hồi thư này.
    </p>
  </div>
</body>
</html>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [emailNormalized],
          subject: "[SmashBook] Xác nhận địa chỉ email tài khoản của bạn",
          html: emailHtml,
        }),
      });

      if (response.ok) {
        realEmailSent = true;
      } else {
        const errorJson = await response.json();
        console.warn("[EMAIL_SERVICE] Resend API error:", errorJson);
      }
    } catch (err) {
      console.error("[EMAIL_SERVICE] Lỗi kết nối gửi email qua Resend:", err);
    }
  } else {
    // Không có RESEND_API_KEY: ghi rõ thông báo vào log máy chủ để kiểm tra môi trường dev
    console.log("[EMAIL_SERVICE] Môi trường chưa cấu hình RESEND_API_KEY.");
    console.log(`[EMAIL_SERVICE] [DEV PREVIEW] Liên kết xác nhận cho ${emailNormalized}: ${verifyUrl}`);
  }

  return {
    success: true,
    message: realEmailSent
      ? `Đã gửi thư xác thực tới ${emailNormalized}. Vui lòng kiểm tra hộp thư đến (hoặc thư rác).`
      : `Đã tạo yêu cầu xác nhận cho ${emailNormalized}. ${
          resendApiKey
            ? "Thư đang được chuyển tiếp."
            : "Chưa cấu hình RESEND_API_KEY trên môi trường này; liên kết kiểm thử đã được lưu vào hệ thống."
        }`,
    cooldownSeconds: VERIFY_COOLDOWN_SECONDS,
    previewUrl: !resendApiKey ? verifyUrl : undefined,
    realEmailSent,
  };
}

/**
 * Xác nhận token xác thực email (chỉ thực thi khi người dùng bấm xác nhận trên web)
 */
export async function confirmEmailVerification(
  userId: string,
  rawToken: string
): Promise<ConfirmVerificationResult> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
    return { success: false, error: "Thiếu mã xác thực." };
  }

  const hashedToken = hashToken(rawToken.trim());

  // 1. Tìm bản ghi token trong database
  const tokenRecord = await db.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!tokenRecord) {
    return {
      success: false,
      error: "Mã xác thực không hợp lệ hoặc đã được sử dụng.",
    };
  }

  // 2. Kiểm tra hạn dùng
  if (new Date() > tokenRecord.expires) {
    // Xóa token hết hạn
    await db.verificationToken.delete({ where: { token: hashedToken } });
    return {
      success: false,
      error: "Liên kết xác thực đã hết hạn. Vui lòng gửi lại yêu cầu xác thực mới.",
    };
  }

  // 3. Kiểm tra định dạng identifier và ràng buộc đúng tài khoản
  const match = tokenRecord.identifier.match(/^email_verify:([^:]+):(.+)$/);
  if (!match) {
    return {
      success: false,
      error: "Mục đích xác thực không hợp lệ.",
    };
  }

  const [, tokenUserId, targetEmail] = match;

  if (tokenUserId !== userId) {
    return {
      success: false,
      error: "Liên kết xác thực này thuộc về một tài khoản khác. Vui lòng đăng nhập đúng tài khoản yêu cầu.",
    };
  }

  // 4. Thực thi transaction cập nhật nguyên tử
  try {
    const updatedUser = await db.$transaction(async (tx) => {
      // Kiểm tra tính duy nhất của email tại thời điểm xác nhận
      const duplicateUser = await tx.user.findFirst({
        where: {
          email: targetEmail,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (duplicateUser) {
        throw new Error("Địa chỉ email này vừa được liên kết với một tài khoản khác.");
      }

      const now = new Date();
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          email: targetEmail,
          emailVerified: now,
        },
        select: {
          id: true,
          email: true,
          emailVerified: true,
        },
      });

      // Xóa toàn bộ token xác thực email của người dùng này sau khi thành công
      await tx.verificationToken.deleteMany({
        where: {
          identifier: { startsWith: `email_verify:${userId}:` },
        },
      });

      return user;
    });

    return {
      success: true,
      email: updatedUser.email || targetEmail,
      emailVerified: updatedUser.emailVerified?.toISOString(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Không thể hoàn tất xác thực email.",
    };
  }
}
