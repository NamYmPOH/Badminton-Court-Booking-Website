-- ==============================================================================
-- SmashBook: Đồng bộ hết hạn giữ chỗ đơn nhóm (Group Payment Expiry)
-- Cập nhật ngày: 19/10/2026
-- Bổ sung giải phóng lịch HLV, giải phóng ưu đãi đối tác (OfferUsage)
-- và xử lý hoàn nốt phần tiền còn lại khi Payment đã ở REFUND_PENDING.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS smashbook_private;
REVOKE ALL ON SCHEMA smashbook_private FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 1. Hàm Audit chỉ đọc: kiểm tra danh sách đơn hết hạn mà KHÔNG sửa đổi dữ liệu
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION smashbook_private.audit_expired_candidates()
RETURNS TABLE (
  booking_id text,
  booking_code text,
  group_id text,
  payment_status public."PaymentStatus",
  expires_at timestamp(3),
  total_paid bigint,
  has_cash_approved boolean,
  held_courts_count bigint,
  held_coaches_count bigint,
  reserved_offers_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    b.id AS booking_id,
    b.code AS booking_code,
    g.id AS group_id,
    b."paymentStatus" AS payment_status,
    b."expiresAt" AS expires_at,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status IN ('PAID', 'REFUND_PENDING')), 0)::bigint AS total_paid,
    EXISTS (SELECT 1 FROM public."GroupShare" s WHERE s."groupId" = g.id AND s."cashApprovedAt" IS NOT NULL) AS has_cash_approved,
    (SELECT COUNT(*) FROM public."BookingItem" bi WHERE bi."bookingId" = b.id AND bi.status = 'HELD')::bigint AS held_courts_count,
    (SELECT COUNT(*) FROM public."CoachBooking" cb JOIN public."BookingItem" bi ON bi.id = cb."bookingItemId" WHERE bi."bookingId" = b.id AND cb.status IN ('HELD', 'CONFIRMED'))::bigint AS held_coaches_count,
    (SELECT COUNT(*) FROM public."OfferUsage" ou WHERE ou."bookingId" = b.id AND ou.state = 'RESERVED')::bigint AS reserved_offers_count
  FROM public."Booking" b
  JOIN public."BookingGroup" g ON g."bookingId" = b.id
  LEFT JOIN public."Payment" p ON p."bookingId" = b.id
  WHERE b.status = 'PENDING_PAYMENT'
    AND b."paymentStatus" != 'PAID'
    AND g."closedAt" IS NULL
    AND (
      (b."expiresAt" IS NOT NULL AND b."expiresAt" <= CURRENT_TIMESTAMP)
      OR
      (b."expiresAt" IS NULL AND NOT EXISTS (
        SELECT 1 FROM public."GroupShare" s WHERE s."groupId" = g.id AND s."cashApprovedAt" IS NOT NULL
      ))
    )
  GROUP BY b.id, b.code, g.id, b."paymentStatus", b."expiresAt"
  ORDER BY b."expiresAt" NULLS FIRST;
$$;
REVOKE ALL ON FUNCTION smashbook_private.audit_expired_candidates() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. Hàm xử lý hết hạn đơn nhóm an toàn, nguyên tử và chạy lặp an toàn (Idempotent)
-- ------------------------------------------------------------------------------
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
      AND b."paymentStatus" != 'PAID'
      AND g."closedAt" IS NULL
      AND (
        (b."expiresAt" IS NOT NULL AND b."expiresAt" <= CURRENT_TIMESTAMP)
        OR
        (b."expiresAt" IS NULL AND NOT EXISTS (
          SELECT 1 FROM public."GroupShare" s WHERE s."groupId" = g.id AND s."cashApprovedAt" IS NOT NULL
        ))
      )
    ORDER BY b."expiresAt" NULLS FIRST
    LIMIT 100
    FOR UPDATE OF b, g SKIP LOCKED
  LOOP
    -- 1. Tạo hoặc cập nhật GroupRefund để bảo đảm hoàn đủ 100% tiền thực thu cho các khoản thanh toán
    -- Xử lý cả Payment PAID lẫn Payment REFUND_PENDING (đã hoàn 1 phần trước đó do HLV hủy)
    INSERT INTO public."GroupRefund" (id, "paymentId", amount, reason, status, "createdAt")
      SELECT 'expiry-' || p.id, p.id, p.amount,
        'Hết hạn giữ sân khi nhóm chưa hoàn tất thanh toán', 'PENDING', CURRENT_TIMESTAMP
      FROM public."Payment" p
      WHERE p."bookingId" = target.booking_id AND p.status IN ('PAID', 'REFUND_PENDING')
      ON CONFLICT ("paymentId") DO UPDATE
        SET amount = EXCLUDED.amount,
            reason = public."GroupRefund".reason || '; Bổ sung hoàn tiền khi đơn nhóm hết hạn',
            status = 'PENDING'
        WHERE public."GroupRefund".amount < EXCLUDED.amount;

    -- 2. Cập nhật Payment sang REFUND_PENDING
    UPDATE public."Payment" SET status = 'REFUND_PENDING'
      WHERE "bookingId" = target.booking_id AND status = 'PAID';

    -- 3. Đóng các intent thanh toán đang mở
    UPDATE public."GroupPaymentIntent" SET status = 'CLOSED'
      WHERE "groupId" = target.group_id AND status = 'OPEN';

    -- 4. Đóng nhóm đặt sân
    UPDATE public."BookingGroup" SET "closedAt" = CURRENT_TIMESTAMP WHERE id = target.group_id;

    -- 5. Giải phóng sân (BookingItem: HELD -> EXPIRED)
    UPDATE public."BookingItem" SET status = 'EXPIRED'
      WHERE "bookingId" = target.booking_id AND status = 'HELD';

    -- 6. Giải phóng lịch HLV (CoachBooking: HELD / CONFIRMED -> CANCELLED)
    -- Không chạm vào lịch đã hoàn thành (COMPLETED) hoặc đã hủy trước đó
    UPDATE public."CoachBooking" cb
    SET status = 'CANCELLED',
        "cancelledAt" = CURRENT_TIMESTAMP,
        "cancelReason" = 'Hết hạn giữ sân khi nhóm chưa hoàn tất thanh toán',
        "updatedAt" = CURRENT_TIMESTAMP
    FROM public."BookingItem" bi
    WHERE cb."bookingItemId" = bi.id
      AND bi."bookingId" = target.booking_id
      AND cb.status IN ('HELD', 'CONFIRMED');

    -- 7. Giải phóng ngân sách ưu đãi đối tác (OfferUsage: RESERVED -> RELEASED)
    -- TUYỆT ĐỐI không chạm vào CONSUMED
    UPDATE public."OfferUsage"
    SET state = 'RELEASED',
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "bookingId" = target.booking_id
      AND state = 'RESERVED';

    -- 8. Cập nhật Booking sang EXPIRED
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

-- ------------------------------------------------------------------------------
-- 3. Đặt lịch tự động qua pg_cron (mỗi 1 phút)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('smashbook-expire-groups', '* * * * *',
  'select smashbook_private.expire_group_bookings()');

-- ==============================================================================
-- HƯỚNG DẪN ROLLBACK (KHI CẦN):
--   SELECT cron.unschedule('smashbook-expire-groups');
--   DROP FUNCTION IF EXISTS smashbook_private.expire_group_bookings();
--   DROP FUNCTION IF EXISTS smashbook_private.audit_expired_candidates();
-- ==============================================================================
