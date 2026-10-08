import { z } from "zod";
import { cookies } from "next/headers";
import { loginUser } from "@/services/auth.service";
import { signSessionToken, AUTH_COOKIE } from "@/lib/auth-token";
import { apiOk, apiError, handleApiError } from "@/lib/http";

const loginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập số điện thoại hoặc email"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ";
      return apiError("VALIDATION_ERROR", firstError, 400);
    }

    const { identifier, password } = validation.data;
    const result = await loginUser({ identifier, password });

    if (!result.success) {
      return apiError(result.code, result.error, result.code === "SERVICE_UNAVAILABLE" ? 503 : 401);
    }

    // Cấp session token qua cookie
    const token = signSessionToken(result.data.id);
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE.maxAge,
    });

    return apiOk({ user: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}
