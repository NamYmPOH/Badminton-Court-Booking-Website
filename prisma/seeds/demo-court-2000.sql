-- SmashBook: 1 cơ sở demo, 1 sân, 2.000 VND/giờ cả tuần.
-- Chạy toàn bộ trong Supabase SQL Editor. Không tạo đơn/thanh toán giả.
-- Nếu cần chọn chủ sân cụ thể, điền ID User vào demo_owner_id bên dưới.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $demo$
DECLARE
  demo_owner_id text := ''; -- Tùy chọn: ID của User ACTIVE có role OWNER hoặc ADMIN.
  venue_key constant text := 'smashbook-demo-2000-venue';
  court_key constant text := 'smashbook-demo-2000-court-1';
  venue_slug constant text := 'san-demo-2000';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('smashbook-demo-2000-seed'));

  IF EXISTS (SELECT 1 FROM public."Venue" WHERE slug = venue_slug AND id <> venue_key)
     OR EXISTS (SELECT 1 FROM public."Venue" WHERE id = venue_key AND slug <> venue_slug)
     OR EXISTS (SELECT 1 FROM public."Court" WHERE id = court_key AND "venueId" <> venue_key)
     OR EXISTS (SELECT 1 FROM public."PricingRule"
                WHERE id IN ('smashbook-demo-2000-weekdays', 'smashbook-demo-2000-weekend')
                  AND "venueId" <> venue_key) THEN
    RAISE EXCEPTION 'ID/slug demo đã thuộc dữ liệu khác. Dừng để không ghi đè.';
  END IF;

  -- Chạy lại giữ nguyên chủ sân. Lần đầu ưu tiên chủ cơ sở group-trial.
  IF demo_owner_id = '' THEN
    SELECT u.id INTO demo_owner_id
      FROM public."Venue" v JOIN public."User" u ON u.id = v."ownerId"
      WHERE (v.id = venue_key OR v.slug = 'group-trial')
        AND u.status = 'ACTIVE' AND u.role IN ('OWNER', 'ADMIN')
      ORDER BY (v.id = venue_key) DESC LIMIT 1;
  END IF;
  -- Chỉ tự chọn tài khoản khác khi có đúng một người phù hợp.
  IF demo_owner_id IS NULL OR demo_owner_id = '' THEN
    IF (SELECT count(*) FROM public."User"
        WHERE status = 'ACTIVE' AND role IN ('OWNER', 'ADMIN')) = 1 THEN
      SELECT id INTO demo_owner_id FROM public."User"
        WHERE status = 'ACTIVE' AND role IN ('OWNER', 'ADMIN');
    ELSE
      RAISE EXCEPTION 'Hãy điền demo_owner_id bằng ID User ACTIVE có role OWNER/ADMIN rồi chạy lại toàn bộ SQL.';
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."User"
                 WHERE id = demo_owner_id AND status = 'ACTIVE' AND role IN ('OWNER', 'ADMIN')) THEN
    RAISE EXCEPTION 'Chủ sân không hợp lệ: cần User ACTIVE có role OWNER hoặc ADMIN.';
  END IF;

  -- Không tự xóa sân/biểu giá mà người vận hành đã thêm vào cơ sở demo.
  IF EXISTS (SELECT 1 FROM public."Court" WHERE "venueId" = venue_key AND id <> court_key)
     OR EXISTS (SELECT 1 FROM public."PricingRule" WHERE "venueId" = venue_key
                AND id NOT IN ('smashbook-demo-2000-weekdays', 'smashbook-demo-2000-weekend')) THEN
    RAISE EXCEPTION 'Cơ sở demo đã có sân/biểu giá bổ sung. Hãy kiểm tra thủ công trước khi chạy lại.';
  END IF;

  INSERT INTO public."Venue" (
    id, slug, name, sport, description, address, district, province, lat, lng, phone,
    "coverUrl", images, amenities, "openMin", "closeMin", "slotMinutes",
    "minBookingMin", "maxBookingMin", "advanceDays", "cancelBeforeHours",
    "paymentMode", status, "priceFrom", "ratingAvg", "ratingCount",
    "ownerId", "createdAt", "updatedAt"
  ) VALUES (
    venue_key, venue_slug, 'Sân Demo SmashBook - 2.000đ/giờ', 'BADMINTON',
    'Cơ sở thử nghiệm chức năng đặt sân và thanh toán. Không phải địa điểm phục vụ thực tế. Giá 2.000 VND/giờ, tất cả các ngày.',
    'Địa điểm demo - không phục vụ chơi thực tế', 'Cầu Giấy', 'Hà Nội',
    21.036, 105.790, '', '/images/courts/court-1.svg',
    ARRAY['/images/courts/court-1.svg'], ARRAY[]::text[],
    360, 1440, 30, 60, 240, 30, 4,
    'ONLINE_FULL', 'ACTIVE', 2000, 0, 0, demo_owner_id, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    "priceFrom" = 2000, "openMin" = 360, "closeMin" = 1440,
    "slotMinutes" = 30, "minBookingMin" = 60, "maxBookingMin" = 240,
    "paymentMode" = 'ONLINE_FULL', status = 'ACTIVE', "updatedAt" = now();

  INSERT INTO public."Court" (id, "venueId", name, "sortOrder", surface, status)
    VALUES (court_key, venue_key, 'Sân 1 - Demo', 0, 'Sân thử nghiệm', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';

  -- Hai dòng để giao diện hiện tại hiển thị đúng Thứ 2–6 và Thứ 7–Chủ nhật.
  INSERT INTO public."PricingRule"
    (id, "venueId", label, "daysOfWeek", "startMin", "endMin", "walkInPrice", "fixedPrice")
  VALUES
    ('smashbook-demo-2000-weekdays', venue_key, 'Demo 2.000đ/giờ - ngày thường',
     ARRAY[1,2,3,4,5], 360, 1440, 2000, 2000),
    ('smashbook-demo-2000-weekend', venue_key, 'Demo 2.000đ/giờ - cuối tuần',
     ARRAY[6,7], 360, 1440, 2000, 2000)
  ON CONFLICT (id) DO UPDATE SET
    "daysOfWeek" = EXCLUDED."daysOfWeek", "startMin" = 360, "endMin" = 1440,
    "walkInPrice" = 2000, "fixedPrice" = 2000;

  IF (SELECT count(*) FROM public."Court" WHERE "venueId" = venue_key) <> 1 THEN
    RAISE EXCEPTION 'Cơ sở demo phải có đúng một sân.';
  END IF;
END
$demo$;

-- Kết quả mong đợi: 2 dòng bảng giá, cùng Sân 1, đều 2.000 VND/giờ.
SELECT v.slug, v.name AS "coSo", c.name AS "san",
       p."daysOfWeek", p."walkInPrice" AS "VND_moi_gio",
       p."walkInPrice" / 2 AS "VND_moi_30_phut", v."ownerId"
FROM public."Venue" v
JOIN public."Court" c ON c."venueId" = v.id
JOIN public."PricingRule" p ON p."venueId" = v.id
WHERE v.id = 'smashbook-demo-2000-venue'
ORDER BY p.id;
COMMIT;
