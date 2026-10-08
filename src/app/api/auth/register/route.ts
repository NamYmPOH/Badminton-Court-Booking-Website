import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { registerUser } from "@/services/auth.service";
import { signSessionToken, AUTH_COOKIE } from "@/lib/auth-token";
import { apiOk, apiError, handleApiError } from "@/lib/http";

const registerSchema = z.object({
  name: z.string().min(2, "Họ và tên tối thiểu 2 ký tự").max(100),
  phone: z
    .string()
    .regex(/^0[0-9]{9}$/, "Số điện thoại không hợp lệ (cần 10 chữ số bắt đầu bằng 0)"),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[a-zA-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ cái")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 số"),
  email: z.string().email("Địa chỉ email không hợp lệ").optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Dữ liệu đăng ký không hợp lệ";
      return apiError("VALIDATION_ERROR", firstError, 400);
    }

    const { name, phone, password, email } = validation.data;
    const result = await registerUser({
      name,
      phone,
      password,
      email: email || undefined,
    });

    if (!result.success) {
      return apiError(result.code, result.error, result.code === "SERVICE_UNAVAILABLE" ? 503 : 400);
    }

    // Tự động cấp session token để đăng nhập ngay sau khi đăng ký
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
