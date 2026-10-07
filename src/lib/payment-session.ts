import { cookies } from "next/headers";
import { db } from "./db";
import { AUTH_COOKIE, verifySessionToken } from "./auth-token";
import { PaymentError } from "./sepay";

export async function requirePaymentUser() {
  // Không chấp nhận secret mặc định của bản demo cho thao tác đặt sân thật.
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new PaymentError(503, "Đăng nhập chưa được cấu hình đầy đủ.");
  const token = cookies().get(AUTH_COOKIE.name)?.value;
  const userId = token ? verifySessionToken(token) : null;
  if (!userId) throw new PaymentError(401, "Vui lòng đăng nhập trước khi đặt sân.");
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
  if (!user || user.status !== "ACTIVE") throw new PaymentError(401, "Vui lòng đăng nhập bằng tài khoản đang hoạt động.");
  return user.id;
}
