BEGIN;
ALTER TABLE "GroupRefund" DROP CONSTRAINT IF EXISTS "GroupRefund_valid_status";
ALTER TABLE "GroupRefund" ADD COLUMN IF NOT EXISTS "completedAmount" INTEGER NOT NULL DEFAULT 0;
-- Logic cũ có thể đã đóng một khoản hoàn thiếu hoặc tăng amount sau khi đóng.
-- Không suy ra tiền đã chi từ trạng thái COMPLETED; giữ chứng từ để đối soát.
UPDATE "GroupRefund" SET "status" = 'REVIEW_REQUIRED'
WHERE "status" = 'COMPLETED' AND "completedAmount" = 0;
CREATE TABLE IF NOT EXISTS "RefundDisbursement" (
  "id" TEXT PRIMARY KEY,
  "reference" TEXT NOT NULL UNIQUE CHECK (length("reference") BETWEEN 5 AND 160 AND "reference" = upper(btrim("reference"))),
  "refundId" TEXT NOT NULL REFERENCES "GroupRefund"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "amount" INTEGER NOT NULL CHECK ("amount" > 0),
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RefundDisbursement_refundId_idx" ON "RefundDisbursement"("refundId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GroupRefund_amount_bounds'
    AND conrelid = '"GroupRefund"'::regclass) THEN
    ALTER TABLE "GroupRefund" ADD CONSTRAINT "GroupRefund_amount_bounds"
      CHECK ("amount" > 0 AND "completedAmount" >= 0 AND "completedAmount" <= "amount");
  END IF;
END $$;
ALTER TABLE "GroupRefund" ADD CONSTRAINT "GroupRefund_valid_status"
  CHECK ("status" IN ('PENDING', 'COMPLETED', 'REVIEW_REQUIRED'));
-- Sau hủy HLV, thành viên có thể không còn nghĩa vụ trả tiền.
ALTER TABLE "GroupShare" DROP CONSTRAINT IF EXISTS "GroupShare_positive_amount";
ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_positive_amount" CHECK ("amount" >= 0);
ALTER TABLE "RefundDisbursement" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "RefundDisbursement" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "RefundDisbursement" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "RefundDisbursement" FROM authenticated;
  END IF;
END $$;
COMMIT;
