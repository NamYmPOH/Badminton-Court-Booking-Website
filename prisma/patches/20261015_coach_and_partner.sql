-- SmashBook: Migration Patch cho Huấn luyện viên (Coach) và Đối tác (Partner)
-- Ngày: 14/10/2026
-- An toàn, tương thích ngược 100% với các đơn hàng và dữ liệu hiện hữu.

BEGIN;

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "CoachStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CoachVenueStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CoachBookingStatus" AS ENUM ('HELD', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerMemberRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferSponsor" AS ENUM ('PARTNER', 'VENUE', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferUsageState" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PriceLineType" AS ENUM ('COURT', 'COACH', 'DISCOUNT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Coach Tables
CREATE TABLE IF NOT EXISTS "CoachProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "bio" TEXT,
  "specialties" TEXT[] NOT NULL DEFAULT '{}',
  "experienceYears" INTEGER NOT NULL DEFAULT 0,
  "hourlyRate" INTEGER NOT NULL,
  "status" "CoachStatus" NOT NULL DEFAULT 'PENDING',
  "reviewReason" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CoachProfile_status_hourlyRate_idx" ON "CoachProfile"("status", "hourlyRate");

CREATE TABLE IF NOT EXISTS "CoachCertificate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "coachId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "verifiedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachCertificate_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CoachCertificate_coachId_idx" ON "CoachCertificate"("coachId");

CREATE TABLE IF NOT EXISTS "CoachVenue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "coachId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "status" "CoachVenueStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachVenue_coachId_venueId_key" UNIQUE ("coachId", "venueId"),
  CONSTRAINT "CoachVenue_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CoachVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CoachVenue_venueId_status_idx" ON "CoachVenue"("venueId", "status");

CREATE TABLE IF NOT EXISTS "CoachAvailability" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "coachId" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachAvailability_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CoachAvailability_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CoachAvailability_coachId_startsAt_endsAt_idx" ON "CoachAvailability"("coachId", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "CoachAvailability_venueId_startsAt_endsAt_idx" ON "CoachAvailability"("venueId", "startsAt", "endsAt");

CREATE TABLE IF NOT EXISTS "CoachBooking" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "coachId" TEXT NOT NULL,
  "bookingItemId" TEXT NOT NULL UNIQUE,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "fee" INTEGER NOT NULL,
  "hourlyRateSnapshot" INTEGER NOT NULL,
  "commissionRateSnapshot" DOUBLE PRECISION NOT NULL,
  "commissionAmount" INTEGER NOT NULL,
  "status" "CoachBookingStatus" NOT NULL DEFAULT 'HELD',
  "expiresAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachBooking_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CoachBooking_bookingItemId_fkey" FOREIGN KEY ("bookingItemId") REFERENCES "BookingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CoachBooking_coachId_startsAt_endsAt_idx" ON "CoachBooking"("coachId", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "CoachBooking_status_expiresAt_idx" ON "CoachBooking"("status", "expiresAt");

-- 3. Partner Tables
CREATE TABLE IF NOT EXISTS "Partner" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "logoUrl" TEXT,
  "description" TEXT,
  "contactPhone" TEXT,
  "contactEmail" TEXT,
  "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Partner_status_idx" ON "Partner"("status");

CREATE TABLE IF NOT EXISTS "PartnerMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "partnerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "PartnerMemberRole" NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerMember_partnerId_userId_key" UNIQUE ("partnerId", "userId"),
  CONSTRAINT "PartnerMember_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PartnerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PartnerMember_userId_idx" ON "PartnerMember"("userId");

CREATE TABLE IF NOT EXISTS "PartnerOffer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "partnerId" TEXT NOT NULL,
  "voucherId" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sponsor" "OfferSponsor" NOT NULL DEFAULT 'PARTNER',
  "budget" INTEGER NOT NULL,
  "usedBudget" INTEGER NOT NULL DEFAULT 0,
  "maxUsage" INTEGER,
  "currentUsage" INTEGER NOT NULL DEFAULT 0,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "termsSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerOffer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PartnerOffer_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PartnerOffer_partnerId_status_idx" ON "PartnerOffer"("partnerId", "status");

CREATE TABLE IF NOT EXISTS "OfferUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "offerId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "discountAmount" INTEGER NOT NULL,
  "state" "OfferUsageState" NOT NULL DEFAULT 'RESERVED',
  "expiresAt" TIMESTAMP(3),
  "termsSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfferUsage_offerId_bookingId_key" UNIQUE ("offerId", "bookingId"),
  CONSTRAINT "OfferUsage_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "PartnerOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfferUsage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "OfferUsage_userId_idx" ON "OfferUsage"("userId");
CREATE INDEX IF NOT EXISTS "OfferUsage_state_expiresAt_idx" ON "OfferUsage"("state", "expiresAt");

-- 4. Financial & Settlement Tables
CREATE TABLE IF NOT EXISTS "BookingPriceLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "type" "PriceLineType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "beneficiaryId" TEXT,
  "pricingSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingPriceLine_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BookingPriceLine_bookingId_idx" ON "BookingPriceLine"("bookingId");

CREATE TABLE IF NOT EXISTS "CoachSettlement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "coachId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "grossCollected" INTEGER NOT NULL,
  "refunds" INTEGER NOT NULL DEFAULT 0,
  "commission" INTEGER NOT NULL,
  "netAmount" INTEGER NOT NULL,
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT,
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachSettlement_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CoachSettlement_coachId_status_idx" ON "CoachSettlement"("coachId", "status");
CREATE INDEX IF NOT EXISTS "CoachSettlement_periodStart_periodEnd_idx" ON "CoachSettlement"("periodStart", "periodEnd");

COMMIT;
