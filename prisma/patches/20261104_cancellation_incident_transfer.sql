-- ==============================================================================
-- SmashBook Migration: Quản lý Hủy đơn, Đổi lịch, Chuyển nhượng & Báo cáo Sự cố
-- Ngày tạo: 04/11/2026
-- Mô tả:
--   1. Bổ sung trường forceMajeurePolicy vào bảng Venue
--   2. Bổ sung các trường giải trình hủy & chuyển nhượng vào bảng Booking
--   3. Tạo bảng BookingRescheduleHistory lưu lịch sử đổi lịch
--   4. Tạo bảng BookingTransferHistory lưu lịch sử chuyển nhượng sân
--   5. Tạo bảng BookingIncidentRequest lưu yêu cầu xử lý sự cố bất khả kháng
-- ==============================================================================

-- 1. Bổ sung forceMajeurePolicy cho Venue
ALTER TABLE "Venue"
  ADD COLUMN IF NOT EXISTS "forceMajeurePolicy" JSONB;

-- 2. Bổ sung các cột hủy & chuyển nhượng cho Booking
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "cancelExpectedRate" INTEGER,
  ADD COLUMN IF NOT EXISTS "cancelExpectedAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "cancelNonRefundable" INTEGER,
  ADD COLUMN IF NOT EXISTS "cancelPolicyVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelCalculation" JSONB,
  ADD COLUMN IF NOT EXISTS "cancelFirstSlotStartsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "transfereeName" TEXT,
  ADD COLUMN IF NOT EXISTS "transfereePhone" TEXT,
  ADD COLUMN IF NOT EXISTS "transfereeNote" TEXT,
  ADD COLUMN IF NOT EXISTS "transferredAt" TIMESTAMP(3);

-- 3. Tạo bảng BookingRescheduleHistory
CREATE TABLE IF NOT EXISTS "BookingRescheduleHistory" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "oldItemsSnapshot" JSONB NOT NULL,
  "newItemsSnapshot" JSONB NOT NULL,
  "oldTotal" INTEGER NOT NULL,
  "newTotal" INTEGER NOT NULL,
  "priceDifference" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BookingRescheduleHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingRescheduleHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookingRescheduleHistory_bookingId_createdAt_idx" ON "BookingRescheduleHistory"("bookingId", "createdAt");

-- 4. Tạo bảng BookingTransferHistory
CREATE TABLE IF NOT EXISTS "BookingTransferHistory" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "receiverName" TEXT NOT NULL,
  "receiverPhone" TEXT NOT NULL,
  "note" TEXT,
  "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BookingTransferHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingTransferHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookingTransferHistory_bookingId_transferredAt_idx" ON "BookingTransferHistory"("bookingId", "transferredAt");

-- 5. Tạo bảng BookingIncidentRequest
CREATE TABLE IF NOT EXISTS "BookingIncidentRequest" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestedByName" TEXT NOT NULL,
  "incidentType" TEXT NOT NULL,
  "requestType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "resolution" TEXT,
  "refundRate" INTEGER,
  "refundAmount" INTEGER,
  "confirmedById" TEXT,
  "confirmedByName" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BookingIncidentRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingIncidentRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookingIncidentRequest_bookingId_idx" ON "BookingIncidentRequest"("bookingId");
CREATE INDEX IF NOT EXISTS "BookingIncidentRequest_venueId_status_idx" ON "BookingIncidentRequest"("venueId", "status");

-- Cấu hình bảo mật Row Level Security (chỉ cho phép truy cập qua backend Prisma)
ALTER TABLE "BookingRescheduleHistory" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "BookingRescheduleHistory" FROM anon, authenticated;

ALTER TABLE "BookingTransferHistory" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "BookingTransferHistory" FROM anon, authenticated;

ALTER TABLE "BookingIncidentRequest" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "BookingIncidentRequest" FROM anon, authenticated;

