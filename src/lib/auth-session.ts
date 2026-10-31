import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "./auth-token";
import { getUserById } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth";

export interface Session {
  user: AuthUser;
}

/**
 * Lấy phiên đăng nhập hiện tại từ cookie xác thực của SmashBook
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE.name)?.value;
  if (!token) return null;

  const userId = verifySessionToken(token);
  if (!userId) return null;

  try {
    const user = await getUserById(userId);
    if (!user) return null;
    return { user };
  } catch {
    return null;
  }
}
