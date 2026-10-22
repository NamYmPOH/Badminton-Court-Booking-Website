-- Migration patch: Bổ sung bố cục sơ đồ và mô tả sân con (Court)
-- Ngày: 2026-10-22
-- Kiểm tra tương thích: An toàn với dữ liệu cũ (sử dụng IF NOT EXISTS và DEFAULT).
-- Lưu ý: Không tự chạy trực tiếp trên Supabase production; chạy trên DB test trước và kiểm tra tính toàn vẹn.

BEGIN;

-- 1. Bổ sung mô tả sân con
ALTER TABLE public."Court" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- 2. Bổ sung vị trí hàng trên sơ đồ (1-indexed)
ALTER TABLE public."Court" ADD COLUMN IF NOT EXISTS "positionRow" INTEGER DEFAULT 1;

-- 3. Bổ sung vị trí cột trên sơ đồ (1-indexed)
ALTER TABLE public."Court" ADD COLUMN IF NOT EXISTS "positionCol" INTEGER DEFAULT 1;

-- 4. Bổ sung hướng xoay của sân trên sơ đồ: HORIZONTAL (ngang) | VERTICAL (dọc)
ALTER TABLE public."Court" ADD COLUMN IF NOT EXISTS "orientation" TEXT DEFAULT 'HORIZONTAL';

COMMIT;
