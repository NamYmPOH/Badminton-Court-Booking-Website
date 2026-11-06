# Graph Report - Badminton Court Booking Website  (2026-11-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2283 nodes · 5344 edges · 155 communities (138 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 176 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12c279ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin-policy.ts
- app
- coach.service.ts
- payment.test.js
- auth.service.ts
- group-payment.service.ts
- empty-database.sql
- paymentErrorResponse
- lib/booking.ts
- useAuth
- venue-reviews-api.test.cjs
- venue-operations/page.tsx
- formatVND
- lib/booking.ts
- PaymentError
- lucide-react
- db.ts
- coach-service.test.cjs
- SmashBook: tìm sân, đặt lịch và theo dõi thanh toán
- readPaymentBody
- auth.service.ts
- 20261015_coach_and_partner.sql
- react
- group-payment.service.ts
- generate-venues-data.cjs
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
- settlement.service.ts
- coach-policy.ts
- 🏸 SmashBook — Phân tích & Thiết kế Hệ thống Đặt lịch Sân Cầu lông
- OfferUsage
- Redis cache cho catalog sân và HLV
- ref_node_crypto
- dependencies
- scripts
- compilerOptions
- ref_node_test
- env.ts
- venue-map.test.cjs
- hmac.pre-request.js
- @prisma/client
- coach.service.ts
- venue.service.ts
- AuthContext.tsx
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
- postcss.config.mjs
- role-permissions-operations.test.cjs
- check-public-cache.cjs
- sepay-express/package.json
- package.json
- coach-and-account-verification.test.cjs
- partner-policy.ts
- Prisma Composer core concepts
- 5. Phân tích hướng đối tượng
- Prisma Composer core concepts
- typescript
- public-cache-invalidation.test.cjs
- serve-group-trial.cjs
- Prisma Composer core concepts
- Prisma Composer core concepts
- getMyPartners
- BÁO CÁO HOÀN THIỆN TOÀN LUỒNG HUẤN LUYỆN VIÊN (HLV) — SMASHBOOK
- coach-catalog-cache.test.cjs
- new-features-verification.test.cjs
- auditOfferLedger
- Ví dụ thanh toán SePay + VietQR với Express
- seed-coaches-demo.cjs
- import-catalog.cjs
- app/page.tsx
- public-coach-catalog.ts
- partner.service.ts
- settlement.service.ts
- venue-catalog-cache.test.cjs
- coach.ts
- Kết nối website Next.js với SePay
- review.test.cjs
- public-cache.test.cjs
- BÁO CÁO KỸ THUẬT: SỬA LỖI GIAO DỊCH NHÓM, BỘ ĐẾM VOUCHER VÀ HỒ SƠ ĐỐI TÁC
- types/booking.ts
- BÁO CÁO KẾT QUẢ QUẢN LÝ NGÂN SÁCH & LƯỢT DÙNG ƯU ĐÃI ĐỐI TÁC — SMASHBOOK
- preview-payment-fixture.cjs
- partner-service.test.cjs
- coach-reservation.test.cjs
- review-images.test.cjs
- 9. Thiết kế UI/UX
- 2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm
- [id]/page.tsx
- scripts
- venue-sessions/route.ts
- review-post-api.test.cjs
- load
- 7. Thiết kế API & tích hợp
- 8. Thuật toán lõi
- Quản trị SmashBook
- "RefundDisbursement"
- voucher-backfill.test.cjs
- incidents/route.ts
- map-tiles.test.cjs
- env.ts
- admin.test.cjs
- held-booking.test.cjs
- 12. Phụ lục
- 6. Thiết kế dữ liệu
- Hoàn tiền khi hủy HLV và sân — 29/10/2026
- hmac.pre-request.js
- payment.service.js
- 20261026_venue_sessions_and_shifts.sql
- coaches/page.tsx
- 3. Công nghệ & kiến trúc
- 5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ
- review/route.ts
- api/coaches/route.ts
- api/offers/route.ts
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
- date-fns@^4.4.0
- next-auth@^5.0.0-beta.20
- next-themes
- @radix-ui/react-popover@^1.1.23
- tailwind-merge
- zustand@^5.0.15
- postcss.config.mjs
- "ReviewImage"
- AppError

## God Nodes (most connected - your core abstractions)
1. `PaymentError` - 217 edges
2. `paymentErrorResponse()` - 118 edges
3. `next` - 87 edges
4. `requirePaymentUser()` - 81 edges
5. `assertSameOrigin()` - 76 edges
6. `readPaymentBody()` - 59 edges
7. `lucide-react` - 56 edges
8. `serializable()` - 51 edges
9. `react` - 49 edges
10. `formatVND()` - 47 edges

## Surprising Connections (you probably didn't know these)
- `UC13 — Khoá / mở khoá sân` --references--> `CourtBlock`  [INFERRED]
  badminton-booking-spec.md → src/components/features/venue-operations/VenueCourtsModal.tsx
- `4.6. File `scripts/audit-voucher-backfill.cjs` (Mới)` --references--> `OfferUsage`  [INFERRED]
  docs/bao-cao-sua-loi-giao-dich-nhom-voucher-doi-tac.vi.md → src/types/partner.ts
- `2.1. Nguồn dữ liệu chuẩn (Single Source of Truth)` --references--> `OfferUsage`  [INFERRED]
  docs/ke-hoach-4-ket-qua-ngan-sach.vi.md → src/types/partner.ts
- `3.3. Chính sách hoàn ngân sách khi hủy đơn` --references--> `OfferUsage`  [INFERRED]
  docs/ke-hoach-4-ket-qua-ngan-sach.vi.md → src/types/partner.ts
- `3.4. Hàm kiểm toán đối soát chỉ đọc (Read-only Audit)` --references--> `OfferUsage`  [INFERRED]
  docs/ke-hoach-4-ket-qua-ngan-sach.vi.md → src/types/partner.ts

## Import Cycles
- None detected.

## Communities (155 total, 17 thin omitted)

### Community 0 - "admin-policy.ts"
Cohesion: 0.08
Nodes (39): AdminPage(), dynamic, metadata, dynamic, GET(), PATCH(), runtime, dynamic (+31 more)

### Community 1 - "app"
Cohesion: 0.08
Nodes (35): next, cancelSchema, dynamic, POST(), runtime, cancelBodySchema, dynamic, POST() (+27 more)

### Community 2 - "coach.service.ts"
Cohesion: 0.07
Nodes (31): 2.1 Yêu cầu chức năng, 2.2 Yêu cầu phi chức năng, 2.3 Quy tắc nghiệp vụ (Business Rules), 2.4 Quyết định mặc định (Agent dùng khi gặp điểm mơ hồ), 2. Phân tích yêu cầu, 9.6 Đặc tả thành phần then chốt, Luồng 1: Đặt sân tại quầy & Chống trùng lặp (Idempotency), Action (+23 more)

### Community 3 - "payment.test.js"
Cohesion: 0.06
Nodes (39): build, depends_on, environment, ports, profiles, volumes, context, dockerfile (+31 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.13
Nodes (32): dynamic, formatBookingForOperation(), GET(), POST(), venueOpActionSchema, assertVenueOperatorAccess(), BookingTimeSlot, calculateBookingPaymentDetails() (+24 more)

### Community 5 - "group-payment.service.ts"
Cohesion: 0.11
Nodes (34): 3. BẢNG TRƯỚC / SAU CỦA 6 CA HỒI QUY, Group, createGroupSchema, GroupAction, groupActionSchema, groupTotals(), ids, reason (+26 more)

### Community 6 - "empty-database.sql"
Cohesion: 0.11
Nodes (37): "Account", Account_provider_providerAccountId_key, "BookingItem", BookingItem_bookingId_idx, BookingItem_courtId_date_idx, "Court", Court_venueId_name_key, Court_venueId_sortOrder_idx (+29 more)

### Community 7 - "paymentErrorResponse"
Cohesion: 0.10
Nodes (31): dynamic, GET(), input, POST(), dynamic, GET(), POST(), runtime (+23 more)

### Community 8 - "lib/booking.ts"
Cohesion: 0.12
Nodes (29): CheckoutContent(), applyVoucher(), submit(), validateForm(), CheckoutPage(), CoachItem, BookPageProps, BusySlotItem (+21 more)

### Community 9 - "useAuth"
Cohesion: 0.11
Nodes (25): FavoritesPage(), LoginPage(), RegisterPage(), dynamic, VenueDetailPage(), VenueDetailPageProps, metadata, ReviewsPage() (+17 more)

### Community 10 - "venue-reviews-api.test.cjs"
Cohesion: 0.09
Nodes (30): dynamic, GET(), query, VenueDemoReviews(), getDemoReviews(), POSITIVE_ENDINGS, POSITIVE_TOPICS, reviewSeed() (+22 more)

### Community 11 - "venue-operations/page.tsx"
Cohesion: 0.09
Nodes (26): TimelineSchedule, TimelineSlot, CourtInfo, getTodayVN(), Order, SelectedVenueDetailed, StaffMember, VenueMeta (+18 more)

### Community 12 - "formatVND"
Cohesion: 0.09
Nodes (24): qrcode@1.5.4, qrcode, CoachAvailabilityItem, CoachBookingItem, CoachPortalPage(), CoachProfile, CoachVenueItem, SPECIALTY_OPTIONS (+16 more)

### Community 13 - "lib/booking.ts"
Cohesion: 0.08
Nodes (29): RegisterVenuePage(), submit(), AMENITY_ICONS, CourtConfig, DAY_LABELS, minToTimeStr(), PricingRuleConfig, timeStrToMin() (+21 more)

### Community 14 - "PaymentError"
Cohesion: 0.11
Nodes (27): 2.5. Sai lệch cấu trúc `getMyPartnerOffers` và `getPartnerReport`, 3. DANH SÁCH FILE THAY ĐỔI, DELETE(), dynamic, POST(), runtime, dynamic, PATCH() (+19 more)

### Community 15 - "lucide-react"
Cohesion: 0.10
Nodes (15): lucide-react, sonner, metadata, AccountPage(), ProfileResponse, metadata, formatRelativeTimeVN(), NotificationItem (+7 more)

### Community 16 - "db.ts"
Cohesion: 0.10
Nodes (25): dynamic, GET(), PATCH(), updateProfileSchema, dynamic, POST(), verifyEmailActionSchema, dynamic (+17 more)

### Community 17 - "coach-service.test.cjs"
Cohesion: 0.09
Nodes (24): assert, fs, { test }, ts, assert, fs, { test }, ts (+16 more)

### Community 18 - "SmashBook: tìm sân, đặt lịch và theo dõi thanh toán"
Cohesion: 0.07
Nodes (29): 10. Quyết định cho prototype, 11. Giả định và câu hỏi mở, 12. Ngoài phạm vi, 1. Mục đích, 2. Bối cảnh sản phẩm hiện có, 3. Trải nghiệm đích, 4. Hành trình người dùng, 5. Đặc tả luồng (+21 more)

### Community 19 - "readPaymentBody"
Cohesion: 0.10
Nodes (23): zod, dynamic, incidentSchema, POST(), runtime, dynamic, POST(), rescheduleSchema (+15 more)

### Community 20 - "auth.service.ts"
Cohesion: 0.19
Nodes (19): loginSchema, POST(), POST(), GET(), POST(), registerSchema, AUTH_COOKIE, sessionSecret() (+11 more)

### Community 21 - "20261015_coach_and_partner.sql"
Cohesion: 0.14
Nodes (26): "BookingPriceLine", BookingPriceLine_bookingId_idx, "CoachAvailability", CoachAvailability_coachId_startsAt_endsAt_idx, CoachAvailability_venueId_startsAt_endsAt_idx, "CoachBooking", CoachBooking_coachId_startsAt_endsAt_idx, CoachBooking_status_expiresAt_idx (+18 more)

### Community 22 - "react"
Cohesion: 0.12
Nodes (14): react, BookingsContent(), BookingsPage(), CancelBookingNoticeModal(), CancelBookingNoticeModalProps, CancellationPreviewData, IncidentModal(), IncidentModalProps (+6 more)

### Community 23 - "group-payment.service.ts"
Cohesion: 0.09
Nodes (15): assert, fs, assert, fs, slot, { test }, ts, assert (+7 more)

### Community 24 - "generate-venues-data.cjs"
Cohesion: 0.14
Nodes (18): dynamic, GET(), runtime, canPayBooking(), PaymentBooking, hasFinishedPlaying(), reviewInputSchema, createVietQrUrl() (+10 more)

### Community 25 - "dependencies"
Cohesion: 0.15
Nodes (19): PATCH(), dynamic, POST(), runtime, Context, dynamic, GET(), headers (+11 more)

### Community 26 - "devDependencies"
Cohesion: 0.15
Nodes (15): beVietnamPro, metadata, RootLayout(), viewport, Footer(), MobileTabBar(), Tab, Navbar() (+7 more)

### Community 27 - "test-group-integration.cjs"
Cohesion: 0.09
Nodes (21): 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU, 2.1. Lệch cấu trúc `GET /api/partner/profile`, 2.2. Thiếu `partnerId` khi tải danh sách ưu đãi và báo cáo, 2.3. Form đăng ký gửi `website` và chuỗi rỗng gây lỗi validation, 2.4. Form tạo ưu đãi gửi sai cấu trúc Schema, 2.6. Đồng bộ vai trò thành viên, 2. CHI TIẾT CÁC SAI KHÁC ĐÃ ĐƯỢC KHẮC PHỤC, 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (+13 more)

### Community 28 - "compilerOptions"
Cohesion: 0.09
Nodes (22): devDependencies, eslint@^8, eslint-config-next@14.2.6, postcss@^8, prisma@^5.18.0, @types/bcryptjs@^2.4.6, @types/leaflet@^1.9.22, @types/node@^20 (+14 more)

### Community 29 - "test-group-integration.cjs"
Cohesion: 0.15
Nodes (21): action(), assert, check(), config, crypto, db, fixture(), fs (+13 more)

### Community 30 - "refund-ledger.test.cjs"
Cohesion: 0.19
Nodes (16): cancelCoachBookingByCoach(), approveCancellationInTransaction(), assertMoney(), completeRefund(), refundLedger(), releaseCancelledResources(), reserveRefund(), Tx (+8 more)

### Community 31 - "cancellation-policy-suite.test.cjs"
Cohesion: 0.16
Nodes (18): dynamic, GET(), runtime, BookingRequest, analyzeCancellationTime(), calculateSlotTimestamp(), CANCELLATION_POLICY_VERSION, CancellationPolicyResult (+10 more)

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
Nodes (12): assert, { createHmac }, path, server, { spawn }, assert, crypto, fs (+4 more)

### Community 36 - "group-payment.sql"
Cohesion: 0.18
Nodes (19): "BookingGroup", BookingGroup_bookingId_key, BookingGroup_inviteToken_key, "GroupPaymentIntent", GroupPaymentIntent_code_key, GroupPaymentIntent_groupId_status_idx, "GroupRefund", GroupRefund_paymentId_key (+11 more)

### Community 37 - "settlement.service.ts"
Cohesion: 0.28
Nodes (18): courtActionSchema, dynamic, POST(), invalidatePublicVenueCache(), serializable(), assertCourtManagementAccess(), createCourt(), createCourtBlock() (+10 more)

### Community 38 - "coach-policy.ts"
Cohesion: 0.15
Nodes (16): assertCoachOwner(), assertNoOverlappingIntervals(), coachAvailabilityInputSchema, coachProfileInputSchema, CoachStatusUpdate, coachStatusUpdateSchema, DEMO_COACH_NAME, MAX_HOURLY_RATE (+8 more)

### Community 39 - "🏸 SmashBook — Phân tích & Thiết kế Hệ thống Đặt lịch Sân Cầu lông"
Cohesion: 0.11
Nodes (18): 0. Hướng dẫn dành cho Agent (đọc trước), 10.1 Bảo mật, 10.2 Kiểm thử, 10.3 Triển khai, 10. Bảo mật, kiểm thử, triển khai, 11. Kế hoạch triển khai (Milestones cho Agent), 1.1 Bối cảnh & mục tiêu, 1.2 Phạm vi (+10 more)

### Community 40 - "OfferUsage"
Cohesion: 0.19
Nodes (18): 4.5 Từ điển dữ liệu (rút gọn), 6.5 Chỉ mục & hiệu năng, 8.2 Lịch trống (`availability.ts`), 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 2.1. Nhóm 1: Hoàn tất giao dịch thống nhất & Chứng từ Voucher bền vững, 2.2. Nhóm 2: Đồng bộ SQL hết hạn và bù hoàn tiền cho Payment `REFUND_PENDING`, 2.3. Nhóm 3: Chuẩn hóa Script Backfill Voucher an toàn và Idempotent, 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN SỬA ĐỔI (+10 more)

### Community 41 - "Redis cache cho catalog sân và HLV"
Cohesion: 0.11
Nodes (16): Prompt kiểm tra setup và mở rộng Redis cache, Database Upstash đang dùng cho local, Khi dữ liệu thay đổi, Kiểm tra và nguồn tham khảo, Luồng xử lý và giới hạn, Nghiệm thu mở rộng ngày 06/11/2026, Nghiệm thu ngày 05/11/2026, Phạm vi đã áp dụng (+8 more)

### Community 42 - "ref_node_crypto"
Cohesion: 0.20
Nodes (9): createApp(), loadConfig(), createMockDb(), authenticateWebhook(), equalSecret(), createVietQrUrl(), config, sample (+1 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, lucide-react@^1.49.0, next@14.2.6, @prisma/client@^5.18.0, @radix-ui/react-dropdown-menu@^2.1.24, @radix-ui/react-tabs@^1.1.21 (+11 more)

### Community 44 - "scripts"
Cohesion: 0.17
Nodes (7): public."VoucherUsage", VoucherUsage_bookingId_idx, VoucherUsage_voucherId_bookingId_key, VoucherUsage_voucherId_idx, smashbook_private.audit_expired_candidates(), smashbook_private.expire_group_bookings(), smashbook_private.expire_group_bookings()

### Community 45 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+10 more)

### Community 46 - "ref_node_test"
Cohesion: 0.12
Nodes (11): assert, compiled, fs, { test }, ts, assert, test, assert (+3 more)

### Community 47 - "env.ts"
Cohesion: 0.19
Nodes (12): NavbarSearch(), DISTRICTS, PRICE_RANGES, SORT_OPTIONS, VenueSearchFilterProps, VenueSearchSuggestions(), VenueSearchSuggestionsProps, Court (+4 more)

### Community 48 - "venue-map.test.cjs"
Cohesion: 0.21
Nodes (14): leaflet@^1.9.4, leaflet, VenuesMap(), initialize(), locate(), selectVenue(), showAll(), directionsUrl() (+6 more)

### Community 49 - "hmac.pre-request.js"
Cohesion: 0.13
Nodes (10): @radix-ui/react-dialog@^1.1.23, @radix-ui/react-dialog, ReviewBookingModal(), Court, PricingRule, VenueCourtsModal(), handleAddPricing(), handleLockSlot() (+2 more)

### Community 50 - "@prisma/client"
Cohesion: 0.18
Nodes (12): @prisma/client, ReviewPhotoInput, validateReviewPhotos(), ConfirmIncidentInput, INCIDENT_LABELS, IncidentRequestType, IncidentType, ReportIncidentInput (+4 more)

### Community 51 - "coach.service.ts"
Cohesion: 0.16
Nodes (15): dynamic, GET(), runtime, assertCoachActive(), CoachAvailabilityInput, CoachCertificateInput, coachCertificateInputSchema, CoachProfileInput (+7 more)

### Community 52 - "venue.service.ts"
Cohesion: 0.20
Nodes (13): dynamic, GET(), searchSchema, VenuesPage(), VenuesPageProps, VenueSearchFilter(), recordPublicCacheDbQueries(), getVenueById() (+5 more)

### Community 53 - "AuthContext.tsx"
Cohesion: 0.18
Nodes (13): Providers(), ProvidersProps, AuthContext, AuthContextType, AuthProvider(), FavoritesProvider(), getUserStorageKey(), AuthResponse (+5 more)

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
Cohesion: 0.13
Nodes (12): bookingRequestSchema, buildVietQrPayload(), crc16Ccitt(), assert, config, { createHmac }, event, fs (+4 more)

### Community 61 - "venue-fuzzy-search.test.cjs"
Cohesion: 0.18
Nodes (12): calculateMatchScore(), escapeRegex(), levenshteinDistance(), MatchScoreResult, matchesVietnamese(), normalizeVietnamese(), assert, fs (+4 more)

### Community 62 - "sync"
Cohesion: 0.21
Nodes (14): 3. BẢNG TỔNG HỢP KIỂM THỬ TRƯỚC VÀ SAU KHI SỬA, 8. KẾT LUẬN NGHIỆM THU, 3. DANH SÁCH FILE THAY ĐỔI & TẠO MỚI, 2. BẢNG MA TRẬN CHUYỂN TRẠNG THÁI NGUYÊN TỬ (STATE MACHINE), 3.1. Đồng bộ nguyên tử trong cùng Database Transaction (`sync`), 3.2. Tính Lũy Thừa (Idempotency) khi Webhook lặp hoặc Retry, 3.3. Giải quyết các cuộc đua tranh chấp (Race Conditions), 3.4. Tái cân bằng bảng chia khi HLV hủy đơn nhóm trả một phần (+6 more)

### Community 63 - "3. KẾT QUẢ THỰC THI CÁC CÔNG CỤ XÁC MINH"
Cohesion: 0.13
Nodes (14): 1. THÔNG TIN MÔI TRƯỜNG & PHIÊN BẢN CÔNG CỤ, 2.1. Kiểm tra biến môi trường (Tuyệt đối không để lộ Secret), 2.2. Chẩn đoán mạng & Giao thức kết nối, 2.3. Báo cáo phần bị chặn đối với `scripts/test-group-integration.cjs`, 2. CHẨN ĐOÁN KẾT NỐI CƠ SỞ DỮ LIỆU & AN TOÀN DỮ LIỆU, 3.1. Prisma Schema Validation, 3.2. TypeScript Static Analysis (Strict Mode), 3.3. ESLint Verification (+6 more)

### Community 64 - "postcss.config.mjs"
Cohesion: 0.15
Nodes (13): 2. CÁC LỖI & ĐIỂM NGHIỆP VỤ ĐÃ XÁC MINH VÀ KHẮC PHỤC, Điểm 3: HLV hủy buổi đã trả tiền làm `paymentStatus` toàn đơn thành `REFUND_PENDING` (chặn check-in phần sân), Điểm 4: HLV hủy đơn nhóm đã trả một phần làm giảm tổng đơn nhưng không điều chỉnh bảng chia `GroupShare`, Điểm 5: Đồng bộ trạng thái đơn sân và HLV xuyên suốt vòng đời, Điểm 6: Đơn giá và hoa hồng snapshot bất biến, 2.1. Nguồn dữ liệu chuẩn (Single Source of Truth), 2.2. Công thức và Bất biến toàn vẹn, 2. NGUỒN DỮ LIỆU CHUẨN VÀ BẤT BIẾN TOÀN VẸN (INVARIANTS) (+5 more)

### Community 65 - "role-permissions-operations.test.cjs"
Cohesion: 0.15
Nodes (9): Operator, operatorVenueScope(), addVenueStaff(), createVenueStaffAccount(), setVenueStaffActive(), assert, fs, { test } (+1 more)

### Community 66 - "check-public-cache.cjs"
Cohesion: 0.15
Nodes (10): assert, fs, { loadEnvConfig }, loadTs(), main(), path, { randomUUID }, Redis (+2 more)

### Community 67 - "sepay-express/package.json"
Cohesion: 0.15
Nodes (13): dependencies, express@^5.1.0, engines, node, name, private, scripts, dev (+5 more)

### Community 68 - "package.json"
Cohesion: 0.14
Nodes (13): @auth/prisma-adapter@^2.11.3, bcryptjs@^3.0.3, ioredis@^6.0.0, react-dom@^18, react-hook-form@^7.89.0, name, private, version (+5 more)

### Community 69 - "coach-and-account-verification.test.cjs"
Cohesion: 0.14
Nodes (8): DEMO_COACH_HOURLY_RATE, DEMO_COACH_ID, DEMO_COACH_USER_ID, assert, crypto, fs, test, ts

### Community 70 - "partner-policy.ts"
Cohesion: 0.18
Nodes (12): MAX_PARTNER_BUDGET, MIN_PARTNER_BUDGET, PartnerMemberInput, partnerMemberInputSchema, partnerOfferInputSchema, PartnerOfferStatusUpdate, partnerOfferStatusUpdateSchema, PartnerProfileInput (+4 more)

### Community 71 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 72 - "5. Phân tích hướng đối tượng"
Cohesion: 0.15
Nodes (13): 5.1 Sơ đồ Use case, 5.2 Đặc tả Use case chính, 5.3 Biểu đồ lớp — Mô hình miền (Domain), 5.4 Biểu đồ lớp — Tầng dịch vụ & mẫu thiết kế, 5.5 Biểu đồ tuần tự, 5.6 Biểu đồ hoạt động — Quy trình đặt sân, 5.7 Biểu đồ trạng thái — Booking, 5. Phân tích hướng đối tượng (+5 more)

### Community 73 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 74 - "typescript"
Cohesion: 0.15
Nodes (10): typescript, assert, fs, { test }, ts, assert, fs, { test } (+2 more)

### Community 75 - "public-cache-invalidation.test.cjs"
Cohesion: 0.15
Nodes (9): actor, assert, cases, { createRequire }, fs, path, { test }, ts (+1 more)

### Community 76 - "serve-group-trial.cjs"
Cohesion: 0.18
Nodes (11): bcrypt, crypto, db, fs, main(), { PrismaClient }, { spawn, execFileSync }, stop() (+3 more)

### Community 77 - "Prisma Composer core concepts"
Cohesion: 0.17
Nodes (11): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+3 more)

### Community 78 - "Prisma Composer core concepts"
Cohesion: 0.17
Nodes (11): Building blocks and extensions, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development, Prisma Composer core concepts (+3 more)

### Community 79 - "getMyPartners"
Cohesion: 0.18
Nodes (12): 2.3. Phần C: Hợp đồng dữ liệu hồ sơ đối tác (`partner.service.ts`, route & page), 4.1. File `src/lib/group-payment.ts`, 4.2. File `src/services/coach.service.ts`, 4.3. File `src/services/group-payment.service.ts`, 4.4. File `src/services/partner.service.ts`, 4.5. File `src/app/partner/page.tsx`, 4.6. File `scripts/audit-voucher-backfill.cjs` (Mới), 4.7. File `tests/six-regression-cases.test.cjs` (Mới) (+4 more)

### Community 80 - "BÁO CÁO HOÀN THIỆN TOÀN LUỒNG HUẤN LUYỆN VIÊN (HLV) — SMASHBOOK"
Cohesion: 0.17
Nodes (11): 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU, 4.1. File Patch SQL, 4.2. Các bước triển khai cho DBA / DevOps, 4. HƯỚNG DẪN ÁP DỤNG DATABASE MIGRATION, 5.1. Kiểm tra tĩnh TypeScript Strict Mode, 5.2. Chạy toàn bộ Test Suites, 5.3. Chi tiết các kịch bản kiểm thử bắt buộc đã được tự động hóa, 5. LỆNH KIỂM THỬ VÀ KẾT QUẢ THỰC TẾ (+3 more)

### Community 81 - "coach-catalog-cache.test.cjs"
Cohesion: 0.20
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
Cohesion: 0.22
Nodes (9): array(), fs, path, quote(), sql, statements, ts, usedSlugs (+1 more)

### Community 87 - "app/page.tsx"
Cohesion: 0.27
Nodes (8): dynamic, HomePage(), HeroSearch(), FilterItem, FILTERS, QuickFilters(), getFeaturedVenues(), getTopRatedVenues()

### Community 88 - "public-coach-catalog.ts"
Cohesion: 0.27
Nodes (10): COACH_SPECIALTY_ALIASES, isDemoCoach(), normalizeCoachSpecialties(), normalizeCoachSpecialty(), CoachFilterParams, PublicCoachListItem, upsertMyCoachProfile(), listPublicCoachCatalog() (+2 more)

### Community 89 - "partner.service.ts"
Cohesion: 0.27
Nodes (10): assertPartnerActive(), assertPartnerMemberRole(), calculateOfferDiscount(), PartnerOfferInput, addPartnerMember(), createPartnerOffer(), OfferLedgerAuditReport, PublicOfferItem (+2 more)

### Community 90 - "settlement.service.ts"
Cohesion: 0.27
Nodes (10): asSafeTx(), completeBookingSettlement(), CompleteBookingSettlementParams, inMemoryVoucherRecordings, recordSingleVoucherUsage(), recordVoucherConsumption(), SafeTx, SettlementMockClient (+2 more)

### Community 91 - "venue-catalog-cache.test.cjs"
Cohesion: 0.22
Nodes (10): assert, fixture(), fs, loadTs(), { PaymentError }, ranker, row(), { test } (+2 more)

### Community 92 - "coach.ts"
Cohesion: 0.20
Nodes (9): Điểm 2: Tự động gán `ACTIVE` khi đăng ký cơ sở và thiếu vòng đời phê duyệt có phân quyền, CoachAvailabilitySlot, CoachBookingDetail, CoachBookingStatus, CoachCertificate, CoachProfile, CoachStatus, CoachVenueInfo (+1 more)

### Community 93 - "Kết nối website Next.js với SePay"
Cohesion: 0.20
Nodes (9): Biến môi trường Production trên Vercel, Chuẩn bị database trước khi deploy, Dữ liệu cơ sở cần có, Kiểm tra source, Kết nối website Next.js với SePay, Những phần đã có trong source, Thử luồng thanh toán, Triển khai (+1 more)

### Community 94 - "review.test.cjs"
Cohesion: 0.22
Nodes (6): starFillPercent(), assert, fs, now, { test }, ts

### Community 95 - "public-cache.test.cjs"
Cohesion: 0.20
Nodes (5): assert, errorModule, fs, { test }, ts

### Community 96 - "BÁO CÁO KỸ THUẬT: SỬA LỖI GIAO DỊCH NHÓM, BỘ ĐẾM VOUCHER VÀ HỒ SƠ ĐỐI TÁC"
Cohesion: 0.22
Nodes (8): 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 2.1. Phần A: Chia lại tiền khi HLV hủy đơn nhóm (`coach.service.ts` & `group-payment.ts`), 2.2. Phần B: Bộ đếm Voucher thường trong giao dịch nhóm (`group-payment.service.ts`), 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN THIẾT KẾ, 6.1. Phương án Backfill dữ liệu cũ, 6.2. Kế hoạch Rollback, 6. PHƯƠNG ÁN BACKFILL & KẾ HOẠCH ROLLBACK, BÁO CÁO KỸ THUẬT: SỬA LỖI GIAO DỊCH NHÓM, BỘ ĐẾM VOUCHER VÀ HỒ SƠ ĐỐI TÁC

### Community 97 - "types/booking.ts"
Cohesion: 0.22
Nodes (8): 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CỐT LÕI, Lỗi nghiêm trọng đã tái hiện (P1):, BookingIncidentRecord, BookingRescheduleRecord, BookingStatus, BookingTransferRecord, PaymentStatus, Voucher

### Community 98 - "BÁO CÁO KẾT QUẢ QUẢN LÝ NGÂN SÁCH & LƯỢT DÙNG ƯU ĐÃI ĐỐI TÁC — SMASHBOOK"
Cohesion: 0.22
Nodes (8): 3.1. Truy vấn tính toán đầy đủ `expiresAt: null`, 3.2. Serializable Transaction chống tranh chấp ngân sách cuối, 3.3. Chính sách hoàn ngân sách khi hủy đơn, 3.4. Hàm kiểm toán đối soát chỉ đọc (Read-only Audit), 3. CÁC NÂNG CẤP VÀ GIẢI PHÁP KỸ THUẬT, 4. KẾT QUẢ KIỂM THỬ THỰC TẾ, 5. PHẦN CHƯA KIỂM CHỨNG & GIỚI HẠN, BÁO CÁO KẾT QUẢ QUẢN LÝ NGÂN SÁCH & LƯỢT DÙNG ƯU ĐÃI ĐỐI TÁC — SMASHBOOK

### Community 99 - "preview-payment-fixture.cjs"
Cohesion: 0.22
Nodes (5): booking, child, http, server, { spawn }

### Community 100 - "partner-service.test.cjs"
Cohesion: 0.22
Nodes (8): partnerProfileInputSchema, assert, baseVenue, date, fs, future, { test }, ts

### Community 101 - "coach-reservation.test.cjs"
Cohesion: 0.22
Nodes (8): activeCoach, assert, baseVenue, date, fs, future, { test }, ts

### Community 102 - "review-images.test.cjs"
Cohesion: 0.22
Nodes (5): assert, { createHash }, fs, { test }, ts

### Community 103 - "9. Thiết kế UI/UX"
Cohesion: 0.25
Nodes (8): 9.1 Kế hoạch thiết kế (đã đối chiếu với mặc định phổ biến), 9.2 Design tokens, 9.3 Trạng thái ô lịch — không chỉ dựa vào màu (NFR-06), 9.4 Điều hướng & sơ đồ trang, 9.5 Wireframe các màn hình chính, 9.7 Nội dung giao diện (microcopy) & trạng thái, 9.8 Truy cập, SEO, PWA, 9. Thiết kế UI/UX

### Community 104 - "2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm"
Cohesion: 0.25
Nodes (7): 1. Sơ đồ Kiến trúc Tổng thể (Mermaid Diagram), 2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm, Luồng 2: Thu tiền mặt tại quầy & Tiêu thụ Voucher/PartnerOffer, Luồng 3: Hộp thoại Hủy đơn & Phân biệt Trạng thái (UI/UX), Luồng 4: Sổ Hoàn tiền (Refund Ledger) & Giải ngân có Chứng từ, Luồng 5: HLV Hủy ca & Tái cân bằng Đơn nhóm, Tài liệu Luồng Nghiệp vụ & Cấu trúc Dữ liệu SmashBook

### Community 105 - "[id]/page.tsx"
Cohesion: 0.25
Nodes (6): Điểm 1: `src/app/coach/page.tsx` dùng nhầm `CoachVenue.id` thay cho `Venue.id` và lệch key API, CoachCertificate, CoachDetail, CoachDetailPage(), CoachVenue, FreeSlot

### Community 106 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, cache:check, dev, lint, postinstall, start, test

### Community 107 - "venue-sessions/route.ts"
Cohesion: 0.36
Nodes (5): dynamic, GET(), POST(), cleanupExpiredBookings(), CleanupExpiredResult

### Community 108 - "review-post-api.test.cjs"
Cohesion: 0.25
Nodes (4): assert, fs, { test }, ts

### Community 109 - "load"
Cohesion: 0.29
Nodes (7): The service node is the only doorway, The service node is the only doorway, Two channels: dependencies and input, Builds are yours, Testing is an environment seam, The service node is the only doorway, load()

### Community 110 - "7. Thiết kế API & tích hợp"
Cohesion: 0.29
Nodes (7): 7.1 Quy ước, 7.2 Danh sách endpoint, 7.3 Schema Zod mẫu — tạo booking (`lib/validators/booking.ts`), 7.4 Tích hợp thanh toán VNPAY, 7.5 Thiết kế xác thực & phân quyền, 7. Thiết kế API & tích hợp, Session

### Community 111 - "8. Thuật toán lõi"
Cohesion: 0.29
Nodes (7): 8.1 Thời gian (`time.ts`), 8.3 Tính giá & giữ chỗ, 8.4 Tạo booking (`BookingService.create`), 8.5 Hết hạn giữ chỗ (xử lý lười + cron), 8.6 Xác nhận thanh toán — idempotent (`confirmPaid`), 8.7 Chính sách huỷ (`rules.ts`), 8. Thuật toán lõi

### Community 112 - "Quản trị SmashBook"
Cohesion: 0.29
Nodes (6): Chức năng, Database và triển khai, Kiểm tra, Lỗi PostgreSQL 42P05: prepared statement already exists, Quy tắc thanh toán và bảo mật, Quản trị SmashBook

### Community 113 - ""RefundDisbursement""
Cohesion: 0.38
Nodes (4): "RefundDisbursement", RefundDisbursement_refundId_idx, "RefundDisbursement", RefundDisbursement_refundId_idx

### Community 114 - "voucher-backfill.test.cjs"
Cohesion: 0.38
Nodes (5): auditAndBackfillVouchers(), main(), { PrismaClient }, assert, { test }

### Community 115 - "incidents/route.ts"
Cohesion: 0.33
Nodes (6): confirmSchema, dynamic, GET(), POST(), runtime, confirmBookingIncident()

### Community 116 - "map-tiles.test.cjs"
Cohesion: 0.33
Nodes (5): GET(), assert, fs, { test }, ts

### Community 117 - "env.ts"
Cohesion: 0.29
Nodes (4): ClientEnv, clientSchema, ServerEnv, serverSchema

### Community 118 - "admin.test.cjs"
Cohesion: 0.29
Nodes (4): assert, fs, { test }, ts

### Community 119 - "held-booking.test.cjs"
Cohesion: 0.29
Nodes (6): assert, booking, fs, now, { test }, ts

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

### Community 124 - "payment.service.js"
Cohesion: 0.60
Nodes (4): createPaymentController(), extractBookingCode(), receivePayment(), validatePayload()

### Community 125 - "20261026_venue_sessions_and_shifts.sql"
Cohesion: 0.47
Nodes (5): Booking_venueId_sessionStatus_idx, "StaffShift", StaffShift_userId_endedAt_idx, StaffShift_venueId_endedAt_idx, VenueStaff_venueId_isActive_idx

### Community 126 - "coaches/page.tsx"
Cohesion: 0.33
Nodes (4): CoachItem, CoachVenueItem, COACH_SPECIALTIES, CoachSpecialty

### Community 127 - "3. Công nghệ & kiến trúc"
Cohesion: 0.40
Nodes (5): 3.1 Stack (theo `tech-stack-template.md`), 3.2 Điều chỉnh & bổ sung so với template (**quan trọng**), 3.3 Kiến trúc tổng thể, 3.4 Cấu trúc thư mục, 3. Công nghệ & kiến trúc

### Community 128 - "5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ"
Cohesion: 0.40
Nodes (5): 5.1. Chạy 6 ca hồi quy độc lập, 5.2. Chạy toàn bộ Test Suite hiện có, 5.3. Kiểm tra kiểu TypeScript & ESLint, 5.4. Xác minh Production Build Next.js, 5. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### Community 129 - "review/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, POST(), readRawStreamBody(), runtime

### Community 130 - "api/coaches/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, GET(), runtime, getPublicCoaches()

### Community 131 - "api/offers/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, GET(), runtime, getPublicOffers()

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1082 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `app` to `admin-policy.ts`, `api/coaches/route.ts`, `api/offers/route.ts`, `auth.service.ts`, `group-payment.service.ts`, `coach.service.ts`, `paymentErrorResponse`, `lib/booking.ts`, `useAuth`, `venue-operations/page.tsx`, `formatVND`, `lib/booking.ts`, `PaymentError`, `lucide-react`, `db.ts`, `readPaymentBody`, `auth.service.ts`, `react`, `devDependencies`, `cancellation-policy-suite.test.cjs`, `settlement.service.ts`, `dependencies`, `env.ts`, `venue-map.test.cjs`, `coach.service.ts`, `venue.service.ts`, `package.json`, `app/page.tsx`, `[id]/page.tsx`, `venue-sessions/route.ts`, `incidents/route.ts`, `coaches/page.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin-policy.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08067375886524823 - nodes in this community are weakly interconnected._
- **Why does `PaymentError` connect `PaymentError` to `admin-policy.ts`, `app`, `review/route.ts`, `auth.service.ts`, `group-payment.service.ts`, `paymentErrorResponse`, `lib/booking.ts`, `venue-reviews-api.test.cjs`, `db.ts`, `readPaymentBody`, `generate-venues-data.cjs`, `dependencies`, `test-group-integration.cjs`, `refund-ledger.test.cjs`, `cancellation-policy-suite.test.cjs`, `settlement.service.ts`, `coach-policy.ts`, `@prisma/client`, `coach.service.ts`, `venue.service.ts`, `tailwindcss`, `qrcode`, `sync`, `postcss.config.mjs`, `role-permissions-operations.test.cjs`, `partner-policy.ts`, `auditOfferLedger`, `public-coach-catalog.ts`, `partner.service.ts`, `review-post-api.test.cjs`, `load`, `incidents/route.ts`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `app` be split into smaller, more focused modules?**
  _Cohesion score 0.07641196013289037 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `typescript` to `auth.service.ts`, `group-payment.service.ts`, `lib/booking.ts`, `venue-reviews-api.test.cjs`, `coach-service.test.cjs`, `group-payment.service.ts`, `generate-venues-data.cjs`, `compilerOptions`, `test-group-integration.cjs`, `concurrency-reservation.test.cjs`, `coach-policy.ts`, `ref_node_test`, `venue-map.test.cjs`, `qrcode`, `venue-fuzzy-search.test.cjs`, `role-permissions-operations.test.cjs`, `check-public-cache.cjs`, `package.json`, `coach-and-account-verification.test.cjs`, `partner-policy.ts`, `public-cache-invalidation.test.cjs`, `serve-group-trial.cjs`, `coach-catalog-cache.test.cjs`, `import-catalog.cjs`, `venue-catalog-cache.test.cjs`, `review.test.cjs`, `public-cache.test.cjs`, `partner-service.test.cjs`, `coach-reservation.test.cjs`, `review-images.test.cjs`, `review-post-api.test.cjs`, `map-tiles.test.cjs`, `admin.test.cjs`, `held-booking.test.cjs`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `coach.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06585365853658537 - nodes in this community are weakly interconnected._