-- ==============================================================================
-- SmashBook Migration: Hoàn thiện phân quyền, vận hành, đơn tại quầy và hủy/hoàn tiền
-- Ngày tạo: 28/10/2026
-- Mô tả:
--   1. Bổ sung trường quản lý nguồn gốc đơn và nhân viên vào Booking:
--      - createdByStaffId: ID nhân viên tạo đơn tại quầy
--      - checkedInById: ID nhân viên xác nhận nhận sân
--      - completedById: ID nhân viên xác nhận hoàn tất bàn giao sân
--   2. Bổ sung các trường quy trình hủy và hoàn tiền vào Booking:
--      - cancelRequestedAt: Thời điểm yêu cầu hủy
--      - cancelApprovedAt: Thời điểm duyệt hủy đơn
--      - refundAmountApproved: Số tiền hoàn được duyệt
--      - refundCompletedAt: Thời điểm ghi nhận đã hoàn tiền
--      - refundCompletedById: ID người ghi nhận hoàn tiền
-- ==============================================================================

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "createdByStaffId" TEXT,
  ADD COLUMN IF NOT EXISTS "checkedInById" TEXT,
  ADD COLUMN IF NOT EXISTS "completedById" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelRequestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelApprovedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refundAmountApproved" INTEGER,
  ADD COLUMN IF NOT EXISTS "refundCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refundCompletedById" TEXT;

CREATE INDEX IF NOT EXISTS "Booking_createdByStaffId_idx" ON "Booking"("createdByStaffId");
CREATE INDEX IF NOT EXISTS "Booking_source_idx" ON "Booking"("source");
