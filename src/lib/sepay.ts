import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export class PaymentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function getSepayConfig(env = process.env) {
  const schema = z.object({
    SEPAY_AUTH_MODE: z.literal("hmac").default("hmac"),
    SEPAY_WEBHOOK_SECRET: z.string().min(16),
    BANK_BIN: z.string().regex(/^\d{6}$/),
    BANK_ACCOUNT_NO: z.string().regex(/^\d{6,19}$/),
    BANK_ACCOUNT_NAME: z.string().trim().min(1),
    SEPAY_BANK_GATEWAY: z.string().trim().min(1),
    SEPAY_SUB_ACCOUNT: z.string().default(""),
  });
  const parsed = schema.safeParse(env);
  if (!parsed.success) throw new PaymentError(503, "Thanh toán chưa được cấu hình đầy đủ.");
  return parsed.data;
}
export type SepayConfig = ReturnType<typeof getSepayConfig>;

export function verifySepaySignature(raw: Buffer, headers: Headers, secret: string, now = Date.now()) {
  const timestamp = headers.get("x-sepay-timestamp") || "";
  const signature = headers.get("x-sepay-signature") || "";
  if (!/^\d{1,12}$/.test(timestamp) || Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 300
    || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(timestamp + ".").update(raw).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const eventSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  gateway: z.string().min(1).max(100), accountNumber: z.string().min(1).max(100),
  subAccount: z.string().max(100).nullish(),
  content: z.string().max(10000), transferType: z.enum(["in", "out"]),
  transferAmount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).passthrough();
export type SepayEvent = z.infer<typeof eventSchema>;
export function parseSepayEvent(raw: Buffer) {
  try {
    const parsed = eventSchema.safeParse(JSON.parse(raw.toString("utf8")));
    if (parsed.success) return parsed.data;
  } catch { /* Không chấp nhận JSON hỏng. */ }
  throw new PaymentError(400, "Payload webhook không hợp lệ.");
}

export function extractBookingCode(content: string) {
  const codes = new Set(Array.from(content.matchAll(/(?<![A-Z0-9])DATSAN(\d{1,10})(?![A-Z0-9])/gi))
    .map(match => `DATSAN${match[1]}`));
  return codes.size === 1 ? Array.from(codes)[0] : null;
}

export function eventFingerprint(event: SepayEvent) {
  // Bỏ khác biệt khoảng trắng JSON và các trường không dùng để đối soát.
  return createHash("sha256").update(JSON.stringify([
    event.accountNumber, event.gateway.toLowerCase(), event.subAccount || "",
    event.content, event.transferType, event.transferAmount,
  ])).digest("hex");
}

export function createVietQrUrl(amount: number, code: string, config: SepayConfig) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || !/^DATSAN\d{1,10}$/.test(code)) {
    throw new PaymentError(400, "Thông tin thanh toán không hợp lệ.");
  }
  const url = new URL(`https://img.vietqr.io/image/${config.BANK_BIN}-${config.BANK_ACCOUNT_NO}-compact2.png`);
  url.search = new URLSearchParams({ amount: String(amount), addInfo: code, accountName: config.BANK_ACCOUNT_NAME }).toString();
  return url.toString();
}

// Đọc bytes gốc và giới hạn kích thước trước khi tính chữ ký.
export async function readPaymentBody(request: Request, limit = 65536) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new PaymentError(415, "Yêu cầu Content-Type application/json.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new PaymentError(400, "Thiếu body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new PaymentError(413, "Body quá lớn."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export function paymentErrorResponse(error: unknown) {
  if (error instanceof PaymentError) return Response.json({ success: false, message: error.message }, { status: error.status });
  // Không log connection string, secret hoặc nội dung giao dịch ngân hàng.
  console.error("Payment operation failed; no success acknowledgement sent.");
  return Response.json({ success: false, message: "Không xử lý được yêu cầu. Vui lòng thử lại." }, { status: 500 });
}
