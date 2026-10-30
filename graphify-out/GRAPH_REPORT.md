# Graph Report - Badminton Court Booking Website  (2026-10-30)

## Corpus Check
- 221 files · ~286,002 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .example 2, (none) 2, .prisma 1)

## Summary
- 1726 nodes · 3879 edges · 114 communities (96 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 162 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `788e13b6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- serializable
- app
- coach.service.ts
- payment.test.js
- auth.service.ts
- ref_node_assert
- sepay.test.cjs
- lucide-react
- utils.ts
- serve-group-trial.cjs
- react
- venue.service.ts
- partner.service.ts
- lib/booking.ts
- requirePaymentUser
- formatVND
- venue-map.test.cjs
- venue-operations/page.tsx
- AdminDashboard.tsx
- readPaymentBody
- sepay.ts
- sepay.service.ts
- PaymentError
- group-payment.service.ts
- generate-venues-data.cjs
- dependencies
- devDependencies
- test-group-integration.cjs
- compilerOptions
- auditOfferLedger
- paymentErrorResponse
- OfferUsage
- getMyPartners
- sepay.ts
- package.json
- constants.ts
- group-payment.ts
- settlement.service.ts
- partner.ts
- empty-database.sql
- coach.ts
- SmashBook: tìm sân, đặt lịch và theo dõi thanh toán
- typescript
- 20261015_coach_and_partner.sql
- scripts
- voucher-backfill.test.cjs
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
- prisma
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
- venue-court.service.ts
- Prisma Composer core concepts
- Prisma Composer core concepts
- partner/offers/route.ts
- sync
- 5. Phân tích hướng đối tượng
- Prisma Composer core concepts
- Prisma Composer core concepts
- BÁO CÁO HOÀN THIỆN TOÀN LUỒNG HUẤN LUYỆN VIÊN (HLV) — SMASHBOOK
- Ví dụ thanh toán SePay + VietQR với Express
- Kết nối website Next.js với SePay
- CourtBlock
- 9. Thiết kế UI/UX
- bookings/page.tsx
- VenueStaffModal.tsx
- load
- VenueCard.tsx
- 8. Thuật toán lõi
- Quản trị SmashBook
- 20261026_venue_sessions_and_shifts.sql
- "RefundDisbursement"
- 6. Thiết kế dữ liệu
- Hoàn tiền khi hủy HLV và sân — 29/10/2026
- CheckoutContent
- 1. Tổng quan
- 3. Công nghệ & kiến trúc
- 4. Phân tích hướng chức năng
- Booking and checkout verification — 2026-10-06
- 12. Phụ lục
- 6. HƯỚNG DẪN TRIỂN KHAI, DI CHUYỂN DỮ LIỆU VÀ ROLLBACK
- Sân demo 2.000 VND/giờ
- 20261008_admin.sql
- 20261008_sepay.sql
- README.md
- AGENTS.md
- payment-choice.md
- clsx
- next-themes
- @radix-ui/react-tabs@^1.1.21
- tailwind-merge
- @vercel/analytics
- createMockDb

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
- `11. Kế hoạch triển khai (Milestones cho Agent)` --references--> `VenueCard()`  [INFERRED]
  badminton-booking-spec.md → src/components/features/venues/VenueCard.tsx
- `9.5 Wireframe các màn hình chính` --references--> `VenueCard()`  [INFERRED]
  badminton-booking-spec.md → src/components/features/venues/VenueCard.tsx
- `4.2. File `src/services/coach.service.ts`` --references--> `cancelCoachBookingByCoach()`  [INFERRED]
  docs/bao-cao-sua-loi-giao-dich-nhom-voucher-doi-tac.vi.md → src/services/coach.service.ts
- `Builds are yours` --references--> `load()`  [INFERRED]
  .agents/skills/prisma-composer-core-concepts/SKILL.md → src/services/group-payment.service.ts
- `Testing is an environment seam` --references--> `load()`  [INFERRED]
  .agents/skills/prisma-composer-core-concepts/SKILL.md → src/services/group-payment.service.ts

## Import Cycles
- None detected.

## Communities (114 total, 18 thin omitted)

### Community 0 - "serializable"
Cohesion: 0.13
Nodes (38): dynamic, GET(), POST(), venueOpActionSchema, serializable(), addVenueStaff(), approveBookingCancellation(), assertVenueOperatorAccess() (+30 more)

### Community 1 - "app"
Cohesion: 0.06
Nodes (38): build, depends_on, environment, ports, profiles, volumes, context, dockerfile (+30 more)

### Community 2 - "coach.service.ts"
Cohesion: 0.07
Nodes (42): DELETE(), dynamic, POST(), runtime, dynamic, GET(), POST(), runtime (+34 more)

### Community 3 - "payment.test.js"
Cohesion: 0.09
Nodes (25): dependencies, express@^5.1.0, engines, node, name, private, scripts, dev (+17 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.12
Nodes (27): loginSchema, POST(), POST(), GET(), POST(), registerSchema, AuthContextType, AUTH_COOKIE (+19 more)

### Community 5 - "ref_node_assert"
Cohesion: 0.05
Nodes (47): typescript, assert, fs, assert, fs, { test }, ts, activeCoach (+39 more)

### Community 6 - "sepay.test.cjs"
Cohesion: 0.13
Nodes (10): bookingRequestSchema, assert, config, { createHmac }, event, fs, input, { test } (+2 more)

### Community 7 - "lucide-react"
Cohesion: 0.27
Nodes (10): lucide-react, DISTRICTS, PRICE_RANGES, SORT_OPTIONS, VenueSearchFilterProps, VenueSearchSuggestions(), VenueSearchSuggestionsProps, Court (+2 more)

### Community 8 - "utils.ts"
Cohesion: 0.25
Nodes (9): Navbar(), NavbarProps, NavLink(), NavbarSearch(), Button, ButtonProps, buttonVariants, ThemeToggle() (+1 more)

### Community 9 - "serve-group-trial.cjs"
Cohesion: 0.08
Nodes (18): array(), fs, path, quote(), sql, statements, ts, usedSlugs (+10 more)

### Community 10 - "react"
Cohesion: 0.09
Nodes (30): next, react, sonner, AccountPage(), CoachItem, CoachAvailabilityItem, CoachBookingItem, CoachPortalPage() (+22 more)

### Community 11 - "venue.service.ts"
Cohesion: 0.09
Nodes (28): dynamic, GET(), searchSchema, dynamic, HomePage(), VenuesPage(), VenuesPageProps, dynamic (+20 more)

### Community 12 - "partner.service.ts"
Cohesion: 0.09
Nodes (34): dynamic, GET(), runtime, assertPartnerActive(), assertPartnerMemberRole(), calculateOfferDiscount(), MAX_PARTNER_BUDGET, MIN_PARTNER_BUDGET (+26 more)

### Community 13 - "lib/booking.ts"
Cohesion: 0.17
Nodes (22): BookPageProps, CourtBookingGridPage(), PendingSwitch, CourtSwitchConfirmModal(), CourtSwitchConfirmModalProps, bookingDates(), formatHour(), isDemoBooked() (+14 more)

### Community 14 - "requirePaymentUser"
Cohesion: 0.10
Nodes (29): cancelSchema, dynamic, POST(), runtime, cancelBodySchema, dynamic, POST(), runtime (+21 more)

### Community 15 - "formatVND"
Cohesion: 0.11
Nodes (15): Group, GroupPaymentPage(), OffersPage(), PublicOffer, PaymentBooking, PaymentResultContent(), PaymentResultPage(), VenueOperationsPage() (+7 more)

### Community 16 - "venue-map.test.cjs"
Cohesion: 0.17
Nodes (15): leaflet@^1.9.4, leaflet, VenuesMap(), initialize(), locate(), selectVenue(), showAll(), MOCK_VENUES (+7 more)

### Community 17 - "venue-operations/page.tsx"
Cohesion: 0.10
Nodes (18): @radix-ui/react-dialog, CourtInfo, Order, StaffMember, VenueMeta, CounterBookingModal(), handleSubmit(), timeToMin() (+10 more)

### Community 18 - "AdminDashboard.tsx"
Cohesion: 0.16
Nodes (15): 8.2 Lịch trống (`availability.ts`), 9.6 Đặc tả thành phần then chốt, AdminPage(), dynamic, metadata, Action, AdminDashboard(), Badge() (+7 more)

### Community 19 - "readPaymentBody"
Cohesion: 0.12
Nodes (27): dynamic, GET(), POST(), querySchema, reviewBodySchema, runtime, dynamic, GET() (+19 more)

### Community 20 - "sepay.ts"
Cohesion: 0.11
Nodes (17): zod, dynamic, POST(), runtime, validateOfferSchema, POST(), runtime, AdminAction (+9 more)

### Community 21 - "sepay.service.ts"
Cohesion: 0.24
Nodes (11): canPayBooking(), PaymentBooking, BookingRequest, extractGroupCode(), eventFingerprint(), extractBookingCode(), SepayConfig, SepayEvent (+3 more)

### Community 22 - "PaymentError"
Cohesion: 0.18
Nodes (18): Điểm 2: Tự động gán `ACTIVE` khi đăng ký cơ sở và thiếu vòng đời phê duyệt có phân quyền, DELETE(), dynamic, GET(), POST(), runtime, dynamic, PATCH() (+10 more)

### Community 23 - "group-payment.service.ts"
Cohesion: 0.22
Nodes (17): slotTime(), activeUser(), assertLive(), audit(), Bank, expire(), expireGroups(), Group (+9 more)

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
Cohesion: 0.18
Nodes (18): 4.1. File `src/lib/group-payment.ts`, action(), assert, check(), config, crypto, db, fixture() (+10 more)

### Community 28 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+10 more)

### Community 29 - "auditOfferLedger"
Cohesion: 0.24
Nodes (10): 1. TỔNG QUAN NGHIỆM THU & PHẠM VI CÔNG VIỆC, 2. BẢNG TỔNG HỢP TEST CASES NGHIỆM THU (TEST MATRIX), 3.1. Các chức năng ĐÃ KIỂM CHỨNG TOÀN LUỒNG (End-to-End Logic & API Contract), 3.2. Các chức năng CHỈ KIỂM CHỨNG LOGIC / SERVICE, 3.3. Các chức năng CÒN BỊ CHẶN (BLOCKED), 3.4. Các chức năng CHƯA KIỂM CHỨNG TRÊN MÔI TRƯỜNG THỰC TẾ, 3. PHÂN ĐỊNH MỨC ĐỘ KIỂM CHỨNG CỦA CÁC CHỨC NĂNG, 4. KẾT LUẬN NGHIỆM THU (+2 more)

### Community 30 - "paymentErrorResponse"
Cohesion: 0.11
Nodes (27): dynamic, GET(), dynamic, GET(), PATCH(), runtime, dynamic, GET() (+19 more)

### Community 31 - "OfferUsage"
Cohesion: 0.13
Nodes (23): 4.5 Từ điển dữ liệu (rút gọn), 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 2.1. Nhóm 1: Hoàn tất giao dịch thống nhất & Chứng từ Voucher bền vững, 2.2. Nhóm 2: Đồng bộ SQL hết hạn và bù hoàn tiền cho Payment `REFUND_PENDING`, 2.3. Nhóm 3: Chuẩn hóa Script Backfill Voucher an toàn và Idempotent, 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN SỬA ĐỔI, 3. BẢNG TỔNG HỢP KIỂM THỬ TRƯỚC VÀ SAU KHI SỬA, 4. CHI TIẾT CÁC LỆNH ĐÃ THỰC THI VÀ EXIT CODE (+15 more)

### Community 32 - "getMyPartners"
Cohesion: 0.09
Nodes (25): 1. TỔNG QUAN VÀ BỐI CẢNH KIỂM TRA, 2.1. Phần A: Chia lại tiền khi HLV hủy đơn nhóm (`coach.service.ts` & `group-payment.ts`), 2.2. Phần B: Bộ đếm Voucher thường trong giao dịch nhóm (`group-payment.service.ts`), 2.3. Phần C: Hợp đồng dữ liệu hồ sơ đối tác (`partner.service.ts`, route & page), 2. NGUYÊN NHÂN GỐC RỄ VÀ PHƯƠNG ÁN THIẾT KẾ, 3. BẢNG TRƯỚC / SAU CỦA 6 CA HỒI QUY, 4.2. File `src/services/coach.service.ts`, 4.3. File `src/services/group-payment.service.ts` (+17 more)

### Community 33 - "sepay.ts"
Cohesion: 0.09
Nodes (29): dynamic, POST(), runtime, Context, dynamic, GET(), headers, POST() (+21 more)

### Community 34 - "package.json"
Cohesion: 0.14
Nodes (13): bcryptjs@^3.0.3, ioredis@^6.0.0, @radix-ui/react-popover@^1.1.23, react-dom@^18, @tanstack/react-query@^5.104.1, name, private, version (+5 more)

### Community 35 - "constants.ts"
Cohesion: 0.14
Nodes (13): AMENITIES, Amenity, AMENITY_LABELS, BCRYPT_COST, DEFAULT_CANCEL_BEFORE_HOURS, DEFAULT_SLOT_MINUTES, HOLD_TTL_SECONDS, MAX_ADVANCE_DAYS (+5 more)

### Community 36 - "group-payment.ts"
Cohesion: 0.20
Nodes (12): createGroupSchema, GroupAction, groupActionSchema, groupTotals(), ids, reason, ticketValue(), validTicket() (+4 more)

### Community 37 - "settlement.service.ts"
Cohesion: 0.15
Nodes (13): @prisma/client, { loadEnvConfig }, { PrismaClient }, asSafeTx(), completeBookingSettlement(), CompleteBookingSettlementParams, inMemoryVoucherRecordings, recordSingleVoucherUsage() (+5 more)

### Community 38 - "partner.ts"
Cohesion: 0.09
Nodes (21): 1. TỔNG QUAN YÊU CẦU & MỤC TIÊU, 2.1. Lệch cấu trúc `GET /api/partner/profile`, 2.2. Thiếu `partnerId` khi tải danh sách ưu đãi và báo cáo, 2.3. Form đăng ký gửi `website` và chuỗi rỗng gây lỗi validation, 2.4. Form tạo ưu đãi gửi sai cấu trúc Schema, 2.6. Đồng bộ vai trò thành viên, 2. CHI TIẾT CÁC SAI KHÁC ĐÃ ĐƯỢC KHẮC PHỤC, 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (+13 more)

### Community 39 - "empty-database.sql"
Cohesion: 0.09
Nodes (44): Booking_createdByStaffId_idx, Booking_source_idx, "Account", Account_provider_providerAccountId_key, "Booking", Booking_code_key, Booking_requestId_key, Booking_status_expiresAt_idx (+36 more)

### Community 40 - "coach.ts"
Cohesion: 0.22
Nodes (9): 3. DANH SÁCH FILE THAY ĐỔI & TẠO MỚI, CoachAvailabilitySlot, CoachBookingDetail, CoachBookingStatus, CoachCertificate, CoachProfile, CoachStatus, CoachVenueInfo (+1 more)

### Community 41 - "SmashBook: tìm sân, đặt lịch và theo dõi thanh toán"
Cohesion: 0.07
Nodes (29): 10. Quyết định cho prototype, 11. Giả định và câu hỏi mở, 12. Ngoài phạm vi, 1. Mục đích, 2. Bối cảnh sản phẩm hiện có, 3. Trải nghiệm đích, 4. Hành trình người dùng, 5. Đặc tả luồng (+21 more)

### Community 42 - "typescript"
Cohesion: 0.33
Nodes (5): GET(), assert, fs, { test }, ts

### Community 43 - "20261015_coach_and_partner.sql"
Cohesion: 0.14
Nodes (26): "BookingPriceLine", BookingPriceLine_bookingId_idx, "CoachAvailability", CoachAvailability_coachId_startsAt_endsAt_idx, CoachAvailability_venueId_startsAt_endsAt_idx, "CoachBooking", CoachBooking_coachId_startsAt_endsAt_idx, CoachBooking_status_expiresAt_idx (+18 more)

### Community 44 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, postinstall, start, test

### Community 45 - "voucher-backfill.test.cjs"
Cohesion: 0.38
Nodes (5): auditAndBackfillVouchers(), main(), { PrismaClient }, assert, { test }

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
Cohesion: 0.09
Nodes (22): 2. CÁC LỖI & ĐIỂM NGHIỆP VỤ ĐÃ XÁC MINH VÀ KHẮC PHỤC, Điểm 1: `src/app/coach/page.tsx` dùng nhầm `CoachVenue.id` thay cho `Venue.id` và lệch key API, Điểm 3: HLV hủy buổi đã trả tiền làm `paymentStatus` toàn đơn thành `REFUND_PENDING` (chặn check-in phần sân), Điểm 4: HLV hủy đơn nhóm đã trả một phần làm giảm tổng đơn nhưng không điều chỉnh bảng chia `GroupShare`, Điểm 5: Đồng bộ trạng thái đơn sân và HLV xuyên suốt vòng đời, Điểm 6: Đơn giá và hoa hồng snapshot bất biến, 2.1. Nguồn dữ liệu chuẩn (Single Source of Truth), 2.2. Công thức và Bất biến toàn vẹn (+14 more)

### Community 54 - "tailwindcss"
Cohesion: 0.50
Nodes (3): tailwindcss@^3.4.1, tailwindcss, config

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
Cohesion: 0.14
Nodes (12): createMockDb(), bcrypt, crypto, db, fs, main(), { PrismaClient }, { spawn, execFileSync } (+4 more)

### Community 65 - "🏸 SmashBook — Phân tích & Thiết kế Hệ thống Đặt lịch Sân Cầu lông"
Cohesion: 0.13
Nodes (14): 0. Hướng dẫn dành cho Agent (đọc trước), 10.1 Bảo mật, 10.2 Kiểm thử, 10.3 Triển khai, 10. Bảo mật, kiểm thử, triển khai, 11. Kế hoạch triển khai (Milestones cho Agent), 7.1 Quy ước, 7.2 Danh sách endpoint (+6 more)

### Community 66 - "3. KẾT QUẢ THỰC THI CÁC CÔNG CỤ XÁC MINH"
Cohesion: 0.13
Nodes (14): 1. THÔNG TIN MÔI TRƯỜNG & PHIÊN BẢN CÔNG CỤ, 2.1. Kiểm tra biến môi trường (Tuyệt đối không để lộ Secret), 2.2. Chẩn đoán mạng & Giao thức kết nối, 2.3. Báo cáo phần bị chặn đối với `scripts/test-group-integration.cjs`, 2. CHẨN ĐOÁN KẾT NỐI CƠ SỞ DỮ LIỆU & AN TOÀN DỮ LIỆU, 3.1. Prisma Schema Validation, 3.2. TypeScript Static Analysis (Strict Mode), 3.3. ESLint Verification (+6 more)

### Community 67 - "refund-ledger.test.cjs"
Cohesion: 0.29
Nodes (13): cancelCoachBookingByCoach(), approveCancellationInTransaction(), assertMoney(), completeRefund(), refundLedger(), releaseCancelledResources(), reserveRefund(), Tx (+5 more)

### Community 68 - "venue-court.service.ts"
Cohesion: 0.29
Nodes (13): POST(), assertCourtManagementAccess(), createCourt(), createCourtBlock(), CreateCourtBlockInput, CreateCourtInput, deleteCourt(), deleteCourtBlock() (+5 more)

### Community 69 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 70 - "Prisma Composer core concepts"
Cohesion: 0.15
Nodes (12): Building blocks and extensions, Builds are yours, Contracts and RPC, Databases and migrations, Declarations are data, Deploy model: converge, don't script, Failure modes quick reference, Local development (+4 more)

### Community 71 - "partner/offers/route.ts"
Cohesion: 0.19
Nodes (11): 2.5. Sai lệch cấu trúc `getMyPartnerOffers` và `getPartnerReport`, 3. DANH SÁCH FILE THAY ĐỔI, dynamic, GET(), POST(), runtime, dynamic, GET() (+3 more)

### Community 72 - "sync"
Cohesion: 0.22
Nodes (12): 1. TỔNG QUAN VẤN ĐỀ & MỤC TIÊU CỐT LÕI, 2. BẢNG MA TRẬN CHUYỂN TRẠNG THÁI NGUYÊN TỬ (STATE MACHINE), 3.1. Đồng bộ nguyên tử trong cùng Database Transaction (`sync`), 3.2. Tính Lũy Thừa (Idempotency) khi Webhook lặp hoặc Retry, 3.3. Giải quyết các cuộc đua tranh chấp (Race Conditions), 3.4. Tái cân bằng bảng chia khi HLV hủy đơn nhóm trả một phần, 3. CÁC GIẢI PHÁP KỸ THUẬT & BẢO ĐẢM TOÀN VẸN DỮ LIỆU, 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (+4 more)

### Community 73 - "5. Phân tích hướng đối tượng"
Cohesion: 0.17
Nodes (12): 5.1 Sơ đồ Use case, 5.2 Đặc tả Use case chính, 5.3 Biểu đồ lớp — Mô hình miền (Domain), 5.4 Biểu đồ lớp — Tầng dịch vụ & mẫu thiết kế, 5.5 Biểu đồ tuần tự, 5.6 Biểu đồ hoạt động — Quy trình đặt sân, 5.7 Biểu đồ trạng thái — Booking, 5. Phân tích hướng đối tượng (+4 more)

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

### Community 79 - "CourtBlock"
Cohesion: 0.25
Nodes (8): 2.1 Yêu cầu chức năng, 2.2 Yêu cầu phi chức năng, 2.3 Quy tắc nghiệp vụ (Business Rules), 2.4 Quyết định mặc định (Agent dùng khi gặp điểm mơ hồ), 2. Phân tích yêu cầu, 6.5 Chỉ mục & hiệu năng, UC13 — Khoá / mở khoá sân, CourtBlock

### Community 80 - "9. Thiết kế UI/UX"
Cohesion: 0.25
Nodes (8): 9.1 Kế hoạch thiết kế (đã đối chiếu với mặc định phổ biến), 9.2 Design tokens, 9.3 Trạng thái ô lịch — không chỉ dựa vào màu (NFR-06), 9.4 Điều hướng & sơ đồ trang, 9.5 Wireframe các màn hình chính, 9.7 Nội dung giao diện (microcopy) & trạng thái, 9.8 Truy cập, SEO, PWA, 9. Thiết kế UI/UX

### Community 81 - "bookings/page.tsx"
Cohesion: 0.39
Nodes (5): BookingsContent(), BookingsPage(), CancelBookingNoticeModal(), CancelBookingNoticeModalProps, getUserBookings()

### Community 82 - "VenueStaffModal.tsx"
Cohesion: 0.25
Nodes (4): VenueStaffData, VenueStaffMember, VenueStaffModal(), VenueStaffModalProps

### Community 83 - "load"
Cohesion: 0.29
Nodes (7): The service node is the only doorway, The service node is the only doorway, Two channels: dependencies and input, Builds are yours, Testing is an environment seam, The service node is the only doorway, load()

### Community 84 - "VenueCard.tsx"
Cohesion: 0.33
Nodes (6): 12.3 Từ vựng thuật ngữ Việt ↔ định danh code, AMENITY_MAP, AmenityMeta, VenueCardProps, Venue, slot()

### Community 85 - "8. Thuật toán lõi"
Cohesion: 0.29
Nodes (7): 8.1 Thời gian (`time.ts`), 8.3 Tính giá & giữ chỗ, 8.4 Tạo booking (`BookingService.create`), 8.5 Hết hạn giữ chỗ (xử lý lười + cron), 8.6 Xác nhận thanh toán — idempotent (`confirmPaid`), 8.7 Chính sách huỷ (`rules.ts`), 8. Thuật toán lõi

### Community 86 - "Quản trị SmashBook"
Cohesion: 0.29
Nodes (6): Chức năng, Database và triển khai, Kiểm tra, Lỗi PostgreSQL 42P05: prepared statement already exists, Quy tắc thanh toán và bảo mật, Quản trị SmashBook

### Community 87 - "20261026_venue_sessions_and_shifts.sql"
Cohesion: 0.38
Nodes (6): Booking_venueId_sessionStatus_idx, "StaffShift", StaffShift_userId_endedAt_idx, StaffShift_venueId_endedAt_idx, VenueStaff_venueId_isActive_idx, "VenueStaff"

### Community 88 - ""RefundDisbursement""
Cohesion: 0.38
Nodes (4): "RefundDisbursement", RefundDisbursement_refundId_idx, "RefundDisbursement", RefundDisbursement_refundId_idx

### Community 89 - "6. Thiết kế dữ liệu"
Cohesion: 0.33
Nodes (6): 6.1 ERD, 6.2 Prisma schema (MVP) — `prisma/schema.prisma`, 6.3 Ràng buộc chống trùng lịch (SQL thủ công — **bắt buộc**), 6.4 Mô hình Phase 2 (chưa tạo ở MVP), 6.6 Thiết kế khoá Redis, 6. Thiết kế dữ liệu

### Community 90 - "Hoàn tiền khi hủy HLV và sân — 29/10/2026"
Cohesion: 0.33
Nodes (5): Các luồng đã thống nhất, Hoàn tiền khi hủy HLV và sân — 29/10/2026, Kiểm tra, Migration và dữ liệu cũ, Quy tắc ghi sổ

### Community 91 - "CheckoutContent"
Cohesion: 0.40
Nodes (5): CheckoutContent(), applyVoucher(), submit(), validateForm(), CheckoutPage()

### Community 92 - "1. Tổng quan"
Cohesion: 0.40
Nodes (5): 1.1 Bối cảnh & mục tiêu, 1.2 Phạm vi, 1.3 Tham chiếu giao diện: phân tích nền tảng đặt sân hiện có, 1.4 Tác nhân (Actors), 1. Tổng quan

### Community 93 - "3. Công nghệ & kiến trúc"
Cohesion: 0.40
Nodes (5): 3.1 Stack (theo `tech-stack-template.md`), 3.2 Điều chỉnh & bổ sung so với template (**quan trọng**), 3.3 Kiến trúc tổng thể, 3.4 Cấu trúc thư mục, 3. Công nghệ & kiến trúc

### Community 94 - "4. Phân tích hướng chức năng"
Cohesion: 0.40
Nodes (5): 4.1 Sơ đồ phân rã chức năng (BFD), 4.2 DFD mức 0 (sơ đồ ngữ cảnh), 4.3 DFD mức 1, 4.4 DFD mức 2 — Tiến trình P3 "Đặt sân", 4. Phân tích hướng chức năng

### Community 95 - "Booking and checkout verification — 2026-10-06"
Cohesion: 0.40
Nodes (4): Booking and checkout verification — 2026-10-06, Changes and verification, Original deployment, Remaining limitations

### Community 96 - "12. Phụ lục"
Cohesion: 0.50
Nodes (4): 12.1 Biến môi trường (`.env.example`), 12.2 Dữ liệu seed (toàn bộ **giả**), 12.4 Hình vẽ vạch sân cho hero (`CourtLinesHero`), 12. Phụ lục

### Community 97 - "6. HƯỚNG DẪN TRIỂN KHAI, DI CHUYỂN DỮ LIỆU VÀ ROLLBACK"
Cohesion: 0.50
Nodes (4): 6.1. Triển khai Migration Cơ sở dữ liệu (PostgreSQL), 6.2. Đối soát dữ liệu cũ và Kế hoạch Backfill, 6.3. Kế hoạch Rollback (Khai trừ rủi ro), 6. HƯỚNG DẪN TRIỂN KHAI, DI CHUYỂN DỮ LIỆU VÀ ROLLBACK

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

## Knowledge Gaps
- **1 isolated node(s):** `next/core-web-vitals`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 785 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `react` to `serializable`, `coach.service.ts`, `auth.service.ts`, `lucide-react`, `utils.ts`, `venue.service.ts`, `partner.service.ts`, `lib/booking.ts`, `requirePaymentUser`, `formatVND`, `venue-map.test.cjs`, `venue-operations/page.tsx`, `AdminDashboard.tsx`, `readPaymentBody`, `sepay.ts`, `PaymentError`, `dependencies`, `paymentErrorResponse`, `package.json`, `partner/offers/route.ts`, `bookings/page.tsx`, `VenueCard.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `serializable` be split into smaller, more focused modules?**
  _Cohesion score 0.13424947145877378 - nodes in this community are weakly interconnected._
- **Why does `PaymentError` connect `PaymentError` to `serializable`, `coach.service.ts`, `partner.service.ts`, `lib/booking.ts`, `requirePaymentUser`, `AdminDashboard.tsx`, `readPaymentBody`, `sepay.ts`, `sepay.service.ts`, `group-payment.service.ts`, `test-group-integration.cjs`, `auditOfferLedger`, `paymentErrorResponse`, `OfferUsage`, `sepay.ts`, `group-payment.ts`, `createReservation`, `refund-ledger.test.cjs`, `venue-court.service.ts`, `partner/offers/route.ts`, `sync`, `load`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `app` be split into smaller, more focused modules?**
  _Cohesion score 0.05668016194331984 - nodes in this community are weakly interconnected._
- **Why does `load()` connect `load` to `sepay.ts`, `Prisma Composer core concepts`, `Prisma Composer core concepts`, `Prisma Composer core concepts`, `Prisma Composer core concepts`, `PaymentError`, `group-payment.service.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `coach.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0726950354609929 - nodes in this community are weakly interconnected._