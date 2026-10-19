-- SmashBook: Migration Patch cho Chứng từ Voucher (VoucherUsage)
-- Ngày: 19/10/2026
-- Đảm bảo mỗi voucher chỉ được ghi nhận một lần duy nhất cho mỗi đơn đặt sân
-- Chống race condition và trùng lặp bộ đếm usedCount.

BEGIN;

CREATE TABLE IF NOT EXISTS public."VoucherUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "voucherId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoucherUsage_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES public."Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VoucherUsage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "VoucherUsage_voucherId_bookingId_key" ON public."VoucherUsage"("voucherId", "bookingId");
CREATE INDEX IF NOT EXISTS "VoucherUsage_bookingId_idx" ON public."VoucherUsage"("bookingId");
CREATE INDEX IF NOT EXISTS "VoucherUsage_voucherId_idx" ON public."VoucherUsage"("voucherId");

COMMIT;
