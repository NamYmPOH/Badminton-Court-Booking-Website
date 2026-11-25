# Graph Report - Badminton Court Booking Website  (2026-11-26)

## Corpus Check
- 311 files · ~365,744 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 2, .prisma 1)

## Summary
- 2280 nodes · 5357 edges · 143 communities (126 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 176 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0cb5839d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin-policy.ts
- requirePaymentUser
- coach.service.ts
- payment.test.js
- auth.service.ts
- group-payment.service.ts
- empty-database.sql
- PaymentError
- lib/booking.ts
- useAuth
- venue-reviews-api.test.cjs
- venue-operations/page.tsx
- result/page.tsx
- lib/booking.ts
- paymentErrorResponse
- lucide-react
- db.ts
- ref_node_assert
- SmashBook: tìm sân, đặt lịch và theo dõi thanh toán
- assertSameOrigin
- auth.service.ts
- 20261015_coach_and_partner.sql
- react
- ref_node_test
- payment-choice.test.cjs
- dependencies
- devDependencies
- test-group-integration.cjs
- compilerOptions
- test-group-integration.cjs
- refund-ledger.test.cjs
- cancellation-policy-suite.test.cjs
- "Booking"
- generate-venues-data.cjs
- Phân tích luồng chia tiền nhóm và QR
- concurrency-reservation.test.cjs
- group-payment.sql
- serializable
- coach-policy.ts
- 🏸 SmashBook — Phân tích & Thiết kế Hệ thống Đặt lịch Sân Cầu lông
- OfferUsage
- review.test.cjs
- payment.test.js
- dependencies
- scripts
- compilerOptions
- role-permissions-operations.test.cjs
- env.ts
- venue-map.test.cjs
- hmac.pre-request.js
- group-payment.ts
- coach.service.ts
- typescript
- 7. Thiết kế API & tích hợp
- tailwindcss
- .eslintrc.json
- Prisma Platform core concepts
- next.config.mjs
- Prisma Platform core concepts
- Prisma Platform core concepts
- qrcode
- venue-fuzzy-search.test.cjs
- sync
- 3. KẾT QUẢ THỰC THI CÁC CÔNG CỤ XÁC MINH
- coach-reservation.test.cjs
- counter-booking-ops-regression.test.cjs
- check-public-cache.cjs
- 4. Phân tích hướng chức năng
- package.json
- coach-and-account-verification.test.cjs
- partner.service.ts
- Prisma Composer core concepts
- 5. Phân tích hướng đối tượng
- Prisma Composer core concepts
- review-images.test.cjs
- public-cache-invalidation.test.cjs
- serve-group-trial.cjs
- Prisma Composer core concepts
- Prisma Composer core concepts
- 4. CHI TIẾT CÁC THAY ĐỔI MÃ NGUỒN
- 3. DANH SÁCH FILE THAY ĐỔI & TẠO MỚI
- coach-catalog-cache.test.cjs
- new-features-verification.test.cjs
- auditOfferLedger
- Ví dụ thanh toán SePay + VietQR với Express
- seed-coaches-demo.cjs
- import-catalog.cjs
- checkout/page.tsx
- demo-review-distribution.test.cjs
- review-post-api.test.cjs
- settlement.service.ts
- venue-catalog-cache.test.cjs
- api/coaches/[id]/route.ts
- VenueCard.tsx
- venue-sessions/route.ts
- public-cache.test.cjs
- admin-coach-management.test.cjs
- types/booking.ts
- BÁO CÁO KẾT QUẢ QUẢN LÝ NGÂN SÁCH & LƯỢT DÙNG ƯU ĐÃI ĐỐI TÁC — SMASHBOOK
- preview-payment-fixture.cjs
- held-booking.test.cjs
- 5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ
- 2. Phân tích yêu cầu
- 9. Thiết kế UI/UX
- 2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm
- [id]/page.tsx
- scripts
- api/coaches/route.ts
- prisma
- load
- clsx
- 8. Thuật toán lõi
- Quản trị SmashBook
- "RefundDisbursement"
- next-themes
- @radix-ui/react-dropdown-menu@^2.1.24
- map-tiles.test.cjs
- env.ts
- tailwind-merge
- @vercel/analytics
- 12. Phụ lục
- 6. Thiết kế dữ liệu
- Hoàn tiền khi hủy HLV và sân — 29/10/2026
- hmac.pre-request.js
- 20261026_venue_sessions_and_shifts.sql
- coaches/page.tsx
- Booking and checkout verification — 2026-10-06
- 6. HƯỚNG DẪN TRIỂN KHAI, DI CHUYỂN DỮ LIỆU VÀ ROLLBACK
- Đánh giá sân và ảnh đính kèm
- Sân demo 2.000 VND/giờ
- tailwindcss
- 20261008_admin.sql
- .eslintrc.json
- AGENTS.md
- payment-choice.md
- next.config.mjs
- @radix-ui/react-popover@^1.1.23
- postcss.config.mjs
- "ReviewImage"

## God Nodes (most connected - your core abstractions)
1. `PaymentError` - 217 edges
2. `paymentErrorResponse()` - 118 edges
3. `next` - 87 edges
4. `requirePaymentUser()` - 81 edges
5. `assertSameOrigin()` - 76 edges
6. `serializable()` - 64 edges
7. `readPaymentBody()` - 59 edges
8. `lucide-react` - 56 edges
9. `react` - 49 edges
10. `formatVND()` - 47 edges

## Surprising Connections (you probably didn't know these)
- `Luồng 3: Hộp thoại Hủy đơn & Phân biệt Trạng thái (UI/UX)` --references--> `CancelBookingNoticeModal()`  [INFERRED]
  docs/business-flows-smashbook-2026.md → src/components/features/booking/CancelBookingNoticeModal.tsx
- `UC13 — Khoá / mở khoá sân` --references--> `CourtBlock`  [INFERRED]
  badminton-booking-spec.md → src/components/features/venue-operations/VenueCourtsModal.tsx
- `11. Kế hoạch triển khai (Milestones cho Agent)` --references--> `VenueCard()`  [INFERRED]
  badminton-booking-spec.md → src/components/features/venues/VenueCard.tsx
- `9.5 Wireframe các màn hình chính` --references--> `VenueCard()`  [INFERRED]
  badminton-booking-spec.md → src/components/features/venues/VenueCard.tsx
- `4.1. File `src/lib/group-payment.ts`` --references--> `splitAmounts()`  [INFERRED]
  docs/bao-cao-sua-loi-giao-dich-nhom-voucher-doi-tac.vi.md → src/lib/group-payment.ts

## Import Cycles
- None detected.

## Communities (143 total, 17 thin omitted)

### Community 0 - "admin-policy.ts"
Cohesion: 0.06
Nodes (58): AdminPage(), dynamic, metadata, POST(), dynamic, GET(), PATCH(), runtime (+50 more)

### Community 1 - "requirePaymentUser"
Cohesion: 0.15
Nodes (19): dynamic, GET(), PATCH(), runtime, dynamic, GET(), POST(), runtime (+11 more)

### Community 2 - "coach.service.ts"
Cohesion: 0.07
Nodes (28): 9.6 Đặc tả thành phần then chốt, Luồng 1: Đặt sân tại quầy & Chống trùng lặp (Idempotency), @radix-ui/react-dialog, Action, AdminDashboard(), Badge(), date(), labels (+20 more)

### Community 3 - "payment.test.js"
Cohesion: 0.06
Nodes (39): build, depends_on, environment, ports, profiles, volumes, context, dockerfile (+31 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.15
Nodes (29): dynamic, formatBookingForOperation(), GET(), POST(), venueOpActionSchema, Operator, operatorVenueScope(), assertVenueOperatorAccess() (+21 more)

### Community 5 - "group-payment.service.ts"
Cohesion: 0.22
Nodes (17): fixture(), slotTime(), SepayEvent, activeUser(), assertLive(), audit(), Bank, createGroup() (+9 more)

### Community 6 - "empty-database.sql"
Cohesion: 0.11
Nodes (37): "Account", Account_provider_providerAccountId_key, "BookingItem", BookingItem_bookingId_idx, BookingItem_courtId_date_idx, "Court", Court_venueId_name_key, Court_venueId_sortOrder_idx (+29 more)

### Community 7 - "PaymentError"
Cohesion: 0.11
Nodes (29): Điểm 2: Tự động gán `ACTIVE` khi đăng ký cơ sở và thiếu vòng đời phê duyệt có phân quyền, dynamic, POST(), readRawStreamBody(), runtime, DELETE(), dynamic, GET() (+21 more)

### Community 8 - "lib/booking.ts"
Cohesion: 0.16
Nodes (22): BookPageProps, BusySlotItem, CourtBookingGridPage(), PendingSwitch, CourtSwitchConfirmModal(), CourtSwitchConfirmModalProps, bookingDates(), isDemoBooked() (+14 more)

### Community 9 - "useAuth"
Cohesion: 0.15
Nodes (14): dynamic, VenueDetailPage(), VenueDetailPageProps, metadata, ReviewsPage(), VenueDetailActions(), VenueDetailActionsProps, VenueReviewPreview() (+6 more)

### Community 10 - "venue-reviews-api.test.cjs"
Cohesion: 0.09
Nodes (30): dynamic, GET(), query, VenueDemoReviews(), getDemoReviews(), POSITIVE_ENDINGS, POSITIVE_TOPICS, reviewSeed() (+22 more)

### Community 11 - "venue-operations/page.tsx"
Cohesion: 0.09
Nodes (33): TimelineSchedule, TimelineSlot, OffersPage(), PublicOffer, CourtInfo, getTodayVN(), Order, SelectedVenueDetailed (+25 more)

### Community 12 - "result/page.tsx"
Cohesion: 0.18
Nodes (8): qrcode@1.5.4, qrcode, GroupPaymentPage(), PaymentBooking, PaymentResultContent(), PaymentResultPage(), GroupPaymentCreate(), submit()

### Community 13 - "lib/booking.ts"
Cohesion: 0.09
Nodes (28): RegisterVenuePage(), submit(), AMENITY_ICONS, CourtConfig, DAY_LABELS, minToTimeStr(), PricingRuleConfig, timeStrToMin() (+20 more)

### Community 14 - "paymentErrorResponse"
Cohesion: 0.12
Nodes (21): dynamic, GET(), dynamic, GET(), POST(), runtime, GET(), dynamic (+13 more)

### Community 15 - "lucide-react"
Cohesion: 0.07
Nodes (28): lucide-react, sonner, metadata, AccountPage(), ProfileResponse, CoachAvailabilityItem, CoachBookingItem, CoachPortalPage() (+20 more)

### Community 16 - "db.ts"
Cohesion: 0.18
Nodes (15): dynamic, GET(), PATCH(), updateProfileSchema, dynamic, POST(), verifyEmailActionSchema, invalidatePublicCoachCache() (+7 more)

### Community 17 - "ref_node_assert"
Cohesion: 0.09
Nodes (19): assert, fs, assert, compiled, fs, { test }, ts, assert (+11 more)

### Community 18 - "SmashBook: tìm sân, đặt lịch và theo dõi thanh toán"
Cohesion: 0.07
Nodes (29): 10. Quyết định cho prototype, 11. Giả định và câu hỏi mở, 12. Ngoài phạm vi, 1. Mục đích, 2. Bối cảnh sản phẩm hiện có, 3. Trải nghiệm đích, 4. Hành trình người dùng, 5. Đặc tả luồng (+21 more)

### Community 19 - "assertSameOrigin"
Cohesion: 0.07
Nodes (44): next, zod, cancelSchema, dynamic, POST(), runtime, dynamic, incidentSchema (+36 more)

### Community 20 - "auth.service.ts"
Cohesion: 0.09
Nodes (33): loginSchema, POST(), POST(), GET(), POST(), registerSchema, AuthContext, AuthContextType (+25 more)

### Community 21 - "20261015_coach_and_partner.sql"
Cohesion: 0.14
Nodes (26): "BookingPriceLine", BookingPriceLine_bookingId_idx, "CoachAvailability", CoachAvailability_coachId_startsAt_endsAt_idx, CoachAvailability_venueId_startsAt_endsAt_idx, "CoachBooking", CoachBooking_coachId_startsAt_endsAt_idx, CoachBooking_status_expiresAt_idx (+18 more)

### Community 22 - "react"
Cohesion: 0.12
Nodes (14): react, BookingsContent(), BookingsPage(), CancelBookingNoticeModal(), CancelBookingNoticeModalProps, CancellationPreviewData, IncidentModal(), IncidentModalProps (+6 more)

### Community 23 - "ref_node_test"
Cohesion: 0.12
Nodes (11): auditAndBackfillVouchers(), main(), { PrismaClient }, assert, test, assert, matchesVietnamese(), normalizeVietnamese() (+3 more)

### Community 24 - "payment-choice.test.cjs"
Cohesion: 0.09
Nodes (20): 2.1. Nguồn dữ liệu chuẩn (Single Source of Truth), 2.2. Công thức và Bất biến toàn vẹn, 2. NGUỒN DỮ LIỆU CHUẨN VÀ BẤT BIẾN TOÀN VẸN (INVARIANTS), calculateOfferDiscount(), validateAndQuoteOffer(), createReservation(), assert, fs (+12 more)

### Community 25 - "dependencies"
Cohesion: 0.23
Nodes (11): dynamic, POST(), runtime, Context, dynamic, GET(), headers, POST() (+3 more)

### Community 26 - "devDependencies"
Cohesion: 0.10
Nodes (23): beVietnamPro, metadata, RootLayout(), viewport, Footer(), MobileTabBar(), Tab, Navbar() (+15 more)

### Community 27 - "test-group-integration.cjs"
Cohesion: 0.09
Nodes (21): 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU, 2.1. Lệch cấu trúc `GET /api/partner/profile`, 2.2. Thiếu `partnerId` khi tải danh sách ưu đãi và báo cáo, 2.3. Form đăng ký gửi `website` và chuỗi rỗng gây lỗi validation, 2.4. Form tạo ưu đãi gửi sai cấu trúc Schema, 2.6. Đồng bộ vai trò thành viên, 2. CHI TIẾT CÁC SAI KHÁC ĐÃ ĐƯỢC KHẮC PHỤC, 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (+13 more)

### Community 28 - "compilerOptions"
Cohesion: 0.10
Nodes (20): devDependencies, eslint@^8, eslint-config-next@14.2.6, postcss@^8, @types/bcryptjs@^2.4.6, @types/leaflet@^1.9.22, @types/node@^20, @types/qrcode@1.5.5 (+12 more)

### Community 29 - "test-group-integration.cjs"
Cohesion: 0.18
Nodes (16): action(), assert, check(), config, crypto, db, fs, main() (+8 more)

### Community 30 - "refund-ledger.test.cjs"
Cohesion: 0.20
Nodes (20): dynamic, GET(), input, cancelCoachBookingByCoach(), confirmBookingIncident(), approveCancellationInTransaction(), assertMoney(), completeRefund() (+12 more)

### Community 31 - "cancellation-policy-suite.test.cjs"
Cohesion: 0.17
Nodes (17): dynamic, GET(), runtime, analyzeCancellationTime(), calculateSlotTimestamp(), CANCELLATION_POLICY_VERSION, CancellationPolicyResult, CancellationTimeInfo (+9 more)

### Community 32 - ""Booking""
Cohesion: 0.13
Nodes (18): Booking_requestId_key, "SepayReceipt", SepayReceipt_result_receivedAt_idx, Booking_createdByStaffId_idx, Booking_source_idx, "BookingIncidentRequest", BookingIncidentRequest_bookingId_idx, BookingIncidentRequest_venueId_status_idx (+10 more)

### Community 33 - "generate-venues-data.cjs"
Cohesion: 0.10
Nodes (16): fs, outputDir, path, PERSPECTIVES, THEMES, allVenuesList, AMENITY_SETS, dataDir (+8 more)

### Community 34 - "Phân tích luồng chia tiền nhóm và QR"
Cohesion: 0.10
Nodes (18): 10. Những phần cần bổ sung trong mã nguồn, 11. Điều chỉnh bộ sơ đồ và tài liệu, 12. Tiêu chí kiểm chứng khi triển khai, 1. Cơ sở và phạm vi, 2. Những điều phải giữ từ luồng trước, 3. Phân biệt ba loại QR, 4. Luồng người dùng đề xuất, 5. Trạng thái đơn và tiền phải tách riêng (+10 more)

### Community 35 - "concurrency-reservation.test.cjs"
Cohesion: 0.10
Nodes (14): HOLD_DURATION_MINUTES, assert, crypto, fs, Module, path, test, ts (+6 more)

### Community 36 - "group-payment.sql"
Cohesion: 0.18
Nodes (19): "BookingGroup", BookingGroup_bookingId_key, BookingGroup_inviteToken_key, "GroupPaymentIntent", GroupPaymentIntent_code_key, GroupPaymentIntent_groupId_status_idx, "GroupRefund", GroupRefund_paymentId_key (+11 more)

### Community 37 - "serializable"
Cohesion: 0.23
Nodes (12): @prisma/client, serializable(), ConfirmIncidentInput, INCIDENT_LABELS, IncidentRequestType, IncidentType, reportBookingIncident(), ReportIncidentInput (+4 more)

### Community 38 - "coach-policy.ts"
Cohesion: 0.15
Nodes (17): assertCoachActive(), assertCoachOwner(), assertNoOverlappingIntervals(), coachAvailabilityInputSchema, coachProfileInputSchema, CoachStatusUpdate, coachStatusUpdateSchema, DEMO_COACH_NAME (+9 more)

### Community 39 - "🏸 SmashBook — Phân tích & Thiết kế Hệ thống Đặt lịch Sân Cầu lông"
Cohesion: 0.11
Nodes (18): 0. Hướng dẫn dành cho Agent (đọc trước), 10.1 Bảo mật, 10.2 Kiểm thử, 10.3 Triển khai, 10. Bảo mật, kiểm thử, triển khai, 11. Kế hoạch triển khai (Milestones cho Agent), 1.1 Bối cảnh & mục tiêu, 1.2 Phạm vi (+10 more)

### Community 40 - "OfferUsage"
Cohesion: 0.19
Nodes (18): 4.5 Từ điển dữ liệu (rút gọn), 6.5 Chỉ mục & hiệu năng, 8.2 Lịch trống (`availability.ts`), 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 2.1. Nhóm 1: Hoàn tất giao dịch thống nhất & Chứng từ Voucher bền vững, 2.2. Nhóm 2: Đồng bộ SQL hết hạn và bù hoàn tiền cho Payment `REFUND_PENDING`, 2.3. Nhóm 3: Chuẩn hóa Script Backfill Voucher an toàn và Idempotent, 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN SỬA ĐỔI (+10 more)

### Community 41 - "review.test.cjs"
Cohesion: 0.06
Nodes (44): Prompt kiểm tra setup và mở rộng Redis cache, Database Upstash đang dùng cho local, Khi dữ liệu thay đổi, Kiểm tra và nguồn tham khảo, Luồng xử lý và giới hạn, Nghiệm thu mở rộng ngày 06/11/2026, Nghiệm thu ngày 05/11/2026, Phạm vi đã áp dụng (+36 more)

### Community 42 - "payment.test.js"
Cohesion: 0.09
Nodes (26): dependencies, express@^5.1.0, engines, node, name, private, scripts, dev (+18 more)

### Community 43 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, bcryptjs@^3.0.3, date-fns@^4.4.0, ioredis@^6.0.0, lucide-react@^1.49.0, next@14.2.6, @prisma/client@^5.18.0, @radix-ui/react-dialog@^1.1.23 (+12 more)

### Community 44 - "scripts"
Cohesion: 0.17
Nodes (7): public."VoucherUsage", VoucherUsage_bookingId_idx, VoucherUsage_voucherId_bookingId_key, VoucherUsage_voucherId_idx, smashbook_private.audit_expired_candidates(), smashbook_private.expire_group_bookings(), smashbook_private.expire_group_bookings()

### Community 45 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+10 more)

### Community 46 - "role-permissions-operations.test.cjs"
Cohesion: 0.15
Nodes (11): addVenueStaff(), createVenueStaffAccount(), setVenueStaffActive(), actors, fixture(), fs, ts, assert (+3 more)

### Community 47 - "env.ts"
Cohesion: 0.19
Nodes (12): HeroSearch(), DISTRICTS, PRICE_RANGES, SORT_OPTIONS, VenueSearchFilterProps, VenueSearchSuggestions(), VenueSearchSuggestionsProps, Court (+4 more)

### Community 48 - "venue-map.test.cjs"
Cohesion: 0.15
Nodes (17): leaflet@^1.9.4, leaflet, VenuesPage(), VenuesPageProps, VenueSearchFilter(), VenuesMap(), initialize(), locate() (+9 more)

### Community 49 - "hmac.pre-request.js"
Cohesion: 0.20
Nodes (7): Court, PricingRule, VenueCourtsModal(), handleAddPricing(), handleLockSlot(), timeToMin(), VenueCourtsModalProps

### Community 50 - "group-payment.ts"
Cohesion: 0.16
Nodes (16): Group, createGroupSchema, GroupAction, groupActionSchema, groupTotals(), ids, reason, splitAmounts() (+8 more)

### Community 51 - "coach.service.ts"
Cohesion: 0.18
Nodes (15): COACH_SPECIALTY_ALIASES, CoachAvailabilityInput, CoachCertificateInput, coachCertificateInputSchema, CoachProfileInput, CoachVenueApproval, coachVenueApprovalSchema, isDemoCoach() (+7 more)

### Community 52 - "typescript"
Cohesion: 0.17
Nodes (9): typescript, assert, fs, { test }, ts, assert, fs, { test } (+1 more)

### Community 53 - "7. Thiết kế API & tích hợp"
Cohesion: 0.33
Nodes (6): 7.1 Quy ước, 7.2 Danh sách endpoint, 7.3 Schema Zod mẫu — tạo booking (`lib/validators/booking.ts`), 7.4 Tích hợp thanh toán VNPAY, 7.5 Thiết kế xác thực & phân quyền, 7. Thiết kế API & tích hợp

### Community 54 - "tailwindcss"
Cohesion: 0.24
Nodes (16): bounded(), cachedPublicData(), cacheFailure(), CacheState, decode(), enabled(), getPublicCacheMetrics(), globalCache (+8 more)

### Community 55 - ".eslintrc.json"
Cohesion: 0.23
Nodes (16): "BookingGroup", BookingGroup_bookingId_key, BookingGroup_inviteToken_key, "GroupPaymentIntent", GroupPaymentIntent_code_key, GroupPaymentIntent_groupId_status_idx, "GroupRefund", GroupRefund_paymentId_key (+8 more)

### Community 56 - "Prisma Platform core concepts"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 57 - "next.config.mjs"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 58 - "Prisma Platform core concepts"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 59 - "Prisma Platform core concepts"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 60 - "qrcode"
Cohesion: 0.10
Nodes (22): canPayBooking(), PaymentBooking, BookingRequest, bookingRequestSchema, extractGroupCode(), buildVietQrPayload(), crc16Ccitt(), eventFingerprint() (+14 more)

### Community 61 - "venue-fuzzy-search.test.cjs"
Cohesion: 0.14
Nodes (22): dynamic, GET(), searchSchema, dynamic, HomePage(), FilterItem, FILTERS, QuickFilters() (+14 more)

### Community 62 - "sync"
Cohesion: 0.12
Nodes (22): 3. BẢNG TỔNG HỢP KIỂM THỬ TRƯỚC VÀ SAU KHI SỬA, 8. KẾT LUẬN NGHIỆM THU, 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 2.1. Phần A: Chia lại tiền khi HLV hủy đơn nhóm (`coach.service.ts` & `group-payment.ts`), 2.2. Phần B: Bộ đếm Voucher thường trong giao dịch nhóm (`group-payment.service.ts`), 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN THIẾT KẾ, 3. BẢNG TRƯỚC / SAU CỦA 6 CA HỒI QUY, 6.1. Phương án Backfill dữ liệu cũ (+14 more)

### Community 63 - "3. KẾT QUẢ THỰC THI CÁC CÔNG CỤ XÁC MINH"
Cohesion: 0.13
Nodes (14): 1. THÔNG TIN MÔI TRƯỜNG & PHIÊN BẢN CÔNG CỤ, 2.1. Kiểm tra biến môi trường (Tuyệt đối không để lộ Secret), 2.2. Chẩn đoán mạng & Giao thức kết nối, 2.3. Báo cáo phần bị chặn đối với `scripts/test-group-integration.cjs`, 2. CHẨN ĐOÁN KẾT NỐI CƠ SỞ DỮ LIỆU & AN TOÀN DỮ LIỆU, 3.1. Prisma Schema Validation, 3.2. TypeScript Static Analysis (Strict Mode), 3.3. ESLint Verification (+6 more)

### Community 64 - "coach-reservation.test.cjs"
Cohesion: 0.22
Nodes (8): activeCoach, assert, baseVenue, date, fs, future, { test }, ts

### Community 65 - "counter-booking-ops-regression.test.cjs"
Cohesion: 0.22
Nodes (6): assert, fs, { test }, TEST_DATE_OBJ, TEST_DATE_STR, ts

### Community 66 - "check-public-cache.cjs"
Cohesion: 0.18
Nodes (8): assert, fs, { loadEnvConfig }, path, { randomUUID }, Redis, root, ts

### Community 67 - "4. Phân tích hướng chức năng"
Cohesion: 0.40
Nodes (5): 4.1 Sơ đồ phân rã chức năng (BFD), 4.2 DFD mức 0 (sơ đồ ngữ cảnh), 4.3 DFD mức 1, 4.4 DFD mức 2 — Tiến trình P3 "Đặt sân", 4. Phân tích hướng chức năng

### Community 68 - "package.json"
Cohesion: 0.14
Nodes (13): @auth/prisma-adapter@^2.11.3, class-variance-authority@^0.7.1, next-auth@^5.0.0-beta.20, react-hook-form@^7.89.0, @tanstack/react-query@^5.104.1, name, private, version (+5 more)

### Community 69 - "coach-and-account-verification.test.cjs"
Cohesion: 0.13
Nodes (10): DEMO_COACH_HOURLY_RATE, DEMO_COACH_ID, DEMO_COACH_USER_ID, normalizeCoachSpecialties(), normalizeCoachSpecialty(), assert, crypto, fs (+2 more)

### Community 70 - "partner.service.ts"
Cohesion: 0.06
Nodes (49): 2.3. Phần C: Hợp đồng dữ liệu hồ sơ đối tác (`partner.service.ts`, route & page), 2.5. Sai lệch cấu trúc `getMyPartnerOffers` và `getPartnerReport`, 3. DANH SÁCH FILE THAY ĐỔI, dynamic, POST(), runtime, dynamic, GET() (+41 more)

### Community 71 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 72 - "5. Phân tích hướng đối tượng"
Cohesion: 0.15
Nodes (13): 5.1 Sơ đồ Use case, 5.2 Đặc tả Use case chính, 5.3 Biểu đồ lớp — Mô hình miền (Domain), 5.4 Biểu đồ lớp — Tầng dịch vụ & mẫu thiết kế, 5.5 Biểu đồ tuần tự, 5.6 Biểu đồ hoạt động — Quy trình đặt sân, 5.7 Biểu đồ trạng thái — Booking, 5. Phân tích hướng đối tượng (+5 more)

### Community 73 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 74 - "review-images.test.cjs"
Cohesion: 0.22
Nodes (5): assert, { createHash }, fs, { test }, ts

### Community 75 - "public-cache-invalidation.test.cjs"
Cohesion: 0.15
Nodes (9): actor, assert, cases, { createRequire }, fs, path, { test }, ts (+1 more)

### Community 76 - "serve-group-trial.cjs"
Cohesion: 0.12
Nodes (17): loadTs(), main(), bcrypt, crypto, db, fs, main(), { PrismaClient } (+9 more)

### Community 77 - "Prisma Composer core concepts"
Cohesion: 0.17
Nodes (11): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+3 more)

### Community 78 - "Prisma Composer core concepts"
Cohesion: 0.17
Nodes (11): Building blocks and extensions, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development, Prisma Composer core concepts (+3 more)

### Community 79 - "4. CHI TIẾT CÁC THAY ĐỔI MÃ NGUỒN"
Cohesion: 0.22
Nodes (9): 4.1. File `src/lib/group-payment.ts`, 4.2. File `src/services/coach.service.ts`, 4.3. File `src/services/group-payment.service.ts`, 4.4. File `src/services/partner.service.ts`, 4.5. File `src/app/partner/page.tsx`, 4.6. File `scripts/audit-voucher-backfill.cjs` (Mới), 4.7. File `tests/six-regression-cases.test.cjs` (Mới), 4. CHI TIẾT CÁC THAY ĐỔI MÃ NGUỒN (+1 more)

### Community 80 - "3. DANH SÁCH FILE THAY ĐỔI & TẠO MỚI"
Cohesion: 0.06
Nodes (31): 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU, 2. CÁC LỖI & ĐIỂM NGHIỆP VỤ ĐÃ XÁC MINH VÀ KHẮC PHỤC, 3. DANH SÁCH FILE THAY ĐỔI & TẠO MỚI, 4.1. File Patch SQL, 4.2. Các bước triển khai cho DBA / DevOps, 4. HƯỚNG DẪN ÁP DỤNG DATABASE MIGRATION, 5.1. Kiểm tra tĩnh TypeScript Strict Mode, 5.2. Chạy toàn bộ Test Suites (+23 more)

### Community 81 - "coach-catalog-cache.test.cjs"
Cohesion: 0.22
Nodes (9): assert, { createRequire }, fixture(), fs, loadTs(), path, row(), { test } (+1 more)

### Community 82 - "new-features-verification.test.cjs"
Cohesion: 0.18
Nodes (4): assert, normalizeAmenities(), normalizeAmenity(), test

### Community 83 - "auditOfferLedger"
Cohesion: 0.24
Nodes (10): 1. TỔNG QUAN NGHIỆM THU & PHẠM VI CÔNG VIỆC, 2. BẢNG TỔNG HỢP TEST CASES NGHIỆM THU (TEST MATRIX), 3.1. Các chức năng ĐÃ KIỂM CHỨNG TOÀN LUỒNG (End-to-End Logic & API Contract), 3.2. Các chức năng CHỈ KIỂM CHỨNG LOGIC / SERVICE, 3.3. Các chức năng CÒN BỊ CHẶN (BLOCKED), 3.4. Các chức năng CHƯA KIỂM CHỨNG TRÊN MÔI TRƯỜNG THỰC TẾ, 3. PHÂN ĐỊNH MỨC ĐỘ KIỂM CHỨNG CỦA CÁC CHỨC NĂNG, 4. KẾT LUẬN NGHIỆM THU (+2 more)

### Community 84 - "Ví dụ thanh toán SePay + VietQR với Express"
Cohesion: 0.18
Nodes (10): 1. Cấu trúc, 2. Cấu hình và chạy, 3. Xác thực đúng loại webhook, 4. Tạo booking bằng Postman, 5. Giả lập webhook bằng Postman, 6. Logic và các ca test, 7. Polling ở frontend, 8. Nhận webhook từ SePay khi chạy local (+2 more)

### Community 85 - "seed-coaches-demo.cjs"
Cohesion: 0.18
Nodes (6): { loadEnvConfig }, { PrismaClient }, { loadEnvConfig }, prisma, { PrismaClient }, SAMPLE_COACHES

### Community 86 - "import-catalog.cjs"
Cohesion: 0.25
Nodes (8): array(), fs, path, quote(), sql, statements, ts, usedSlugs

### Community 87 - "checkout/page.tsx"
Cohesion: 0.32
Nodes (6): CheckoutContent(), applyVoucher(), submit(), validateForm(), CheckoutPage(), CoachItem

### Community 88 - "demo-review-distribution.test.cjs"
Cohesion: 0.29
Nodes (6): MOCK_VENUES, assert, fs, { test }, ts, venueIds

### Community 89 - "review-post-api.test.cjs"
Cohesion: 0.25
Nodes (4): assert, fs, { test }, ts

### Community 90 - "settlement.service.ts"
Cohesion: 0.27
Nodes (10): asSafeTx(), completeBookingSettlement(), CompleteBookingSettlementParams, inMemoryVoucherRecordings, recordSingleVoucherUsage(), recordVoucherConsumption(), SafeTx, SettlementMockClient (+2 more)

### Community 91 - "venue-catalog-cache.test.cjs"
Cohesion: 0.22
Nodes (10): assert, fixture(), fs, loadTs(), { PaymentError }, ranker, row(), { test } (+2 more)

### Community 92 - "api/coaches/[id]/route.ts"
Cohesion: 0.38
Nodes (6): dynamic, GET(), runtime, getPublicCoachAvailabilities(), getPublicCoachById(), subtractBookingsFromSlot()

### Community 93 - "VenueCard.tsx"
Cohesion: 0.14
Nodes (16): Biến môi trường Production trên Vercel, Chuẩn bị database trước khi deploy, Dữ liệu cơ sở cần có, Kiểm tra source, Kết nối website Next.js với SePay, Những phần đã có trong source, Thử luồng thanh toán, Triển khai (+8 more)

### Community 94 - "venue-sessions/route.ts"
Cohesion: 0.43
Nodes (5): dynamic, GET(), POST(), cleanupExpiredBookings(), CleanupExpiredResult

### Community 95 - "public-cache.test.cjs"
Cohesion: 0.20
Nodes (5): assert, errorModule, fs, { test }, ts

### Community 96 - "admin-coach-management.test.cjs"
Cohesion: 0.29
Nodes (5): assert, fs, slot, { test }, ts

### Community 97 - "types/booking.ts"
Cohesion: 0.22
Nodes (8): 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CỐT LÕI, Lỗi nghiêm trọng đã tái hiện (P1):, BookingIncidentRecord, BookingRescheduleRecord, BookingStatus, BookingTransferRecord, PaymentStatus, Voucher

### Community 98 - "BÁO CÁO KẾT QUẢ QUẢN LÝ NGÂN SÁCH & LƯỢT DÙNG ƯU ĐÃI ĐỐI TÁC — SMASHBOOK"
Cohesion: 0.22
Nodes (8): 3.1. Truy vấn tính toán đầy đủ `expiresAt: null`, 3.2. Serializable Transaction chống tranh chấp ngân sách cuối, 3.3. Chính sách hoàn ngân sách khi hủy đơn, 3.4. Hàm kiểm toán đối soát chỉ đọc (Read-only Audit), 3. CÁC NÂNG CẤP VÀ GIẢI PHÁP KỸ THUẬT, 4. KẾT QUẢ KIỂM THỬ THỰC TẾ, 5. PHẦN CHƯA KIỂM CHỨNG & GIỚI HẠN, BÁO CÁO KẾT QUẢ QUẢN LÝ NGÂN SÁCH & LƯỢT DÙNG ƯU ĐÃI ĐỐI TÁC — SMASHBOOK

### Community 99 - "preview-payment-fixture.cjs"
Cohesion: 0.12
Nodes (10): booking, child, http, server, { spawn }, assert, { createHmac }, path (+2 more)

### Community 100 - "held-booking.test.cjs"
Cohesion: 0.29
Nodes (6): assert, booking, fs, now, { test }, ts

### Community 101 - "5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ"
Cohesion: 0.33
Nodes (6): 5.1. Chạy 6 ca hồi quy độc lập, 5.2. Chạy toàn bộ Test Suite hiện có, 5.3. Kiểm tra kiểu TypeScript & ESLint, 5.4. Xác minh Production Build Next.js, 5.5. Phân định rõ phạm vi kiểm thử, 5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### Community 102 - "2. Phân tích yêu cầu"
Cohesion: 0.40
Nodes (5): 2.1 Yêu cầu chức năng, 2.2 Yêu cầu phi chức năng, 2.3 Quy tắc nghiệp vụ (Business Rules), 2.4 Quyết định mặc định (Agent dùng khi gặp điểm mơ hồ), 2. Phân tích yêu cầu

### Community 103 - "9. Thiết kế UI/UX"
Cohesion: 0.25
Nodes (8): 9.1 Kế hoạch thiết kế (đã đối chiếu với mặc định phổ biến), 9.2 Design tokens, 9.3 Trạng thái ô lịch — không chỉ dựa vào màu (NFR-06), 9.4 Điều hướng & sơ đồ trang, 9.5 Wireframe các màn hình chính, 9.7 Nội dung giao diện (microcopy) & trạng thái, 9.8 Truy cập, SEO, PWA, 9. Thiết kế UI/UX

### Community 104 - "2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm"
Cohesion: 0.25
Nodes (7): 1. Sơ đồ Kiến trúc Tổng thể (Mermaid Diagram), 2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm, Luồng 2: Thu tiền mặt tại quầy & Tiêu thụ Voucher/PartnerOffer, Luồng 3: Hộp thoại Hủy đơn & Phân biệt Trạng thái (UI/UX), Luồng 4: Sổ Hoàn tiền (Refund Ledger) & Giải ngân có Chứng từ, Luồng 5: HLV Hủy ca & Tái cân bằng Đơn nhóm, Tài liệu Luồng Nghiệp vụ & Cấu trúc Dữ liệu SmashBook

### Community 105 - "[id]/page.tsx"
Cohesion: 0.33
Nodes (4): CoachCertificate, CoachDetail, CoachDetailPage(), FreeSlot

### Community 106 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, cache:check, dev, lint, postinstall, start, test

### Community 107 - "api/coaches/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, GET(), runtime, getPublicCoaches()

### Community 109 - "load"
Cohesion: 0.29
Nodes (7): The service node is the only doorway, The service node is the only doorway, Two channels: dependencies and input, Builds are yours, Testing is an environment seam, The service node is the only doorway, load()

### Community 111 - "8. Thuật toán lõi"
Cohesion: 0.29
Nodes (7): 8.1 Thời gian (`time.ts`), 8.3 Tính giá & giữ chỗ, 8.4 Tạo booking (`BookingService.create`), 8.5 Hết hạn giữ chỗ (xử lý lười + cron), 8.6 Xác nhận thanh toán — idempotent (`confirmPaid`), 8.7 Chính sách huỷ (`rules.ts`), 8. Thuật toán lõi

### Community 112 - "Quản trị SmashBook"
Cohesion: 0.29
Nodes (6): Chức năng, Database và triển khai, Kiểm tra, Lỗi PostgreSQL 42P05: prepared statement already exists, Quy tắc thanh toán và bảo mật, Quản trị SmashBook

### Community 113 - ""RefundDisbursement""
Cohesion: 0.38
Nodes (4): "RefundDisbursement", RefundDisbursement_refundId_idx, "RefundDisbursement", RefundDisbursement_refundId_idx

### Community 116 - "map-tiles.test.cjs"
Cohesion: 0.33
Nodes (5): GET(), assert, fs, { test }, ts

### Community 117 - "env.ts"
Cohesion: 0.29
Nodes (4): ClientEnv, clientSchema, ServerEnv, serverSchema

### Community 120 - "12. Phụ lục"
Cohesion: 0.33
Nodes (6): 12.1 Biến môi trường (`.env.example`), 12.2 Dữ liệu seed (toàn bộ **giả**), 12.3 Từ vựng thuật ngữ Việt ↔ định danh code, 12.4 Hình vẽ vạch sân cho hero (`CourtLinesHero`), 12. Phụ lục, slot()

### Community 121 - "6. Thiết kế dữ liệu"
Cohesion: 0.33
Nodes (6): 6.1 ERD, 6.2 Prisma schema (MVP) — `prisma/schema.prisma`, 6.3 Ràng buộc chống trùng lịch (SQL thủ công — **bắt buộc**), 6.4 Mô hình Phase 2 (chưa tạo ở MVP), 6.6 Thiết kế khoá Redis, 6. Thiết kế dữ liệu

### Community 122 - "Hoàn tiền khi hủy HLV và sân — 29/10/2026"
Cohesion: 0.33
Nodes (5): Các luồng đã thống nhất, Hoàn tiền khi hủy HLV và sân — 29/10/2026, Kiểm tra, Migration và dữ liệu cũ, Quy tắc ghi sổ

### Community 123 - "hmac.pre-request.js"
Cohesion: 0.33
Nodes (5): encoder, hex, rawBody, secret, timestamp

### Community 125 - "20261026_venue_sessions_and_shifts.sql"
Cohesion: 0.47
Nodes (5): Booking_venueId_sessionStatus_idx, "StaffShift", StaffShift_userId_endedAt_idx, StaffShift_venueId_endedAt_idx, VenueStaff_venueId_isActive_idx

### Community 126 - "coaches/page.tsx"
Cohesion: 0.33
Nodes (4): CoachItem, CoachVenueItem, COACH_SPECIALTIES, CoachSpecialty

### Community 132 - "Booking and checkout verification — 2026-10-06"
Cohesion: 0.40
Nodes (4): Booking and checkout verification — 2026-10-06, Changes and verification, Original deployment, Remaining limitations

### Community 133 - "6. HƯỚNG DẪN TRIỂN KHAI, DI CHUYỂN DỮ LIỆU VÀ ROLLBACK"
Cohesion: 0.50
Nodes (4): 6.1. Triển khai Migration Cơ sở dữ liệu (PostgreSQL), 6.2. Đối soát dữ liệu cũ và Kế hoạch Backfill, 6.3. Kế hoạch Rollback (Khai trừ rủi ro), 6. HƯỚNG DẪN TRIỂN KHAI, DI CHUYỂN DỮ LIỆU VÀ ROLLBACK

### Community 134 - "Đánh giá sân và ảnh đính kèm"
Cohesion: 0.50
Nodes (3): Cập nhật môi trường khác, Kiểm tra, Đánh giá sân và ảnh đính kèm

### Community 135 - "Sân demo 2.000 VND/giờ"
Cohesion: 0.50
Nodes (3): Kiểm chứng và giới hạn, Phạm vi, Sân demo 2.000 VND/giờ

### Community 136 - "tailwindcss"
Cohesion: 0.50
Nodes (3): tailwindcss@^3.4.1, tailwindcss, config

### Community 137 - "20261008_admin.sql"
Cohesion: 0.83
Nodes (3): "AdminAudit", AdminAudit_createdAt_idx, AdminAudit_entityId_createdAt_idx

## Knowledge Gaps
- **1 isolated node(s):** `next/core-web-vitals`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1077 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PaymentError` connect `PaymentError` to `admin-policy.ts`, `requirePaymentUser`, `auth.service.ts`, `group-payment.service.ts`, `lib/booking.ts`, `venue-reviews-api.test.cjs`, `paymentErrorResponse`, `db.ts`, `assertSameOrigin`, `payment-choice.test.cjs`, `dependencies`, `refund-ledger.test.cjs`, `cancellation-policy-suite.test.cjs`, `serializable`, `coach-policy.ts`, `review.test.cjs`, `role-permissions-operations.test.cjs`, `group-payment.ts`, `coach.service.ts`, `tailwindcss`, `qrcode`, `venue-fuzzy-search.test.cjs`, `sync`, `partner.service.ts`, `auditOfferLedger`, `review-post-api.test.cjs`, `api/coaches/[id]/route.ts`, `load`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin-policy.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06025039123630673 - nodes in this community are weakly interconnected._
- **Why does `next` connect `assertSameOrigin` to `admin-policy.ts`, `requirePaymentUser`, `coach.service.ts`, `auth.service.ts`, `PaymentError`, `lib/booking.ts`, `useAuth`, `venue-operations/page.tsx`, `result/page.tsx`, `lib/booking.ts`, `paymentErrorResponse`, `lucide-react`, `db.ts`, `auth.service.ts`, `react`, `devDependencies`, `cancellation-policy-suite.test.cjs`, `review.test.cjs`, `dependencies`, `env.ts`, `venue-map.test.cjs`, `group-payment.ts`, `venue-fuzzy-search.test.cjs`, `package.json`, `partner.service.ts`, `checkout/page.tsx`, `api/coaches/[id]/route.ts`, `VenueCard.tsx`, `venue-sessions/route.ts`, `[id]/page.tsx`, `api/coaches/route.ts`, `coaches/page.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `requirePaymentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `typescript` to `auth.service.ts`, `lib/booking.ts`, `venue-reviews-api.test.cjs`, `ref_node_assert`, `auth.service.ts`, `payment-choice.test.cjs`, `compilerOptions`, `test-group-integration.cjs`, `concurrency-reservation.test.cjs`, `coach-policy.ts`, `review.test.cjs`, `role-permissions-operations.test.cjs`, `venue-map.test.cjs`, `group-payment.ts`, `qrcode`, `coach-reservation.test.cjs`, `counter-booking-ops-regression.test.cjs`, `check-public-cache.cjs`, `package.json`, `coach-and-account-verification.test.cjs`, `partner.service.ts`, `review-images.test.cjs`, `public-cache-invalidation.test.cjs`, `serve-group-trial.cjs`, `coach-catalog-cache.test.cjs`, `import-catalog.cjs`, `demo-review-distribution.test.cjs`, `review-post-api.test.cjs`, `venue-catalog-cache.test.cjs`, `public-cache.test.cjs`, `admin-coach-management.test.cjs`, `held-booking.test.cjs`, `map-tiles.test.cjs`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `coach.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07179487179487179 - nodes in this community are weakly interconnected._