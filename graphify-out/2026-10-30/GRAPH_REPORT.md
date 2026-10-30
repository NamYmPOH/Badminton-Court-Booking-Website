# Graph Report - Badminton Court Booking Website  (2026-10-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1141 nodes · 3041 edges · 65 communities (54 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
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
- ref_node_fs
- sepay.test.cjs
- next
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
- reservation.service.ts
- PaymentError
- group-payment.service.ts
- generate-venues-data.cjs
- dependencies
- devDependencies
- test-group-integration.cjs
- compilerOptions
- ref_node_assert
- paymentErrorResponse
- bookings/page.tsx
- partner-service.test.cjs
- [token]/route.ts
- package.json
- constants.ts
- group-payment.ts
- settlement.service.ts
- partner.ts
- venues/route.ts
- coach.ts
- coach-reservation.test.cjs
- typescript
- certificates/route.ts
- scripts
- voucher-backfill.test.cjs
- [slug]/page.tsx
- env.ts
- admin.test.cjs
- hmac.pre-request.js
- business-verification.test.cjs
- check-db-local.cjs
- api/offers/route.ts
- settlement.ts
- tailwindcss
- .eslintrc.json
- prisma
- next.config.mjs
- date-fns@^4.4.0
- next-auth@^5.0.0-beta.20
- qrcode
- @radix-ui/react-popover@^1.1.23
- react-dom@^18
- zustand@^5.0.15
- postcss.config.mjs

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
- `cancelCoach()` --calls--> `cancelCoachBookingByCoach()`  [EXTRACTED]
  tests/refund-ledger.test.cjs → src/services/coach.service.ts
- `pay()` --calls--> `recordManualRefund()`  [EXTRACTED]
  tests/refund-ledger.test.cjs → src/services/venue-session.service.ts
- `main()` --calls--> `performAdminAction()`  [EXTRACTED]
  scripts/test-group-integration.cjs → src/services/admin.service.ts
- `view()` --calls--> `getGroupView()`  [EXTRACTED]
  scripts/test-group-integration.cjs → src/services/group-payment.service.ts
- `action()` --calls--> `groupAction()`  [EXTRACTED]
  scripts/test-group-integration.cjs → src/services/group-payment.service.ts

## Import Cycles
- None detected.

## Communities (65 total, 11 thin omitted)

### Community 0 - "serializable"
Cohesion: 0.07
Nodes (73): @prisma/client@^5.18.0, @prisma/client, dynamic, GET(), POST(), courtActionSchema, dynamic, GET() (+65 more)

### Community 1 - "app"
Cohesion: 0.06
Nodes (38): build, depends_on, environment, ports, profiles, volumes, context, dockerfile (+30 more)

### Community 2 - "coach.service.ts"
Cohesion: 0.09
Nodes (34): dynamic, GET(), POST(), runtime, dynamic, GET(), runtime, assertCoachActive() (+26 more)

### Community 3 - "payment.test.js"
Cohesion: 0.09
Nodes (26): dependencies, express@^5.1.0, engines, node, name, private, scripts, dev (+18 more)

### Community 4 - "auth.service.ts"
Cohesion: 0.12
Nodes (27): loginSchema, POST(), POST(), GET(), POST(), registerSchema, AuthContextType, AUTH_COOKIE (+19 more)

### Community 5 - "ref_node_fs"
Cohesion: 0.09
Nodes (22): assert, fs, assert, fs, { test }, ts, actors, fixture() (+14 more)

### Community 6 - "sepay.test.cjs"
Cohesion: 0.09
Nodes (24): dynamic, POST(), runtime, bookingRequestSchema, extractGroupCode(), buildVietQrPayload(), crc16Ccitt(), eventFingerprint() (+16 more)

### Community 7 - "next"
Cohesion: 0.12
Nodes (20): lucide-react, next, NotificationItem, OffersPage(), PublicOffer, AMENITY_MAP, AmenityMeta, VenueCardProps (+12 more)

### Community 8 - "utils.ts"
Cohesion: 0.12
Nodes (19): next-themes, beVietnamPro, metadata, RootLayout(), viewport, MobileTabBar(), Tab, Navbar() (+11 more)

### Community 9 - "serve-group-trial.cjs"
Cohesion: 0.07
Nodes (21): booking, child, http, server, { spawn }, bcrypt, crypto, db (+13 more)

### Community 10 - "react"
Cohesion: 0.13
Nodes (20): react, sonner, AccountPage(), CoachAvailabilityItem, CoachBookingItem, CoachPortalPage(), CoachProfile, CoachVenueItem (+12 more)

### Community 11 - "venue.service.ts"
Cohesion: 0.12
Nodes (22): dynamic, GET(), searchSchema, dynamic, HomePage(), VenuesPage(), VenuesPageProps, HeroSearch() (+14 more)

### Community 12 - "partner.service.ts"
Cohesion: 0.12
Nodes (25): dynamic, runtime, assertPartnerActive(), assertPartnerMemberRole(), calculateOfferDiscount(), MAX_PARTNER_BUDGET, MIN_PARTNER_BUDGET, PartnerMemberInput (+17 more)

### Community 13 - "lib/booking.ts"
Cohesion: 0.15
Nodes (22): BookPageProps, CourtBookingGridPage(), PendingSwitch, CourtSwitchConfirmModal(), CourtSwitchConfirmModalProps, bookingDates(), isDemoBooked(), isPastSlot() (+14 more)

### Community 14 - "requirePaymentUser"
Cohesion: 0.15
Nodes (21): cancelSchema, dynamic, POST(), runtime, dynamic, GET(), POST(), runtime (+13 more)

### Community 15 - "formatVND"
Cohesion: 0.12
Nodes (17): CheckoutContent(), applyVoucher(), CheckoutPage(), CoachItem, Group, GroupPaymentPage(), PaymentBooking, PaymentResultContent() (+9 more)

### Community 16 - "venue-map.test.cjs"
Cohesion: 0.11
Nodes (23): leaflet@^1.9.4, leaflet, array(), fs, path, quote(), sql, statements (+15 more)

### Community 17 - "venue-operations/page.tsx"
Cohesion: 0.09
Nodes (19): @radix-ui/react-dialog, CourtInfo, Order, StaffMember, VenueMeta, CounterBookingModal(), handleSubmit(), timeToMin() (+11 more)

### Community 18 - "AdminDashboard.tsx"
Cohesion: 0.10
Nodes (19): AdminPage(), dynamic, metadata, submit(), validateForm(), Action, AdminDashboard(), Badge() (+11 more)

### Community 19 - "readPaymentBody"
Cohesion: 0.14
Nodes (23): dynamic, GET(), POST(), querySchema, reviewBodySchema, runtime, dynamic, GET() (+15 more)

### Community 20 - "sepay.ts"
Cohesion: 0.11
Nodes (19): zod, dynamic, GET(), querySchema, runtime, cancelBodySchema, dynamic, POST() (+11 more)

### Community 21 - "reservation.service.ts"
Cohesion: 0.17
Nodes (18): dynamic, GET(), PATCH(), runtime, canPayBooking(), PaymentBooking, createVietQrUrl(), getSepayConfig() (+10 more)

### Community 22 - "PaymentError"
Cohesion: 0.17
Nodes (19): DELETE(), dynamic, GET(), POST(), runtime, dynamic, GET(), PATCH() (+11 more)

### Community 23 - "group-payment.service.ts"
Cohesion: 0.21
Nodes (21): groupTotals(), slotTime(), operatorVenueScope(), activeUser(), assertLive(), audit(), Bank, closeGroup() (+13 more)

### Community 24 - "generate-venues-data.cjs"
Cohesion: 0.10
Nodes (16): fs, outputDir, path, PERSPECTIVES, THEMES, allVenuesList, AMENITY_SETS, dataDir (+8 more)

### Community 25 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, ioredis@^6.0.0, lucide-react@^1.49.0, next@14.2.6, next-themes@^0.4.6, @radix-ui/react-dialog@^1.1.23 (+12 more)

### Community 26 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, eslint@^8, eslint-config-next@14.2.6, postcss@^8, @types/bcryptjs@^2.4.6, @types/leaflet@^1.9.22, @types/node@^20, @types/qrcode@1.5.5 (+12 more)

### Community 27 - "test-group-integration.cjs"
Cohesion: 0.18
Nodes (18): action(), assert, check(), config, crypto, db, fixture(), fs (+10 more)

### Community 28 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+10 more)

### Community 29 - "ref_node_assert"
Cohesion: 0.13
Nodes (13): auditOfferLedger(), assert, fs, { test }, ts, assert, fs, { test } (+5 more)

### Community 30 - "paymentErrorResponse"
Cohesion: 0.15
Nodes (14): dynamic, GET(), dynamic, GET(), runtime, dynamic, GET(), runtime (+6 more)

### Community 31 - "bookings/page.tsx"
Cohesion: 0.18
Nodes (11): BookingsContent(), BookingsPage(), CancelBookingNoticeModal(), CancelBookingNoticeModalProps, getUserBookings(), MOCK_BOOKINGS, Booking, BookingItem (+3 more)

### Community 32 - "partner-service.test.cjs"
Cohesion: 0.15
Nodes (14): dynamic, GET(), runtime, partnerProfileInputSchema, getMyPartners(), getPartnerReport(), registerPartner(), assert (+6 more)

### Community 33 - "[token]/route.ts"
Cohesion: 0.21
Nodes (12): dynamic, POST(), runtime, Context, dynamic, GET(), headers, POST() (+4 more)

### Community 34 - "package.json"
Cohesion: 0.14
Nodes (13): @auth/prisma-adapter@^2.11.3, bcryptjs@^3.0.3, @radix-ui/react-tabs@^1.1.21, tailwind-merge@^3.7.0, @vercel/analytics@^2.0.1, name, private, version (+5 more)

### Community 35 - "constants.ts"
Cohesion: 0.14
Nodes (13): AMENITIES, Amenity, AMENITY_LABELS, BCRYPT_COST, DEFAULT_CANCEL_BEFORE_HOURS, DEFAULT_SLOT_MINUTES, HOLD_TTL_SECONDS, MAX_ADVANCE_DAYS (+5 more)

### Community 36 - "group-payment.ts"
Cohesion: 0.21
Nodes (10): GroupAction, groupActionSchema, ids, reason, ticketValue(), validTicket(), assert, fs (+2 more)

### Community 37 - "settlement.service.ts"
Cohesion: 0.27
Nodes (10): asSafeTx(), completeBookingSettlement(), CompleteBookingSettlementParams, inMemoryVoucherRecordings, recordSingleVoucherUsage(), recordVoucherConsumption(), SafeTx, SettlementMockClient (+2 more)

### Community 38 - "partner.ts"
Cohesion: 0.18
Nodes (10): OfferSponsor, OfferStatus, OfferUsage, OfferUsageState, Partner, PartnerMember, PartnerMemberRole, PartnerOffer (+2 more)

### Community 39 - "venues/route.ts"
Cohesion: 0.28
Nodes (8): dynamic, PATCH(), POST(), registerVenueSchema, runtime, coachVenueApprovalSchema, registerCoachVenue(), reviewCoachVenue()

### Community 40 - "coach.ts"
Cohesion: 0.22
Nodes (8): CoachAvailabilitySlot, CoachBookingDetail, CoachBookingStatus, CoachCertificate, CoachProfile, CoachStatus, CoachVenueInfo, CoachVenueStatus

### Community 41 - "coach-reservation.test.cjs"
Cohesion: 0.22
Nodes (8): activeCoach, assert, baseVenue, date, fs, future, { test }, ts

### Community 42 - "typescript"
Cohesion: 0.29
Nodes (6): typescript, GET(), assert, fs, { test }, ts

### Community 43 - "certificates/route.ts"
Cohesion: 0.32
Nodes (7): DELETE(), dynamic, POST(), runtime, coachCertificateInputSchema, addCoachCertificate(), deleteCoachCertificate()

### Community 44 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, postinstall, start, test

### Community 45 - "voucher-backfill.test.cjs"
Cohesion: 0.38
Nodes (5): auditAndBackfillVouchers(), main(), { PrismaClient }, assert, { test }

### Community 46 - "[slug]/page.tsx"
Cohesion: 0.38
Nodes (5): dynamic, VenueDetailPage(), VenueDetailPageProps, VenueDetailActions(), VenueDetailActionsProps

### Community 47 - "env.ts"
Cohesion: 0.29
Nodes (4): ClientEnv, clientSchema, ServerEnv, serverSchema

### Community 48 - "admin.test.cjs"
Cohesion: 0.29
Nodes (4): assert, fs, { test }, ts

### Community 49 - "hmac.pre-request.js"
Cohesion: 0.33
Nodes (5): encoder, hex, rawBody, secret, timestamp

### Community 50 - "business-verification.test.cjs"
Cohesion: 0.33
Nodes (5): createReservation(), assert, fs, { test }, ts

### Community 52 - "api/offers/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, GET(), runtime, getPublicOffers()

### Community 53 - "settlement.ts"
Cohesion: 0.40
Nodes (4): BookingPriceLine, CoachSettlementSummary, PriceLineType, SettlementStatus

### Community 54 - "tailwindcss"
Cohesion: 0.50
Nodes (3): tailwindcss@^3.4.1, tailwindcss, config

## Knowledge Gaps
- **1 isolated node(s):** `next/core-web-vitals`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 507 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `serializable`, `coach.service.ts`, `auth.service.ts`, `utils.ts`, `react`, `venue.service.ts`, `partner.service.ts`, `lib/booking.ts`, `requirePaymentUser`, `formatVND`, `venue-operations/page.tsx`, `AdminDashboard.tsx`, `readPaymentBody`, `sepay.ts`, `PaymentError`, `dependencies`, `paymentErrorResponse`, `bookings/page.tsx`, `partner-service.test.cjs`, `package.json`, `venues/route.ts`, `certificates/route.ts`, `[slug]/page.tsx`, `api/offers/route.ts`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `serializable` be split into smaller, more focused modules?**
  _Cohesion score 0.06575781876503609 - nodes in this community are weakly interconnected._
- **Why does `PaymentError` connect `PaymentError` to `serializable`, `coach.service.ts`, `sepay.test.cjs`, `partner.service.ts`, `lib/booking.ts`, `requirePaymentUser`, `AdminDashboard.tsx`, `readPaymentBody`, `sepay.ts`, `reservation.service.ts`, `group-payment.service.ts`, `test-group-integration.cjs`, `ref_node_assert`, `paymentErrorResponse`, `partner-service.test.cjs`, `[token]/route.ts`, `group-payment.ts`, `venues/route.ts`, `certificates/route.ts`, `business-verification.test.cjs`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `app` be split into smaller, more focused modules?**
  _Cohesion score 0.05668016194331984 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `typescript` to `partner-service.test.cjs`, `serializable`, `package.json`, `coach.service.ts`, `group-payment.ts`, `ref_node_fs`, `sepay.test.cjs`, `serve-group-trial.cjs`, `coach-reservation.test.cjs`, `partner.service.ts`, `lib/booking.ts`, `venue-map.test.cjs`, `admin.test.cjs`, `business-verification.test.cjs`, `reservation.service.ts`, `devDependencies`, `test-group-integration.cjs`, `ref_node_assert`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `coach.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._