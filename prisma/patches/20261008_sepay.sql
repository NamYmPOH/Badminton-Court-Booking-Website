-- Dành cho DB ĐÃ CÓ các bảng trong schema.prisma cũ.
-- Không xóa dữ liệu. Chạy bằng tài khoản quản trị trong SQL editor của DB.
-- Nếu chưa có bảng Booking, dùng hướng dẫn docs/sepay-vercel.md cho DB trống.
BEGIN;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_requestId_key" ON "Booking"("requestId");
CREATE TABLE IF NOT EXISTS "SepayReceipt" (
  "transactionId" TEXT NOT NULL PRIMARY KEY,
  "fingerprint" TEXT NOT NULL,
  "bookingCode" TEXT,
  "result" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SepayReceipt_result_receivedAt_idx" ON "SepayReceipt"("result", "receivedAt");
-- Bảo vệ dữ liệu ngân hàng nếu DB có REST API công khai. Backend dùng role server.
ALTER TABLE "SepayReceipt" ENABLE ROW LEVEL SECURITY;
COMMIT;
