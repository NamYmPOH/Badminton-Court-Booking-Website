# Graph Report - Badminton Court Booking Website  (2026-10-30)

## Corpus Check
- 223 files · ~290,321 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .example 2, (none) 2, .prisma 1)

## Summary
- 1743 nodes · 3914 edges · 116 communities (98 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 167 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `146a8f26`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- serializable
- app
- coach.service.ts
- payment.test.js
- auth.service.ts
- ref_node_assert
- assertSameOrigin
- lucide-react
- partner/offers/route.ts
- venue-staff/route.ts
- react
- venue.service.ts
- partner-policy.ts
- lib/booking.ts
- paymentErrorResponse
- 2. CÁC LỖI & ĐIỂM NGHIỆP VỤ ĐÃ XÁC MINH VÀ KHẮC PHỤC
- lucide-react
- venue-operations/page.tsx
- AdminDashboard.tsx
- readPaymentBody
- readPaymentBody
- [token]/route.ts
- bookings/page.tsx
- group-payment.service.ts
- generate-venues-data.cjs
- dependencies
- devDependencies
- test-group-integration.cjs
- compilerOptions
- auditOfferLedger
- reservation.service.ts
- OfferUsage
- getMyPartners
- sepay.ts
- package.json
- constants.ts
- partner.service.ts
- settlement.service.ts
- partner.ts
- empty-database.sql
- voucher-backfill.test.cjs
- SmashBook: tìm sân, đặt lịch và theo dõi thanh toán
- partner-service.test.cjs
- 20261015_coach_and_partner.sql
- scripts
- 9. Thiết kế UI/UX
- Phân tích luồng chia tiền nhóm và QR
- env.ts
- group-payment.sql
- hmac.pre-request.js
- smashbook_private.audit_expired_candidates
- 20261010090505_group_payment_shares.sql
- Prisma Platform core concepts
- createReservation
- tailwindcss
- .eslintrc.json
- 2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm
- next.config.mjs
- Prisma Platform core concepts
- Prisma Platform core concepts
- qrcode
- Prisma Platform core concepts
- serve-group-trial.cjs
- zustand@^5.0.15
- postcss.config.mjs
- 🏸 SmashBook — Phân tích & Thiết kế Hệ thống Đặt lịch Sân Cầu lông
- 3. KẾT QUẢ THỰC THI CÁC CÔNG CỤ XÁC MINH
- refund-ledger.test.cjs
- PaymentError
- Prisma Composer core concepts
- Prisma Composer core concepts
- VenueStaffModal.tsx
- sync
- 5. Phân tích hướng đối tượng
- Prisma Composer core concepts
- Prisma Composer core concepts
- BÁO CÁO HOÀN THIỆN TOÀN LUỒNG HUẤN LUYỆN VIÊN (HLV) — SMASHBOOK
- Ví dụ thanh toán SePay + VietQR với Express
- Kết nối website Next.js với SePay
- 8. Thuật toán lõi
- VenueCourtsModal
- admin.service.ts
- coach.ts
- load
- 2. Phân tích yêu cầu
- 3. Công nghệ & kiến trúc
- Quản trị SmashBook
- 20261026_venue_sessions_and_shifts.sql
- "RefundDisbursement"
- venue-map.test.cjs
- Hoàn tiền khi hủy HLV và sân — 29/10/2026
- 4. Phân tích hướng chức năng
- api/coaches/route.ts
- 7. Thiết kế API & tích hợp
- api/offers/route.ts
- Booking and checkout verification — 2026-10-06
- venue-search.test.cjs
- BÁO CÁO KỸ THUẬT: SỬA LỖI ĐỒNG BỘ GIAO DỊCH SAU HỦY HLV, SQL HẾT HẠN VÀ BACKFILL VOUCHER
- Sân demo 2.000 VND/giờ
- 20261008_admin.sql
- 20261008_sepay.sql
- README.md
- AGENTS.md
- payment-choice.md
- clsx
- prisma
- next-themes
- @radix-ui/react-tabs@^1.1.21
- tailwind-merge
- check-db-local.cjs
- @vercel/analytics
- 4. CHI TIẾT CÁC THAY ĐỔI MÃ NGUỒN

## God Nodes (most connected - your core abstractions)
1. `PaymentError` - 159 edges
2. `paymentErrorResponse()` - 80 edges
3. `next` - 63 edges
4. `requirePaymentUser()` - 57 edges
5. `assertSameOrigin()` - 51 edges
6. `serializable()` - 49 edges
7. `readPaymentBody()` - 47 edges
8. `formatVND()` - 39 edges
9. `lucide-react` - 34 edges
10. `react` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Luồng 1: Đặt sân tại quầy & Chống trùng lặp (Idempotency)` --references--> `date()`  [INFERRED]
  docs/business-flows-smashbook-2026.md → src/components/features/admin/AdminDashboard.tsx
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

## Communities (116 total, 18 thin omitted)

### Community 0 - "serializable"
Cohesion: 0.10
Nodes (43): dynamic, GET(), POST(), dynamic, GET(), POST(), venueOpActionSchema, approveBookingCancellation() (+35 more)

### Community 1 - "app"
Cohesion: 0.06
Nodes (38): build, depends_on, environment, ports, profiles, volumes, context, dockerfile (+30 more)

### Community 2 - "coach.service.ts"
Cohesion: 0.10
Nodes (31): dynamic, GET(), runtime, assertCoachActive(), assertCoachOwner(), assertNoOverlappingIntervals(), CoachAvailabilityInput, coachAvailabilityInputSchema (+23 more)

### Community 3 - "payment.test.js"
Cohesion: 0.05
Nodes (38): dependencies, express@^5.1.0, engines, node, name, private, scripts, dev (+30 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.12
Nodes (27): loginSchema, POST(), POST(), GET(), POST(), registerSchema, AuthContextType, AUTH_COOKIE (+19 more)

### Community 5 - "ref_node_assert"
Cohesion: 0.06
Nodes (40): typescript, assert, fs, GET(), assert, fs, { test }, ts (+32 more)

### Community 6 - "assertSameOrigin"
Cohesion: 0.16
Nodes (14): cancelBodySchema, dynamic, POST(), runtime, DELETE(), dynamic, POST(), runtime (+6 more)

### Community 7 - "lucide-react"
Cohesion: 0.38
Nodes (5): dynamic, VenueDetailPage(), VenueDetailPageProps, VenueDetailActions(), VenueDetailActionsProps

### Community 8 - "partner/offers/route.ts"
Cohesion: 0.19
Nodes (11): 2.5. Sai lệch cấu trúc `getMyPartnerOffers` và `getPartnerReport`, 3. DANH SÁCH FILE THAY ĐỔI, dynamic, GET(), POST(), runtime, dynamic, GET() (+3 more)

### Community 9 - "venue-staff/route.ts"
Cohesion: 0.25
Nodes (10): dynamic, GET(), PATCH(), POST(), staffActionSchema, updateStaffSchema, addVenueStaff(), createVenueStaffAccount() (+2 more)

### Community 10 - "react"
Cohesion: 0.08
Nodes (35): next, sonner, AccountPage(), CoachAvailabilityItem, CoachBookingItem, CoachPortalPage(), CoachProfile, CoachVenueItem (+27 more)

### Community 11 - "venue.service.ts"
Cohesion: 0.09
Nodes (29): 12.3 Từ vựng thuật ngữ Việt ↔ định danh code, dynamic, GET(), searchSchema, dynamic, HomePage(), VenuesPage(), VenuesPageProps (+21 more)

### Community 12 - "partner-policy.ts"
Cohesion: 0.19
Nodes (12): calculateOfferDiscount(), MAX_PARTNER_BUDGET, MIN_PARTNER_BUDGET, PartnerMemberInput, partnerMemberInputSchema, partnerOfferInputSchema, PartnerOfferStatusUpdate, partnerOfferStatusUpdateSchema (+4 more)

### Community 13 - "lib/booking.ts"
Cohesion: 0.12
Nodes (28): CheckoutContent(), applyVoucher(), submit(), validateForm(), CheckoutPage(), CoachItem, BookPageProps, CourtBookingGridPage() (+20 more)

### Community 14 - "paymentErrorResponse"
Cohesion: 0.12
Nodes (27): cancelSchema, dynamic, POST(), runtime, DELETE(), dynamic, GET(), POST() (+19 more)

### Community 15 - "2. CÁC LỖI & ĐIỂM NGHIỆP VỤ ĐÃ XÁC MINH VÀ KHẮC PHỤC"
Cohesion: 0.22
Nodes (9): 2. CÁC LỖI & ĐIỂM NGHIỆP VỤ ĐÃ XÁC MINH VÀ KHẮC PHỤC, Điểm 1: `src/app/coach/page.tsx` dùng nhầm `CoachVenue.id` thay cho `Venue.id` và lệch key API, Điểm 3: HLV hủy buổi đã trả tiền làm `paymentStatus` toàn đơn thành `REFUND_PENDING` (chặn check-in phần sân), Điểm 5: Đồng bộ trạng thái đơn sân và HLV xuyên suốt vòng đời, Điểm 6: Đơn giá và hoa hồng snapshot bất biến, BookingPriceLine, CoachSettlementSummary, PriceLineType (+1 more)

### Community 16 - "lucide-react"
Cohesion: 0.18
Nodes (12): lucide-react, NotificationItem, NavbarSearch(), DISTRICTS, PRICE_RANGES, SORT_OPTIONS, VenueSearchFilterProps, VenueSearchSuggestions() (+4 more)

### Community 17 - "venue-operations/page.tsx"
Cohesion: 0.07
Nodes (30): @radix-ui/react-dialog, react, Group, GroupPaymentPage(), OffersPage(), PublicOffer, PaymentBooking, PaymentResultContent() (+22 more)

### Community 18 - "AdminDashboard.tsx"
Cohesion: 0.17
Nodes (14): 9.6 Đặc tả thành phần then chốt, AdminPage(), dynamic, metadata, Action, AdminDashboard(), Badge(), date() (+6 more)

### Community 19 - "readPaymentBody"
Cohesion: 0.07
Nodes (36): 2.2. Công thức và Bất biến toàn vẹn, 3.2. Serializable Transaction chống tranh chấp ngân sách cuối, zod, dynamic, GET(), POST(), querySchema, reviewBodySchema (+28 more)

### Community 20 - "readPaymentBody"
Cohesion: 0.23
Nodes (9): dynamic, PATCH(), POST(), registerVenueSchema, runtime, POST(), runtime, readPaymentBody() (+1 more)

### Community 21 - "[token]/route.ts"
Cohesion: 0.16
Nodes (15): dynamic, GET(), dynamic, POST(), runtime, Context, dynamic, headers (+7 more)

### Community 22 - "bookings/page.tsx"
Cohesion: 0.25
Nodes (6): Luồng 3: Hộp thoại Hủy đơn & Phân biệt Trạng thái (UI/UX), BookingsContent(), BookingsPage(), CancelBookingNoticeModal(), CancelBookingNoticeModalProps, getUserBookings()

### Community 23 - "group-payment.service.ts"
Cohesion: 0.12
Nodes (34): createGroupSchema, GroupAction, groupActionSchema, groupTotals(), ids, reason, slotTime(), splitAmounts() (+26 more)

### Community 24 - "generate-venues-data.cjs"
Cohesion: 0.10
Nodes (16): fs, outputDir, path, PERSPECTIVES, THEMES, allVenuesList, AMENITY_SETS, dataDir (+8 more)

### Community 25 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @auth/prisma-adapter@^2.11.3, class-variance-authority@^0.7.1, date-fns@^4.4.0, lucide-react@^1.49.0, next@14.2.6, next-auth@^5.0.0-beta.20, @prisma/client@^5.18.0 (+12 more)

### Community 26 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, eslint@^8, eslint-config-next@14.2.6, postcss@^8, @types/bcryptjs@^2.4.6, @types/leaflet@^1.9.22, @types/node@^20, @types/qrcode@1.5.5 (+12 more)

### Community 27 - "test-group-integration.cjs"
Cohesion: 0.16
Nodes (20): action(), assert, check(), config, crypto, db, fixture(), fs (+12 more)

### Community 28 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+10 more)

### Community 29 - "auditOfferLedger"
Cohesion: 0.24
Nodes (10): 1. TỔNG QUAN NGHIỆM THU & PHẠM VI CÔNG VIỆC, 2. BẢNG TỔNG HỢP TEST CASES NGHIỆM THU (TEST MATRIX), 3.1. Các chức năng ĐÃ KIỂM CHỨNG TOÀN LUỒNG (End-to-End Logic & API Contract), 3.2. Các chức năng CHỈ KIỂM CHỨNG LOGIC / SERVICE, 3.3. Các chức năng CÒN BỊ CHẶN (BLOCKED), 3.4. Các chức năng CHƯA KIỂM CHỨNG TRÊN MÔI TRƯỜNG THỰC TẾ, 3. PHÂN ĐỊNH MỨC ĐỘ KIỂM CHỨNG CỦA CÁC CHỨC NĂNG, 4. KẾT LUẬN NGHIỆM THU (+2 more)

### Community 30 - "reservation.service.ts"
Cohesion: 0.15
Nodes (13): canPayBooking(), isCashBooking(), PaymentBooking, BookingRequest, SepayConfig, choosePaymentMethod(), StoredBooking, assert (+5 more)

### Community 31 - "OfferUsage"
Cohesion: 0.15
Nodes (17): 4.5 Từ điển dữ liệu (rút gọn), 6.5 Chỉ mục & hiệu năng, 8.2 Lịch trống (`availability.ts`), 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 5.1. Bảng chuyển trạng thái khi HLV hủy đơn làm đơn đủ tiền:, 5.2. Bảng chuyển trạng thái khi đơn hết hạn giữ chỗ:, 5. BẰNG CHỨNG TRẠNG THÁI TÀI NGUYÊN (STATE MATRIX), 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CỐT LÕI (+9 more)

### Community 32 - "getMyPartners"
Cohesion: 0.15
Nodes (14): 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 3. BẢNG TRƯỚC / SAU CỦA 6 CA HỒI QUY, 4.4. File `src/services/partner.service.ts`, 5.1. Chạy 6 ca hồi quy độc lập, 5.2. Chạy toàn bộ Test Suite hiện có, 5.3. Kiểm tra kiểu TypeScript & ESLint, 5.4. Xác minh Production Build Next.js, 5.5. Phân định rõ phạm vi kiểm thử (+6 more)

### Community 33 - "sepay.ts"
Cohesion: 0.17
Nodes (17): dynamic, GET(), PATCH(), runtime, dynamic, GET(), POST(), runtime (+9 more)

### Community 34 - "package.json"
Cohesion: 0.14
Nodes (13): bcryptjs@^3.0.3, ioredis@^6.0.0, @radix-ui/react-popover@^1.1.23, react-dom@^18, @tanstack/react-query@^5.104.1, name, private, version (+5 more)

### Community 35 - "constants.ts"
Cohesion: 0.14
Nodes (13): AMENITIES, Amenity, AMENITY_LABELS, BCRYPT_COST, DEFAULT_CANCEL_BEFORE_HOURS, DEFAULT_SLOT_MINUTES, HOLD_TTL_SECONDS, MAX_ADVANCE_DAYS (+5 more)

### Community 36 - "partner.service.ts"
Cohesion: 0.29
Nodes (9): assertPartnerActive(), assertPartnerMemberRole(), PartnerOfferInput, PartnerProfileInput, addPartnerMember(), createPartnerOffer(), OfferLedgerAuditReport, PublicOfferItem (+1 more)

### Community 37 - "settlement.service.ts"
Cohesion: 0.27
Nodes (10): asSafeTx(), completeBookingSettlement(), CompleteBookingSettlementParams, inMemoryVoucherRecordings, recordSingleVoucherUsage(), recordVoucherConsumption(), SafeTx, SettlementMockClient (+2 more)

### Community 38 - "partner.ts"
Cohesion: 0.11
Nodes (18): 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU, 2.1. Lệch cấu trúc `GET /api/partner/profile`, 2.2. Thiếu `partnerId` khi tải danh sách ưu đãi và báo cáo, 2.3. Form đăng ký gửi `website` và chuỗi rỗng gây lỗi validation, 2.4. Form tạo ưu đãi gửi sai cấu trúc Schema, 2.6. Đồng bộ vai trò thành viên, 2. CHI TIẾT CÁC SAI KHÁC ĐÃ ĐƯỢC KHẮC PHỤC, 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (+10 more)

### Community 39 - "empty-database.sql"
Cohesion: 0.09
Nodes (44): Booking_createdByStaffId_idx, Booking_source_idx, "Account", Account_provider_providerAccountId_key, "Booking", Booking_code_key, Booking_requestId_key, Booking_status_expiresAt_idx (+36 more)

### Community 40 - "voucher-backfill.test.cjs"
Cohesion: 0.38
Nodes (5): auditAndBackfillVouchers(), main(), { PrismaClient }, assert, { test }

### Community 41 - "SmashBook: tìm sân, đặt lịch và theo dõi thanh toán"
Cohesion: 0.07
Nodes (29): 10. Quyết định cho prototype, 11. Giả định và câu hỏi mở, 12. Ngoài phạm vi, 1. Mục đích, 2. Bối cảnh sản phẩm hiện có, 3. Trải nghiệm đích, 4. Hành trình người dùng, 5. Đặc tả luồng (+21 more)

### Community 42 - "partner-service.test.cjs"
Cohesion: 0.22
Nodes (8): partnerProfileInputSchema, assert, baseVenue, date, fs, future, { test }, ts

### Community 43 - "20261015_coach_and_partner.sql"
Cohesion: 0.14
Nodes (26): "BookingPriceLine", BookingPriceLine_bookingId_idx, "CoachAvailability", CoachAvailability_coachId_startsAt_endsAt_idx, CoachAvailability_venueId_startsAt_endsAt_idx, "CoachBooking", CoachBooking_coachId_startsAt_endsAt_idx, CoachBooking_status_expiresAt_idx (+18 more)

### Community 44 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, postinstall, start, test

### Community 45 - "9. Thiết kế UI/UX"
Cohesion: 0.25
Nodes (8): 9.1 Kế hoạch thiết kế (đã đối chiếu với mặc định phổ biến), 9.2 Design tokens, 9.3 Trạng thái ô lịch — không chỉ dựa vào màu (NFR-06), 9.4 Điều hướng & sơ đồ trang, 9.5 Wireframe các màn hình chính, 9.7 Nội dung giao diện (microcopy) & trạng thái, 9.8 Truy cập, SEO, PWA, 9. Thiết kế UI/UX

### Community 46 - "Phân tích luồng chia tiền nhóm và QR"
Cohesion: 0.10
Nodes (18): 10. Những phần cần bổ sung trong mã nguồn, 11. Điều chỉnh bộ sơ đồ và tài liệu, 12. Tiêu chí kiểm chứng khi triển khai, 1. Cơ sở và phạm vi, 2. Những điều phải giữ từ luồng trước, 3. Phân biệt ba loại QR, 4. Luồng người dùng đề xuất, 5. Trạng thái đơn và tiền phải tách riêng (+10 more)

### Community 47 - "env.ts"
Cohesion: 0.29
Nodes (4): ClientEnv, clientSchema, ServerEnv, serverSchema

### Community 48 - "group-payment.sql"
Cohesion: 0.18
Nodes (19): "BookingGroup", BookingGroup_bookingId_key, BookingGroup_inviteToken_key, "GroupPaymentIntent", GroupPaymentIntent_code_key, GroupPaymentIntent_groupId_status_idx, "GroupRefund", GroupRefund_paymentId_key (+11 more)

### Community 49 - "hmac.pre-request.js"
Cohesion: 0.33
Nodes (5): encoder, hex, rawBody, secret, timestamp

### Community 50 - "smashbook_private.audit_expired_candidates"
Cohesion: 0.17
Nodes (7): public."VoucherUsage", VoucherUsage_bookingId_idx, VoucherUsage_voucherId_bookingId_key, VoucherUsage_voucherId_idx, smashbook_private.audit_expired_candidates(), smashbook_private.expire_group_bookings(), smashbook_private.expire_group_bookings()

### Community 51 - "20261010090505_group_payment_shares.sql"
Cohesion: 0.23
Nodes (16): "BookingGroup", BookingGroup_bookingId_key, BookingGroup_inviteToken_key, "GroupPaymentIntent", GroupPaymentIntent_code_key, GroupPaymentIntent_groupId_status_idx, "GroupRefund", GroupRefund_paymentId_key (+8 more)

### Community 52 - "Prisma Platform core concepts"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 53 - "createReservation"
Cohesion: 0.16
Nodes (17): 2.1. Nhóm 1: Hoàn tất giao dịch thống nhất & Chứng từ Voucher bền vững, 2.2. Nhóm 2: Đồng bộ SQL hết hạn và bù hoàn tiền cho Payment `REFUND_PENDING`, 2.3. Nhóm 3: Chuẩn hóa Script Backfill Voucher an toàn và Idempotent, 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN SỬA ĐỔI, 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CỐT LÕI, 2.1. Nguồn dữ liệu chuẩn (Single Source of Truth), 2. NGUỒN DỮ LIỆU CHUẨN VÀ BẤT BIẾN TOÀN VẸN (INVARIANTS), 3.1. Truy vấn tính toán đầy đủ `expiresAt: null` (+9 more)

### Community 54 - "tailwindcss"
Cohesion: 0.50
Nodes (3): tailwindcss@^3.4.1, tailwindcss, config

### Community 56 - "2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm"
Cohesion: 0.25
Nodes (7): 1. Sơ đồ Kiến trúc Tổng thể (Mermaid Diagram), 2. Chi tiết 5 Luồng Nghiệp vụ Trọng tâm, Luồng 1: Đặt sân tại quầy & Chống trùng lặp (Idempotency), Luồng 2: Thu tiền mặt tại quầy & Tiêu thụ Voucher/PartnerOffer, Luồng 4: Sổ Hoàn tiền (Refund Ledger) & Giải ngân có Chứng từ, Luồng 5: HLV Hủy ca & Tái cân bằng Đơn nhóm, Tài liệu Luồng Nghiệp vụ & Cấu trúc Dữ liệu SmashBook

### Community 58 - "Prisma Platform core concepts"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 59 - "Prisma Platform core concepts"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 61 - "Prisma Platform core concepts"
Cohesion: 0.12
Nodes (15): Branches are preview environments, Environment variables, Failure modes quick reference, Local development, Object storage, Prisma Platform core concepts, Prisma Postgres, Project setup (+7 more)

### Community 62 - "serve-group-trial.cjs"
Cohesion: 0.05
Nodes (33): array(), fs, path, quote(), sql, statements, ts, usedSlugs (+25 more)

### Community 65 - "🏸 SmashBook — Phân tích & Thiết kế Hệ thống Đặt lịch Sân Cầu lông"
Cohesion: 0.08
Nodes (23): 0. Hướng dẫn dành cho Agent (đọc trước), 10.1 Bảo mật, 10.2 Kiểm thử, 10.3 Triển khai, 10. Bảo mật, kiểm thử, triển khai, 11. Kế hoạch triển khai (Milestones cho Agent), 12.1 Biến môi trường (`.env.example`), 12.2 Dữ liệu seed (toàn bộ **giả**) (+15 more)

### Community 66 - "3. KẾT QUẢ THỰC THI CÁC CÔNG CỤ XÁC MINH"
Cohesion: 0.13
Nodes (14): 1. THÔNG TIN MÔI TRƯỜNG & PHIÊN BẢN CÔNG CỤ, 2.1. Kiểm tra biến môi trường (Tuyệt đối không để lộ Secret), 2.2. Chẩn đoán mạng & Giao thức kết nối, 2.3. Báo cáo phần bị chặn đối với `scripts/test-group-integration.cjs`, 2. CHẨN ĐOÁN KẾT NỐI CƠ SỞ DỮ LIỆU & AN TOÀN DỮ LIỆU, 3.1. Prisma Schema Validation, 3.2. TypeScript Static Analysis (Strict Mode), 3.3. ESLint Verification (+6 more)

### Community 67 - "refund-ledger.test.cjs"
Cohesion: 0.26
Nodes (14): 2.1. Phần A: Chia lại tiền khi HLV hủy đơn nhóm (`coach.service.ts` & `group-payment.ts`), Điểm 4: HLV hủy đơn nhóm đã trả một phần làm giảm tổng đơn nhưng không điều chỉnh bảng chia `GroupShare`, cancelCoachBookingByCoach(), approveCancellationInTransaction(), assertMoney(), completeRefund(), refundLedger(), releaseCancelledResources() (+6 more)

### Community 68 - "PaymentError"
Cohesion: 0.26
Nodes (18): courtActionSchema, dynamic, GET(), POST(), PaymentError, assertCourtManagementAccess(), createCourt(), createCourtBlock() (+10 more)

### Community 69 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 70 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 71 - "VenueStaffModal.tsx"
Cohesion: 0.25
Nodes (4): VenueStaffData, VenueStaffMember, VenueStaffModal(), VenueStaffModalProps

### Community 72 - "sync"
Cohesion: 0.15
Nodes (17): 3. BẢNG TỔNG HỢP KIỂM THỬ TRƯỚC VÀ SAU KHI SỬA, 8. KẾT LUẬN NGHIỆM THU, 2. BẢNG MA TRẬN CHUYỂN TRẠNG THÁI NGUYÊN TỬ (STATE MACHINE), 3.1. Đồng bộ nguyên tử trong cùng Database Transaction (`sync`), 3.2. Tính Lũy Thừa (Idempotency) khi Webhook lặp hoặc Retry, 3.3. Giải quyết các cuộc đua tranh chấp (Race Conditions), 3.4. Tái cân bằng bảng chia khi HLV hủy đơn nhóm trả một phần, 3. CÁC GIẢI PHÁP KỸ THUẬT & BẢO ĐẢM TOÀN VẸN DỮ LIỆU (+9 more)

### Community 73 - "5. Phân tích hướng đối tượng"
Cohesion: 0.15
Nodes (13): 5.1 Sơ đồ Use case, 5.2 Đặc tả Use case chính, 5.3 Biểu đồ lớp — Mô hình miền (Domain), 5.4 Biểu đồ lớp — Tầng dịch vụ & mẫu thiết kế, 5.5 Biểu đồ tuần tự, 5.6 Biểu đồ hoạt động — Quy trình đặt sân, 5.7 Biểu đồ trạng thái — Booking, 5. Phân tích hướng đối tượng (+5 more)

### Community 74 - "Prisma Composer core concepts"
Cohesion: 0.17
Nodes (11): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+3 more)

### Community 75 - "Prisma Composer core concepts"
Cohesion: 0.17
Nodes (11): Building blocks and extensions, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development, Prisma Composer core concepts (+3 more)

### Community 76 - "BÁO CÁO HOÀN THIỆN TOÀN LUỒNG HUẤN LUYỆN VIÊN (HLV) — SMASHBOOK"
Cohesion: 0.17
Nodes (11): 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU, 4.1. File Patch SQL, 4.2. Các bước triển khai cho DBA / DevOps, 4. HƯỚNG DẪN ÁP DỤNG DATABASE MIGRATION, 5.1. Kiểm tra tĩnh TypeScript Strict Mode, 5.2. Chạy toàn bộ Test Suites, 5.3. Chi tiết các kịch bản kiểm thử bắt buộc đã được tự động hóa, 5. LỆNH KIỂM THỬ VÀ KẾT QUẢ THỰC TẾ (+3 more)

### Community 77 - "Ví dụ thanh toán SePay + VietQR với Express"
Cohesion: 0.18
Nodes (10): 1. Cấu trúc, 2. Cấu hình và chạy, 3. Xác thực đúng loại webhook, 4. Tạo booking bằng Postman, 5. Giả lập webhook bằng Postman, 6. Logic và các ca test, 7. Polling ở frontend, 8. Nhận webhook từ SePay khi chạy local (+2 more)

### Community 78 - "Kết nối website Next.js với SePay"
Cohesion: 0.20
Nodes (9): Biến môi trường Production trên Vercel, Chuẩn bị database trước khi deploy, Dữ liệu cơ sở cần có, Kiểm tra source, Kết nối website Next.js với SePay, Những phần đã có trong source, Thử luồng thanh toán, Triển khai (+1 more)

### Community 79 - "8. Thuật toán lõi"
Cohesion: 0.29
Nodes (7): 8.1 Thời gian (`time.ts`), 8.3 Tính giá & giữ chỗ, 8.4 Tạo booking (`BookingService.create`), 8.5 Hết hạn giữ chỗ (xử lý lười + cron), 8.6 Xác nhận thanh toán — idempotent (`confirmPaid`), 8.7 Chính sách huỷ (`rules.ts`), 8. Thuật toán lõi

### Community 80 - "VenueCourtsModal"
Cohesion: 0.32
Nodes (4): VenueCourtsModal(), handleAddPricing(), handleLockSlot(), timeToMin()

### Community 81 - "admin.service.ts"
Cohesion: 0.16
Nodes (17): 3. DANH SÁCH FILE THAY ĐỔI & TẠO MỚI, Điểm 2: Tự động gán `ACTIVE` khi đăng ký cơ sở và thiếu vòng đời phê duyệt có phân quyền, @prisma/client, AdminAction, checkBookingAction(), Operator, operatorVenueScope(), performAdminAction() (+9 more)

### Community 82 - "coach.ts"
Cohesion: 0.25
Nodes (7): CoachAvailabilitySlot, CoachBookingDetail, CoachBookingStatus, CoachCertificate, CoachProfile, CoachStatus, CoachVenueInfo

### Community 83 - "load"
Cohesion: 0.29
Nodes (7): The service node is the only doorway, The service node is the only doorway, Two channels: dependencies and input, Builds are yours, Testing is an environment seam, The service node is the only doorway, load()

### Community 84 - "2. Phân tích yêu cầu"
Cohesion: 0.40
Nodes (5): 2.1 Yêu cầu chức năng, 2.2 Yêu cầu phi chức năng, 2.3 Quy tắc nghiệp vụ (Business Rules), 2.4 Quyết định mặc định (Agent dùng khi gặp điểm mơ hồ), 2. Phân tích yêu cầu

### Community 85 - "3. Công nghệ & kiến trúc"
Cohesion: 0.40
Nodes (5): 3.1 Stack (theo `tech-stack-template.md`), 3.2 Điều chỉnh & bổ sung so với template (**quan trọng**), 3.3 Kiến trúc tổng thể, 3.4 Cấu trúc thư mục, 3. Công nghệ & kiến trúc

### Community 86 - "Quản trị SmashBook"
Cohesion: 0.29
Nodes (6): Chức năng, Database và triển khai, Kiểm tra, Lỗi PostgreSQL 42P05: prepared statement already exists, Quy tắc thanh toán và bảo mật, Quản trị SmashBook

### Community 87 - "20261026_venue_sessions_and_shifts.sql"
Cohesion: 0.38
Nodes (6): Booking_venueId_sessionStatus_idx, "StaffShift", StaffShift_userId_endedAt_idx, StaffShift_venueId_endedAt_idx, VenueStaff_venueId_isActive_idx, "VenueStaff"

### Community 88 - ""RefundDisbursement""
Cohesion: 0.38
Nodes (4): "RefundDisbursement", RefundDisbursement_refundId_idx, "RefundDisbursement", RefundDisbursement_refundId_idx

### Community 89 - "venue-map.test.cjs"
Cohesion: 0.17
Nodes (15): leaflet@^1.9.4, leaflet, VenuesMap(), initialize(), locate(), selectVenue(), showAll(), MOCK_VENUES (+7 more)

### Community 90 - "Hoàn tiền khi hủy HLV và sân — 29/10/2026"
Cohesion: 0.33
Nodes (5): Các luồng đã thống nhất, Hoàn tiền khi hủy HLV và sân — 29/10/2026, Kiểm tra, Migration và dữ liệu cũ, Quy tắc ghi sổ

### Community 91 - "4. Phân tích hướng chức năng"
Cohesion: 0.40
Nodes (5): 4.1 Sơ đồ phân rã chức năng (BFD), 4.2 DFD mức 0 (sơ đồ ngữ cảnh), 4.3 DFD mức 1, 4.4 DFD mức 2 — Tiến trình P3 "Đặt sân", 4. Phân tích hướng chức năng

### Community 92 - "api/coaches/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, GET(), runtime, getPublicCoaches()

### Community 93 - "7. Thiết kế API & tích hợp"
Cohesion: 0.33
Nodes (6): 7.1 Quy ước, 7.2 Danh sách endpoint, 7.3 Schema Zod mẫu — tạo booking (`lib/validators/booking.ts`), 7.4 Tích hợp thanh toán VNPAY, 7.5 Thiết kế xác thực & phân quyền, 7. Thiết kế API & tích hợp

### Community 94 - "api/offers/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, GET(), runtime, getPublicOffers()

### Community 95 - "Booking and checkout verification — 2026-10-06"
Cohesion: 0.40
Nodes (4): Booking and checkout verification — 2026-10-06, Changes and verification, Original deployment, Remaining limitations

### Community 96 - "venue-search.test.cjs"
Cohesion: 0.50
Nodes (4): assert, matchesVietnamese(), normalizeVietnamese(), test

### Community 97 - "BÁO CÁO KỸ THUẬT: SỬA LỖI ĐỒNG BỘ GIAO DỊCH SAU HỦY HLV, SQL HẾT HẠN VÀ BACKFILL VOUCHER"
Cohesion: 0.25
Nodes (7): 4. CHI TIẾT CÁC LỆNH ĐÃ THỰC THI VÀ EXIT CODE, 6.1. Triển khai Migration Cơ sở dữ liệu (PostgreSQL), 6.2. Đối soát dữ liệu cũ và Kế hoạch Backfill, 6.3. Kế hoạch Rollback (Khai trừ rủi ro), 6. HƯỚNG DẪN TRIỂN KHAI, DI CHUYỂN DỮ LIỆU VÀ ROLLBACK, 7. RỦI RO CÒN LẠI VÀ KHUYẾN NGHỊ VẬN HÀNH, BÁO CÁO KỸ THUẬT: SỬA LỖI ĐỒNG BỘ GIAO DỊCH SAU HỦY HLV, SQL HẾT HẠN VÀ BACKFILL VOUCHER

### Community 98 - "Sân demo 2.000 VND/giờ"
Cohesion: 0.50
Nodes (3): Kiểm chứng và giới hạn, Phạm vi, Sân demo 2.000 VND/giờ

### Community 99 - "20261008_admin.sql"
Cohesion: 0.83
Nodes (3): "AdminAudit", AdminAudit_createdAt_idx, AdminAudit_entityId_createdAt_idx

### Community 100 - "20261008_sepay.sql"
Cohesion: 0.67
Nodes (3): Booking_requestId_key, "SepayReceipt", SepayReceipt_result_receivedAt_idx

### Community 101 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 116 - "4. CHI TIẾT CÁC THAY ĐỔI MÃ NGUỒN"
Cohesion: 0.18
Nodes (11): 2.2. Phần B: Bộ đếm Voucher thường trong giao dịch nhóm (`group-payment.service.ts`), 2.3. Phần C: Hợp đồng dữ liệu hồ sơ đối tác (`partner.service.ts`, route & page), 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN THIẾT KẾ, 4.1. File `src/lib/group-payment.ts`, 4.2. File `src/services/coach.service.ts`, 4.3. File `src/services/group-payment.service.ts`, 4.5. File `src/app/partner/page.tsx`, 4.6. File `scripts/audit-voucher-backfill.cjs` (Mới) (+3 more)

## Knowledge Gaps
- **1 isolated node(s):** `next/core-web-vitals`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 796 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `react` to `serializable`, `coach.service.ts`, `auth.service.ts`, `assertSameOrigin`, `lucide-react`, `partner/offers/route.ts`, `venue-staff/route.ts`, `venue.service.ts`, `lib/booking.ts`, `paymentErrorResponse`, `lucide-react`, `venue-operations/page.tsx`, `AdminDashboard.tsx`, `readPaymentBody`, `readPaymentBody`, `[token]/route.ts`, `bookings/page.tsx`, `dependencies`, `package.json`, `PaymentError`, `venue-map.test.cjs`, `api/coaches/route.ts`, `api/offers/route.ts`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `serializable` be split into smaller, more focused modules?**
  _Cohesion score 0.09502262443438914 - nodes in this community are weakly interconnected._
- **Why does `PaymentError` connect `PaymentError` to `serializable`, `coach.service.ts`, `payment.test.js`, `assertSameOrigin`, `partner/offers/route.ts`, `venue-staff/route.ts`, `partner-policy.ts`, `lib/booking.ts`, `paymentErrorResponse`, `AdminDashboard.tsx`, `readPaymentBody`, `readPaymentBody`, `[token]/route.ts`, `group-payment.service.ts`, `test-group-integration.cjs`, `auditOfferLedger`, `reservation.service.ts`, `sepay.ts`, `partner.service.ts`, `refund-ledger.test.cjs`, `sync`, `admin.service.ts`, `load`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `app` be split into smaller, more focused modules?**
  _Cohesion score 0.05668016194331984 - nodes in this community are weakly interconnected._
- **Why does `load()` connect `load` to `PaymentError`, `Prisma Composer core concepts`, `Prisma Composer core concepts`, `Prisma Composer core concepts`, `Prisma Composer core concepts`, `group-payment.service.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `coach.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09747899159663866 - nodes in this community are weakly interconnected._