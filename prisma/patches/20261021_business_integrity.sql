-- Chạy sau 20261021_extended_business_models.sql trên DB test trước.
-- Nếu đã có dữ liệu trùng, lệnh sẽ thất bại và rollback; phải đối soát thủ công, không tự xóa.
BEGIN;
ALTER TABLE public."CourtSurcharge" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "CourtSurcharge_requestId_key" ON public."CourtSurcharge" ("requestId");
CREATE UNIQUE INDEX IF NOT EXISTS "InternalInvoice_one_issued_per_booking" ON public."InternalInvoice" ("bookingId") WHERE status = 'ISSUED';
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_one_single_booking" ON public."Ticket" ("bookingId") WHERE "groupShareId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_one_group_share" ON public."Ticket" ("groupShareId") WHERE "groupShareId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "RefundTransaction_one_completed_request" ON public."RefundTransaction" ("requestId") WHERE status = 'COMPLETED';
CREATE UNIQUE INDEX IF NOT EXISTS "RefundRequest_one_full_cancellation" ON public."RefundRequest" ("bookingId") WHERE type = 'FULL_CANCELLATION' AND status IN ('REQUESTED','PROCESSING','COMPLETED');
COMMIT;
