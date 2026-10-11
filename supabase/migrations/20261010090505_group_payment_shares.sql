-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_PAID';

-- CreateTable
CREATE TABLE "BookingGroup" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupShare" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "userId" TEXT,
    "cashRequested" BOOLEAN NOT NULL DEFAULT false,
    "cashApprovedAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "currentIntentId" TEXT,
    "ticketNonce" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,

    CONSTRAINT "GroupShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPaymentIntent" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "shareIds" TEXT[],
    "bank" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRefund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingGroup_bookingId_key" ON "BookingGroup"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingGroup_inviteToken_key" ON "BookingGroup"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "GroupShare_ticketNonce_key" ON "GroupShare"("ticketNonce");

-- CreateIndex
CREATE INDEX "GroupShare_userId_idx" ON "GroupShare"("userId");

-- CreateIndex
CREATE INDEX "GroupShare_paymentId_idx" ON "GroupShare"("paymentId");

-- CreateIndex
CREATE INDEX "GroupShare_currentIntentId_idx" ON "GroupShare"("currentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupShare_groupId_position_key" ON "GroupShare"("groupId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "GroupShare_groupId_userId_key" ON "GroupShare"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPaymentIntent_code_key" ON "GroupPaymentIntent"("code");

-- CreateIndex
CREATE INDEX "GroupPaymentIntent_groupId_status_idx" ON "GroupPaymentIntent"("groupId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GroupRefund_paymentId_key" ON "GroupRefund"("paymentId");

-- CreateIndex
CREATE INDEX "GroupRefund_status_createdAt_idx" ON "GroupRefund"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "BookingGroup" ADD CONSTRAINT "BookingGroup_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BookingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_currentIntentId_fkey" FOREIGN KEY ("currentIntentId") REFERENCES "GroupPaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentIntent" ADD CONSTRAINT "GroupPaymentIntent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BookingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRefund" ADD CONSTRAINT "GroupRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- These tables are server-only (custom application auth, not Supabase JWT auth).
ALTER TABLE "BookingGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupPaymentIntent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GroupRefund" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "BookingGroup", "GroupShare", "GroupPaymentIntent", "GroupRefund" FROM anon, authenticated;
ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_positive_amount" CHECK (amount > 0);
ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_position_range" CHECK (position BETWEEN 1 AND 30);
ALTER TABLE "GroupPaymentIntent" ADD CONSTRAINT "GroupPaymentIntent_positive_amount" CHECK (amount > 0);
ALTER TABLE "GroupPaymentIntent" ADD CONSTRAINT "GroupPaymentIntent_valid_status" CHECK (status IN ('OPEN','PAID','SUPERSEDED','CLOSED'));
ALTER TABLE "GroupPaymentIntent" ADD CONSTRAINT "GroupPaymentIntent_valid_targets" CHECK (cardinality("shareIds") BETWEEN 1 AND 30);
ALTER TABLE "GroupRefund" ADD CONSTRAINT "GroupRefund_positive_amount" CHECK (amount > 0);
ALTER TABLE "GroupRefund" ADD CONSTRAINT "GroupRefund_valid_status" CHECK (status IN ('PENDING','COMPLETED'));
