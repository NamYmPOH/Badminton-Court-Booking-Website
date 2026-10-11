-- Run after group-payment schema migration. No browser session is needed for expiry.
CREATE SCHEMA IF NOT EXISTS smashbook_private;
REVOKE ALL ON SCHEMA smashbook_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION smashbook_private.expire_group_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  target record;
  affected integer := 0;
BEGIN
  FOR target IN
    SELECT b.id AS booking_id, g.id AS group_id
    FROM public."Booking" b
    JOIN public."BookingGroup" g ON g."bookingId" = b.id
    WHERE b.status = 'PENDING_PAYMENT'
      AND (b."expiresAt" <= CURRENT_TIMESTAMP OR b."expiresAt" IS NULL)
      AND g."closedAt" IS NULL
    ORDER BY b."expiresAt" NULLS FIRST
    LIMIT 100
    FOR UPDATE OF b, g SKIP LOCKED
  LOOP
    INSERT INTO public."GroupRefund" (id, "paymentId", amount, reason, status, "createdAt")
      SELECT 'expiry-' || p.id, p.id, p.amount,
        'Hết hạn giữ sân khi nhóm chưa hoàn tất thanh toán', 'PENDING', CURRENT_TIMESTAMP
      FROM public."Payment" p
      WHERE p."bookingId" = target.booking_id AND p.status = 'PAID'
      ON CONFLICT ("paymentId") DO NOTHING;
    UPDATE public."Payment" SET status = 'REFUND_PENDING'
      WHERE "bookingId" = target.booking_id AND status = 'PAID';
    UPDATE public."GroupPaymentIntent" SET status = 'CLOSED'
      WHERE "groupId" = target.group_id AND status = 'OPEN';
    UPDATE public."BookingGroup" SET "closedAt" = CURRENT_TIMESTAMP WHERE id = target.group_id;
    UPDATE public."BookingItem" SET status = 'EXPIRED'
      WHERE "bookingId" = target.booking_id AND status = 'HELD';
    UPDATE public."Booking" SET status = 'EXPIRED', "expiresAt" = NULL,
      "updatedAt" = CURRENT_TIMESTAMP,
      "cancelReason" = 'Hết hạn giữ sân khi nhóm chưa hoàn tất thanh toán',
      "paymentStatus" = CASE WHEN EXISTS (
        SELECT 1 FROM public."GroupRefund" r JOIN public."Payment" p ON p.id = r."paymentId"
        WHERE p."bookingId" = target.booking_id AND r.status = 'PENDING'
      ) THEN 'REFUND_PENDING'::public."PaymentStatus" ELSE "paymentStatus" END
      WHERE id = target.booking_id;
    affected := affected + 1;
  END LOOP;
  RETURN affected;
END;
$$;
REVOKE ALL ON FUNCTION smashbook_private.expire_group_bookings() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('smashbook-expire-groups', '* * * * *',
  'select smashbook_private.expire_group_bookings()');
