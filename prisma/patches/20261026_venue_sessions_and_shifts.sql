-- ==============================================================================
-- SmashBook Migration: Quản lý phiên sử dụng sân, ca trực nhân viên và bàn giao sân
-- Ngày tạo: 26/10/2026
-- Mô tả:
--   1. Thêm kiểu enum SessionStatus
--   2. Bổ sung các cột sessionStatus, overdueNotifiedAt, hasCashPayment, manualHandoverRequired vào bảng Booking
--   3. Bổ sung role, isActive, createdAt vào bảng VenueStaff
--   4. Tạo bảng StaffShift để quản lý ca làm việc
-- ==============================================================================

-- 1. Tạo kiểu enum SessionStatus nếu chưa tồn tại
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionStatus') THEN
    CREATE TYPE "SessionStatus" AS ENUM ('UPCOMING', 'IN_USE', 'OVERDUE_PENDING', 'COMPLETED');
  END IF;
END $$;

-- 2. Cập nhật bảng Booking
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "sessionStatus" "SessionStatus" NOT NULL DEFAULT 'UPCOMING',
  ADD COLUMN IF NOT EXISTS "overdueNotifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hasCashPayment" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "manualHandoverRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Booking_venueId_sessionStatus_idx" ON "Booking"("venueId", "sessionStatus");

-- 3. Cập nhật bảng VenueStaff
ALTER TABLE "VenueStaff"
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'RECEPTIONIST',
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "VenueStaff_venueId_isActive_idx" ON "VenueStaff"("venueId", "isActive");

-- 4. Tạo bảng StaffShift
CREATE TABLE IF NOT EXISTS "StaffShift" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StaffShift_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StaffShift_venueId_endedAt_idx" ON "StaffShift"("venueId", "endedAt");
CREATE INDEX IF NOT EXISTS "StaffShift_userId_endedAt_idx" ON "StaffShift"("userId", "endedAt");
