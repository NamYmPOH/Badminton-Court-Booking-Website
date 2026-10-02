import { NextResponse } from "next/server";

// ─────────────── AppError ───────────────
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─────────────── Response helpers ───────────────

/** Phản hồi thành công — { ok: true, data } */
export function apiOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, ...(meta ? { meta } : {}) });
}

/** Phản hồi lỗi — { ok: false, error: { code, message, fields? } } */
export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>
) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message, ...(fields ? { fields } : {}) },
    },
    { status }
  );
}

/** Bắt lỗi AppError hoặc trả 500 */
export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(
      error.code,
      error.message,
      error.statusCode,
      error.fields
    );
  }

  console.error("[API Error]", error);
  return apiError(
    "INTERNAL_ERROR",
    "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    500
  );
}
