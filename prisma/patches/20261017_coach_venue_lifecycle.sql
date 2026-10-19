-- SmashBook: Migration Patch cho Vòng đời liên kết Huấn luyện viên - Cơ sở (CoachVenue)
-- Ngày: 17/10/2026
-- An toàn, tương thích ngược 100% với các đơn hàng và dữ liệu hiện hữu.

BEGIN;

-- 1. Bổ sung giá trị SUSPENDED vào enum CoachVenueStatus nếu chưa có
DO $$ BEGIN
  ALTER TYPE "CoachVenueStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Thêm các cột lưu vết duyệt cơ sở vào bảng CoachVenue
ALTER TABLE "CoachVenue"
  ADD COLUMN IF NOT EXISTS "reviewReason" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewedById" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

COMMIT;
