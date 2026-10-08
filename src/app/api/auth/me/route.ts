import { cookies } from "next/headers";
import { verifySessionToken, AUTH_COOKIE } from "@/lib/auth-token";
import { getUserById } from "@/services/auth.service";
import { apiOk, apiError } from "@/lib/http";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE.name)?.value;

  if (!token) {
    return apiOk({ user: null });
  }

  const userId = verifySessionToken(token);
  if (!userId) {
    return apiOk({ user: null });
  }

  try {
    const user = await getUserById(userId);
    return apiOk({ user });
  } catch { return apiError("SERVICE_UNAVAILABLE", "Không thể kết nối hệ thống tài khoản.", 503); }
}
