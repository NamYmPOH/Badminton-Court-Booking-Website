-- SmashBook: SQL Migration Patch - Bổ sung các mô hình nghiệp vụ mở rộng
-- Ngày tạo: 21/10/2026
-- Phạm vi: Lịch hoạt động tuần, Ngoại lệ ngày nghỉ, Chính sách hủy phiên bản,
--         Hóa đơn/Biên lai nội bộ, Phiên sân & Phụ thu, Quy trình hoàn tiền kiểm soát, Vé điện tử QR
-- Thiết kế an toàn: Tất cả trường và bảng mới đều nullable/default, dùng IF NOT EXISTS.
-- CHÚ Ý: Không tự ý chạy trên DB Production thật nếu chưa xác nhận DB test.

BEGIN;

-- 1. Bổ sung trường cho PricingRule và Booking
ALTER TABLE public."PricingRule"
  ADD COLUMN IF NOT EXISTS "courtId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PricingRule_courtId_fkey'
  ) THEN
    ALTER TABLE public."PricingRule"
      ADD CONSTRAINT "PricingRule_courtId_fkey"
      FOREIGN KEY ("courtId") REFERENCES public."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PricingRule_courtId_idx" ON public."PricingRule"("courtId");

ALTER TABLE public."Booking"
  ADD COLUMN IF NOT EXISTS "cancellationPolicyId" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationSnapshot" JSONB;

-- 2. Bảng Lịch hoạt động chi tiết theo thứ (VenueWeeklySchedule)
CREATE TABLE IF NOT EXISTS public."VenueWeeklySchedule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "venueId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "openMin" INTEGER NOT NULL,
  "closeMin" INTEGER NOT NULL,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueWeeklySchedule_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES public."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "VenueWeeklySchedule_venueId_dayOfWeek_key" ON public."VenueWeeklySchedule"("venueId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "VenueWeeklySchedule_venueId_idx" ON public."VenueWeeklySchedule"("venueId");

-- 3. Bảng Ngoại lệ lịch theo ngày cụ thể (VenueDateException)
CREATE TABLE IF NOT EXISTS public."VenueDateException" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "venueId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "openMin" INTEGER,
  "closeMin" INTEGER,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueDateException_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES public."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "VenueDateException_venueId_date_key" ON public."VenueDateException"("venueId", "date");
CREATE INDEX IF NOT EXISTS "VenueDateException_venueId_date_idx" ON public."VenueDateException"("venueId", "date");

-- 4. Bảng Chính sách hủy có phiên bản (CancellationPolicy)
CREATE TABLE IF NOT EXISTS public."CancellationPolicy" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "venueId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "freeCancelHours" INTEGER NOT NULL DEFAULT 24,
  "lateCancelHours" INTEGER NOT NULL DEFAULT 4,
  "partialRefundPercent" INTEGER NOT NULL DEFAULT 50,
  "nonRefundableHours" INTEGER NOT NULL DEFAULT 4,
  "allowCoachRefund" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CancellationPolicy_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES public."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CancellationPolicy_venueId_idx" ON public."CancellationPolicy"("venueId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Booking_cancellationPolicyId_fkey'
  ) THEN
    ALTER TABLE public."Booking"
      ADD CONSTRAINT "Booking_cancellationPolicyId_fkey"
      FOREIGN KEY ("cancellationPolicyId") REFERENCES public."CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 5. Bảng Hóa đơn / Biên lai nội bộ (InternalInvoice)
CREATE TABLE IF NOT EXISTS public."InternalInvoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceNumber" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "issuedById" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "subtotal" INTEGER NOT NULL,
  "discount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "paidAmount" INTEGER NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT,
  "venueName" TEXT NOT NULL,
  "venueAddress" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ISSUED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InternalInvoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InternalInvoice_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES public."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "InternalInvoice_invoiceNumber_key" ON public."InternalInvoice"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "InternalInvoice_bookingId_idx" ON public."InternalInvoice"("bookingId");
CREATE INDEX IF NOT EXISTS "InternalInvoice_venueId_idx" ON public."InternalInvoice"("venueId");
CREATE INDEX IF NOT EXISTS "InternalInvoice_issuedAt_idx" ON public."InternalInvoice"("issuedAt");

-- 6. Bảng Phiên sân thực tế (CourtSession)
CREATE TABLE IF NOT EXISTS public."CourtSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bookingItemId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "courtId" TEXT NOT NULL,
  "operatorId" TEXT,
  "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkOutAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourtSession_bookingItemId_fkey" FOREIGN KEY ("bookingItemId") REFERENCES public."BookingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CourtSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CourtSession_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES public."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CourtSession_bookingItemId_key" ON public."CourtSession"("bookingItemId");
CREATE INDEX IF NOT EXISTS "CourtSession_bookingId_idx" ON public."CourtSession"("bookingId");
CREATE INDEX IF NOT EXISTS "CourtSession_courtId_idx" ON public."CourtSession"("courtId");
CREATE INDEX IF NOT EXISTS "CourtSession_status_idx" ON public."CourtSession"("status");

-- 7. Bảng Phụ thu phiên sân (CourtSurcharge)
CREATE TABLE IF NOT EXISTS public."CourtSurcharge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'UNPAID',
  "paymentMethod" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourtSurcharge_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."CourtSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CourtSurcharge_sessionId_idx" ON public."CourtSurcharge"("sessionId");
CREATE INDEX IF NOT EXISTS "CourtSurcharge_bookingId_idx" ON public."CourtSurcharge"("bookingId");
CREATE INDEX IF NOT EXISTS "CourtSurcharge_venueId_idx" ON public."CourtSurcharge"("venueId");

-- 8. Bảng Yêu cầu hoàn tiền (RefundRequest)
CREATE TABLE IF NOT EXISTS public."RefundRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "paymentId" TEXT,
  "requestedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "amount" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "bankAccountNumber" TEXT,
  "bankAccountName" TEXT,
  "bankName" TEXT,
  "rejectedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefundRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RefundRequest_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RefundRequest_bookingId_idx" ON public."RefundRequest"("bookingId");
CREATE INDEX IF NOT EXISTS "RefundRequest_status_idx" ON public."RefundRequest"("status");

-- 9. Bảng Giao dịch hoàn tiền thực tế (RefundTransaction)
CREATE TABLE IF NOT EXISTS public."RefundTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestId" TEXT NOT NULL,
  "paymentId" TEXT,
  "amount" INTEGER NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'MANUAL_BANK_TRANSFER',
  "bankRef" TEXT,
  "proofImage" TEXT,
  "processedById" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefundTransaction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."RefundRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RefundTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RefundTransaction_requestId_idx" ON public."RefundTransaction"("requestId");

-- 10. Bảng Vé điện tử QR (Ticket)
CREATE TABLE IF NOT EXISTS public."Ticket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ticketCode" TEXT NOT NULL,
  "ticketNonce" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "bookingItemId" TEXT,
  "groupShareId" TEXT,
  "holderName" TEXT NOT NULL,
  "holderPhone" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'UNUSED',
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3) NOT NULL,
  "checkedInAt" TIMESTAMP(3),
  "checkedInById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ticket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Ticket_bookingItemId_fkey" FOREIGN KEY ("bookingItemId") REFERENCES public."BookingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_ticketCode_key" ON public."Ticket"("ticketCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_ticketNonce_key" ON public."Ticket"("ticketNonce");
CREATE INDEX IF NOT EXISTS "Ticket_bookingId_idx" ON public."Ticket"("bookingId");
CREATE INDEX IF NOT EXISTS "Ticket_status_idx" ON public."Ticket"("status");
CREATE INDEX IF NOT EXISTS "Ticket_validFrom_validTo_idx" ON public."Ticket"("validFrom", "validTo");

COMMIT;
