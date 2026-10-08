import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import type { AuthUser, RegisterInput, LoginInput } from "../types/auth";

const publicUser = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  status: true,
  loyaltyPoints: true,
  image: true,
} as const;
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export async function registerUser(
  input: RegisterInput,
): Promise<AuthResult<AuthUser>> {
  try {
    const user = await db.user.create({
      data: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim().toLowerCase() || null,
        passwordHash: await bcrypt.hash(input.password, 10),
        role: "CUSTOMER",
        status: "ACTIVE",
      },
      select: publicUser,
    });
    return { success: true, data: { ...user, phone: user.phone || "" } };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002")
      return {
        success: false,
        code: "ACCOUNT_EXISTS",
        error: "Số điện thoại hoặc email đã được đăng ký.",
      };
    return {
      success: false,
      code: "SERVICE_UNAVAILABLE",
      error: "Không thể kết nối hệ thống tài khoản. Vui lòng thử lại.",
    };
  }
}

export async function loginUser(
  input: LoginInput,
): Promise<AuthResult<AuthUser>> {
  try {
    const identifier = input.identifier.trim();
    const user = await db.user.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier.toLowerCase() }],
      },
    });
    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(input.password, user.passwordHash))
    )
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Thông tin đăng nhập không chính xác.",
      };
    if (user.status !== "ACTIVE")
      return {
        success: false,
        code: "USER_BLOCKED",
        error: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
      };
    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone || "",
        email: user.email,
        role: user.role,
        status: user.status,
        loyaltyPoints: user.loyaltyPoints,
        image: user.image,
      },
    };
  } catch {
    // Không chuyển sang users.json: tài khoản bị thu hồi quyền phải bị chặn ngay.
    return {
      success: false,
      code: "SERVICE_UNAVAILABLE",
      error: "Không thể kết nối hệ thống tài khoản. Vui lòng thử lại.",
    };
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await db.user.findUnique({ where: { id }, select: publicUser });
  return user?.status === "ACTIVE"
    ? { ...user, phone: user.phone || "" }
    : null;
}
