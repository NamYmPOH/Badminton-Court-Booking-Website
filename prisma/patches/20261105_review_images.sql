-- Ảnh chỉ được tạo trong transaction cùng đánh giá đã xác minh quyền đặt sân.
BEGIN;
CREATE TABLE IF NOT EXISTS "ReviewImage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reviewId" TEXT NOT NULL REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "mimeType" TEXT NOT NULL CHECK ("mimeType" IN ('image/jpeg', 'image/png', 'image/webp')),
  "data" BYTEA NOT NULL CHECK (octet_length("data") BETWEEN 1 AND 2097152),
  "sha256" TEXT NOT NULL,
  "position" INTEGER NOT NULL CHECK ("position" BETWEEN 0 AND 2),
  UNIQUE ("reviewId", "position")
);
-- Đọc/ghi qua backend Prisma, không cấp API công khai vào dữ liệu nhị phân.
ALTER TABLE "ReviewImage" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ReviewImage" FROM anon, authenticated;
COMMIT;
