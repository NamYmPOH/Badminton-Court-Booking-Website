import { z } from "zod";

/**
 * Validate biến môi trường khi khởi động.
 * Thêm biến mới vào schema tương ứng khi cần.
 */

const serverSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL phải là URL hợp lệ"),
  DIRECT_URL: z.string().url().optional(),
  REDIS_URL: z.string().min(1, "REDIS_URL không được trống"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET phải >= 16 ký tự"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SYSTEM_SENDER_EMAIL: z.string().email().optional(),
  VNPAY_TMN_CODE: z.string().optional(),
  VNPAY_HASH_SECRET: z.string().optional(),
  VNPAY_URL: z.string().url().optional(),
  VNPAY_RETURN_URL: z.string().url().optional(),
  CRON_SECRET: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

/** Server-side env — chỉ import trong code server */
export function getServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Biến môi trường server không hợp lệ:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Biến môi trường server không hợp lệ");
  }
  return parsed.data;
}

/** Client-side env — an toàn import ở client */
export function getClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error(
      "❌ Biến môi trường client không hợp lệ:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Biến môi trường client không hợp lệ");
  }
  return parsed.data;
}
