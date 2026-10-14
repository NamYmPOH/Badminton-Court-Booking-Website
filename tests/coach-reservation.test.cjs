const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const { test } = require("node:test");

require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );

const { createReservation, publicBooking } = require("../src/services/reservation.service.ts");
const { cancelCoachBookingByCoach } = require("../src/services/coach.service.ts");

const future = new Date(Date.now() + 86400000);
const date = future.toISOString().slice(0, 10);

const baseVenue = {
  id: "venue-1",
  ownerId: "owner-1",
  status: "ACTIVE",
  openMin: 300,
  closeMin: 1320,
  advanceDays: 30,
  minBookingMin: 60,
  maxBookingMin: 240,
  courts: [{ id: "c1", name: "Sân 1", status: "ACTIVE" }],
  pricing: [
    {
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startMin: 300,
      endMin: 1320,
      walkInPrice: 150000,
    },
  ],
};

const activeCoach = {
  id: "coach-1",
  hourlyRate: 200000,
  status: "ACTIVE",
  user: { name: "HLV Minh Đức" },
};

test("createReservation with coachId calculates combined price, 5-min hold, and price lines", async () => {
  let createdBookingData = null;
  const mockDb = {
    $transaction: async (work) =>
      work({
        booking: {
          findUnique: async () => null,
          count: async () => 0,
          create: async ({ data }) => {
            createdBookingData = data;
            return {
              id: "b-1",
              code: "DATSAN1234567890",
              ...data,
              items: data.items.create.map((item, idx) => ({
                id: `item-${idx}`,
                courtId: item.courtId,
                date: new Date(`${date}T00:00:00Z`),
                startMin: item.startMin,
                endMin: item.endMin,
                price: item.price,
                status: item.status,
                court: { name: "Sân 1" },
                coachBooking: item.coachBooking ? {
                  id: "cb-1",
                  coachId: item.coachBooking.create.coachId,
                  fee: item.coachBooking.create.fee,
                  hourlyRateSnapshot: item.coachBooking.create.hourlyRateSnapshot,
                  status: item.coachBooking.create.status,
                  coach: { user: { name: "HLV Minh Đức", image: null, phone: "0912345678" } },
                } : null,
              })),
              priceLines: data.priceLines.create.map((pl, idx) => ({
                id: `pl-${idx}`,
                ...pl,
              })),
              venue: { name: "Sân Cầu Lông Hà Nội", address: "123 Cầu Giấy", slug: "san-ha-noi" },
            };
          },
        },
        venue: { findUnique: async () => baseVenue },
        courtBlock: { findFirst: async () => null },
        bookingItem: { findFirst: async () => null },
        coachProfile: { findFirst: async () => activeCoach },
        coachVenue: { findUnique: async () => ({ id: "cv-1", status: "ACTIVE" }) },
        coachAvailability: { findFirst: async () => ({ id: "avail-1" }) },
        coachBooking: { findFirst: async () => null },
      }),
  };

  const input = {
    requestId: "123e4567-e89b-12d3-a456-426614174000",
    venueId: "venue-1",
    coachId: "coach-1",
    date,
    customerName: "Nguyễn Văn Khách",
    customerPhone: "0912345678",
    slots: [
      { courtId: "c1", startMin: 600, endMin: 630 },
      { courtId: "c1", startMin: 630, endMin: 660 },
    ], // 60 mins -> court: 150.000đ, coach: 200.000đ
  };

  const booking = await createReservation(mockDb, "user-cust", input);

  // 1. Total = 150k (court) + 200k (coach) = 350.000đ
  assert.equal(booking.subtotal, 350000);
  assert.equal(booking.total, 350000);

  // 2. Hold time is 5 minutes (300,000ms)
  const now = Date.now();
  assert.ok(createdBookingData.expiresAt.getTime() <= now + 300000 + 2000);
  assert.ok(createdBookingData.expiresAt.getTime() >= now + 290000);

  // 3. Price lines bóc tách COURT và COACH
  const priceLines = createdBookingData.priceLines.create;
  assert.equal(priceLines.length, 2);
  assert.equal(priceLines[0].type, "COURT");
  assert.equal(priceLines[0].amount, 150000);
  assert.equal(priceLines[1].type, "COACH");
  assert.equal(priceLines[1].amount, 200000);

  // 4. CoachBooking linked
  const coachBookingCreate = createdBookingData.items.create[0].coachBooking.create;
  assert.equal(coachBookingCreate.coachId, "coach-1");
  assert.equal(coachBookingCreate.fee, 200000);
  assert.equal(coachBookingCreate.status, "HELD");

  // 5. publicBooking format
  const pub = publicBooking(booking);
  assert.equal(pub.total, 350000);
  assert.equal(pub.coach.coachName, "HLV Minh Đức");
  assert.equal(pub.coach.fee, 200000);
  assert.equal(pub.priceLines.length, 2);
});

test("createReservation rejects coach conflict across venues (double-booking prevention)", async () => {
  const mockDbConflict = {
    $transaction: async (work) =>
      work({
        booking: { findUnique: async () => null, count: async () => 0 },
        venue: { findUnique: async () => baseVenue },
        courtBlock: { findFirst: async () => null },
        bookingItem: { findFirst: async () => null },
        coachProfile: { findFirst: async () => activeCoach },
        coachVenue: { findUnique: async () => ({ status: "ACTIVE" }) },
        coachAvailability: { findFirst: async () => ({ id: "avail-1" }) },
        coachBooking: {
          // Coach already booked at another venue!
          findFirst: async () => ({ id: "cb-conflict", status: "CONFIRMED" }),
        },
      }),
  };

  const input = {
    requestId: "123e4567-e89b-12d3-a456-426614174001",
    venueId: "venue-1",
    coachId: "coach-1",
    date,
    customerName: "Khách B",
    customerPhone: "0912345678",
    slots: [
      { courtId: "c1", startMin: 600, endMin: 630 },
      { courtId: "c1", startMin: 630, endMin: 660 },
    ],
  };

  await assert.rejects(
    createReservation(mockDbConflict, "user-cust", input),
    (e) => e.status === 409 && e.message.includes("lịch dạy vào khung giờ này")
  );
});

test("cancelCoachBookingByCoach refunds 100% coach fee to customer and notifies", async () => {
  let createdPriceLine = null;
  let createdNotification = null;
  let updatedBooking = null;

  const coachBookingPaid = {
    id: "cb-paid",
    coachId: "coach-1",
    fee: 200000,
    status: "CONFIRMED",
    bookingItem: {
      booking: {
        id: "b-paid",
        code: "DATSAN9999",
        userId: "cust-1",
        total: 350000,
        subtotal: 350000,
        paymentStatus: "PAID",
      },
    },
  };

  const mockDb = {
    $transaction: async (work) =>
      work({
        coachProfile: { findUnique: async () => ({ id: "coach-1", userId: "coach-user" }) },
        coachBooking: {
          findUnique: async () => coachBookingPaid,
          update: async ({ data }) => Object.assign(coachBookingPaid, data),
        },
        booking: {
          update: async ({ data }) => {
            updatedBooking = data;
            return data;
          },
        },
        bookingPriceLine: {
          create: async ({ data }) => {
            createdPriceLine = data;
            return data;
          },
          deleteMany: async () => {},
        },
        notification: {
          create: async ({ data }) => {
            createdNotification = data;
            return data;
          },
        },
      }),
  };

  const result = await cancelCoachBookingByCoach(
    mockDb,
    "coach-user",
    "cb-paid",
    "Huấn luyện viên bị sốt đột xuất"
  );

  // 1. Result acknowledges 100% refunded fee
  assert.equal(result.success, true);
  assert.equal(result.refundedFee, 200000);

  // 2. CoachBooking marked CANCELLED
  assert.equal(coachBookingPaid.status, "CANCELLED");
  assert.equal(coachBookingPaid.cancelReason, "Huấn luyện viên bị sốt đột xuất");

  // 3. 100% discount price line created for refund
  assert.equal(createdPriceLine.type, "DISCOUNT");
  assert.equal(createdPriceLine.amount, 200000);
  assert.ok(createdPriceLine.label.includes("Hoàn 100% phí HLV"));

  // 4. Customer notified
  assert.equal(createdNotification.userId, "cust-1");
  assert.ok(createdNotification.body.includes("100% phí HLV"));
});
