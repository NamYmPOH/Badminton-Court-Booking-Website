import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import type { AuthUser, RegisterInput, LoginInput } from "../types/auth";

interface StoredUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  role: "CUSTOMER" | "STAFF" | "OWNER" | "ADMIN";
  status: "ACTIVE" | "BLOCKED";
  loyaltyPoints: number;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");

function readLocalUsers(): StoredUser[] {
  try {
    if (!fs.existsSync(LOCAL_USERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(LOCAL_USERS_FILE, "utf-8");
    return JSON.parse(raw) as StoredUser[];
  } catch (error) {
    console.error("Failed to read local users file:", error);
    return [];
  }
}

function writeLocalUsers(users: StoredUser[]): void {
  try {
    const dir = path.dirname(LOCAL_USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write local users file:", error);
  }
}

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

/**
 * Đăng ký tài khoản người dùng mới
 */
export async function registerUser(
  input: RegisterInput
): Promise<AuthResult<AuthUser>> {
  const normalizedPhone = input.phone.trim();
  const normalizedEmail = input.email?.trim().toLowerCase() || null;
  const normalizedName = input.name.trim();

  // 1. Kiểm tra tồn tại trong Database (Prisma) hoặc Fallback Store
  try {
    // Thử truy vấn Prisma trước
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.phone === normalizedPhone) {
        return {
          success: false,
          error: "Số điện thoại này đã được đăng ký tài khoản.",
          code: "PHONE_EXISTS",
        };
      }
      if (normalizedEmail && existing.email === normalizedEmail) {
        return {
          success: false,
          error: "Địa chỉ email này đã được sử dụng.",
          code: "EMAIL_EXISTS",
        };
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const newUser = await db.user.create({
      data: {
        name: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
        loyaltyPoints: 0,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        image: true,
      },
    });

    return {
      success: true,
      data: {
        ...newUser,
        phone: newUser.phone ?? normalizedPhone,
      },
    };
  } catch (dbError) {
    // 2. Fallback nếu PostgreSQL chưa khởi động
    console.warn("PostgreSQL connection failed, using local persistent DB fallback:", (dbError as Error).message);

    const localUsers = readLocalUsers();
    const phoneExists = localUsers.some((u) => u.phone === normalizedPhone);
    if (phoneExists) {
      return {
        success: false,
        error: "Số điện thoại này đã được đăng ký tài khoản.",
        code: "PHONE_EXISTS",
      };
    }

    if (normalizedEmail) {
      const emailExists = localUsers.some((u) => u.email === normalizedEmail);
      if (emailExists) {
        return {
          success: false,
          error: "Địa chỉ email này đã được sử dụng.",
          code: "EMAIL_EXISTS",
        };
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const storedUser: StoredUser = {
      id: newId,
      name: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
      loyaltyPoints: 0,
      image: null,
      createdAt: now,
      updatedAt: now,
    };

    localUsers.push(storedUser);
    writeLocalUsers(localUsers);

    return {
      success: true,
      data: {
        id: storedUser.id,
        name: storedUser.name,
        phone: storedUser.phone,
        email: storedUser.email,
        role: storedUser.role,
        status: storedUser.status,
        loyaltyPoints: storedUser.loyaltyPoints,
        image: storedUser.image,
      },
    };
  }
}

/**
 * Đăng nhập người dùng bằng Số điện thoại hoặc Email
 */
export async function loginUser(
  input: LoginInput
): Promise<AuthResult<AuthUser>> {
  const identifier = input.identifier.trim();

  // 1. Thử xác thực với Database Prisma
  try {
    const user = await db.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier.toLowerCase() },
        ],
      },
    });

    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!isMatch) {
        return {
          success: false,
          error: "Mật khẩu không chính xác.",
          code: "INVALID_CREDENTIALS",
        };
      }

      if (user.status === "BLOCKED") {
        return {
          success: false,
          error: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ.",
          code: "USER_BLOCKED",
        };
      }

      return {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          phone: user.phone || identifier,
          email: user.email,
          role: user.role,
          status: user.status,
          loyaltyPoints: user.loyaltyPoints,
          image: user.image,
        },
      };
    }
  } catch (dbError) {
    console.warn("PostgreSQL query failed, trying local persistent DB:", (dbError as Error).message);
  }

  // 2. Thử xác thực với Local Store
  const localUsers = readLocalUsers();
  const foundUser = localUsers.find(
    (u) =>
      u.phone === identifier ||
      (u.email && u.email.toLowerCase() === identifier.toLowerCase())
  );

  if (!foundUser) {
    return {
      success: false,
      error: "Không tìm thấy tài khoản với thông tin đăng nhập này.",
      code: "USER_NOT_FOUND",
    };
  }

  const isMatch = await bcrypt.compare(input.password, foundUser.passwordHash);
  if (!isMatch) {
    return {
      success: false,
      error: "Mật khẩu không chính xác.",
      code: "INVALID_CREDENTIALS",
    };
  }

  if (foundUser.status === "BLOCKED") {
    return {
      success: false,
      error: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ.",
      code: "USER_BLOCKED",
    };
  }

  return {
    success: true,
    data: {
      id: foundUser.id,
      name: foundUser.name,
      phone: foundUser.phone,
      email: foundUser.email,
      role: foundUser.role,
      status: foundUser.status,
      loyaltyPoints: foundUser.loyaltyPoints,
      image: foundUser.image,
    },
  };
}

/**
 * Lấy thông tin người dùng theo ID
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        image: true,
      },
    });

    if (user) {
      return {
        ...user,
        phone: user.phone || "",
      };
    }
  } catch {
    // Fallback to local
  }

  const localUsers = readLocalUsers();
  const found = localUsers.find((u) => u.id === id);
  if (!found) return null;

  return {
    id: found.id,
    name: found.name,
    phone: found.phone,
    email: found.email,
    role: found.role,
    status: found.status,
    loyaltyPoints: found.loyaltyPoints,
    image: found.image,
  };
}
