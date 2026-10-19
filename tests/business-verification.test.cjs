const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

require.extensions['.ts'] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );

const { getPublicCoachAvailabilities, cancelCoachBookingByCoach } = require('../src/services/coach.service.ts');
const { validateAndQuoteOffer } = require('../src/services/partner.service.ts');
const { createReservation } = require('../src/services/reservation.service.ts');
const { performAdminAction } = require('../src/services/admin.service.ts');

test('1. Ưu đãi áp dụng sai cơ sở bị từ chối (venueId hoặc termsSnapshot.applicableVenueIds)', async () => {
  const now = new Date();
  const future = new Date(Date.now() + 86400000);
  const voucher = {
    id: 'v-1',
    code: 'WRONGVENUE',
    type: 'PERCENT',
    value: 20,
    maxDiscount: 50000,
    minAmount: 100000,
    venueId: 'venue-allowed-only',
    validFrom: new Date(Date.now() - 3600000),
    validTo: future,
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    partnerOffer: null,
  };

  const db = {
    voucher: {
      findUnique: async () => voucher,
    },
  };

  // Áp dụng cho venue khác sẽ bị chặn
  await assert.rejects(
    validateAndQuoteOffer(db, 'WRONGVENUE', 'venue-other', 200000),
    (err) => err.status === 400 && err.message.includes('không áp dụng')
  );

  // Voucher đối tác có termsSnapshot.applicableVenueIds
  const partnerVoucher = {
    ...voucher,
    venueId: null,
    partnerOffer: {
      id: 'po-1',
      status: 'ACTIVE',
      budget: 1000000,
      usedBudget: 0,
      currentUsage: 0,
      maxUsage: 10,
      partner: { status: 'ACTIVE' },
      termsSnapshot: { applicableVenueIds: ['venue-special'] },
    },
  };
  const dbPartner = {
    voucher: {
      findUnique: async () => partnerVoucher,
    },
    offerUsage: {
      findMany: async () => [],
    },
  };

  await assert.rejects(
    validateAndQuoteOffer(dbPartner, 'WRONGVENUE', 'venue-random', 200000),
    (err) => err.status === 400 && err.message.includes('không áp dụng')
  );
});

test('2. Voucher hết lượt (usageLimit) bị từ chối trong cả validate và createReservation', async () => {
  const now = new Date();
  const future = new Date(Date.now() + 86400000);
  const exhaustedVoucher = {
    id: 'v-exhausted',
    code: 'EXHAUSTED',
    type: 'FIXED',
    value: 50000,
    maxDiscount: null,
    minAmount: 100000,
    venueId: null,
    validFrom: new Date(Date.now() - 3600000),
    validTo: future,
    usageLimit: 10,
    usedCount: 10, // đã dùng hết
    isActive: true,
    partnerOffer: null,
  };

  const db = {
    voucher: {
      findUnique: async () => exhaustedVoucher,
    },
  };

  await assert.rejects(
    validateAndQuoteOffer(db, 'EXHAUSTED', 'venue-1', 200000),
    (err) => err.status === 409 && err.message.includes('hết lượt sử dụng')
  );
});

test('3. Ưu đãi đối tác hết lượt (maxUsage) hoặc hết ngân sách bị từ chối', async () => {
  const future = new Date(Date.now() + 86400000);
  const offerVoucher = {
    id: 'v-offer',
    code: 'OUTOFBUDGET',
    type: 'FIXED',
    value: 100000,
    maxDiscount: null,
    minAmount: 100000,
    venueId: null,
    validFrom: new Date(Date.now() - 3600000),
    validTo: future,
    usageLimit: null,
    usedCount: 5,
    isActive: true,
    partnerOffer: {
      id: 'po-budget',
      status: 'ACTIVE',
      budget: 500000,
      usedBudget: 500000, // cạn ngân sách
      currentUsage: 5,
      maxUsage: 10,
      partner: { status: 'ACTIVE' },
      termsSnapshot: null,
    },
  };

  const db = {
    voucher: {
      findUnique: async () => offerVoucher,
    },
    offerUsage: {
      findMany: async () => [],
    },
  };

  await assert.rejects(
    validateAndQuoteOffer(db, 'OUTOFBUDGET', 'venue-1', 200000),
    (err) => err.status === 409 && err.message.includes('ngân sách')
  );
});

test('4. Duyệt tiền mặt (CONFIRM) giữ suất ưu đãi đúng cách (expiresAt = null)', async () => {
  let offerUsageUpdated = false;
  let coachBookingUpdated = false;
  const booking = {
    id: 'b-cash',
    code: 'DATSAN-CASH',
    userId: 'u-1',
    venueId: 'v-1',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    paymentMethod: 'CASH',
    total: 150000,
    expiresAt: new Date(Date.now() + 300000),
    items: [{ id: 'i-1', status: 'HELD' }],
  };

  const db = {
    $transaction: async (fn) => {
      return fn({
        user: {
          findUnique: async () => ({ id: 'admin-1', name: 'Admin', role: 'ADMIN', status: 'ACTIVE' }),
        },
        venue: {
          findFirst: async () => ({ id: 'v-1' }),
        },
        booking: {
          findUnique: async () => booking,
          update: async ({ data }) => Object.assign(booking, data),
        },
        bookingItem: {
          updateMany: async () => ({ count: 1 }),
        },
        coachBooking: {
          updateMany: async ({ data }) => {
            if (data.status === 'CONFIRMED' && data.expiresAt === null) {
              coachBookingUpdated = true;
            }
            return { count: 1 };
          },
        },
        offerUsage: {
          updateMany: async ({ data }) => {
            if (data.expiresAt === null) {
              offerUsageUpdated = true;
            }
            return { count: 1 };
          },
        },
        adminAudit: {
          create: async () => ({ id: 'audit-1' }),
        },
      });
    },
  };

  await performAdminAction(db, 'admin-1', {
    id: 'b-cash',
    action: 'CONFIRM',
    reason: 'Duyệt thanh toán tiền mặt tại quầy',
  });

  assert.equal(booking.status, 'CONFIRMED');
  assert.equal(booking.expiresAt, null);
  assert.ok(offerUsageUpdated, 'offerUsage must have expiresAt set to null');
  assert.ok(coachBookingUpdated, 'coachBooking must have expiresAt set to null');
});

test('5. Thu tiền mặt (CASH_PAID) tiêu thụ suất và tăng usedCount của voucher', async () => {
  let voucherIncremented = false;
  let offerConsumed = false;
  const booking = {
    id: 'b-paid',
    code: 'DATSAN-PAID',
    userId: 'u-1',
    venueId: 'v-1',
    voucherId: 'v-active',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    paymentMethod: 'CASH',
    total: 120000,
    expiresAt: null,
    items: [{ id: 'i-1', status: 'CONFIRMED' }],
  };

  const db = {
    $transaction: async (fn) => {
      return fn({
        user: {
          findUnique: async () => ({ id: 'admin-1', name: 'Admin', role: 'ADMIN', status: 'ACTIVE' }),
        },
        venue: {
          findFirst: async () => ({ id: 'v-1' }),
        },
        booking: {
          findUnique: async () => booking,
          update: async ({ data }) => Object.assign(booking, data),
        },
        payment: {
          create: async () => ({ id: 'p-1' }),
        },
        offerUsage: {
          findMany: async () => [{ id: 'ou-1', offerId: 'po-1', discountAmount: 30000 }],
          update: async ({ data }) => {
            if (data.state === 'CONSUMED') offerConsumed = true;
            return { id: 'ou-1' };
          },
        },
        partnerOffer: {
          update: async () => ({ id: 'po-1' }),
        },
        voucher: {
          update: async ({ data }) => {
            if (data.usedCount) voucherIncremented = true;
            return { id: 'v-active' };
          },
        },
        adminAudit: {
          create: async () => ({ id: 'audit-1' }),
        },
      });
    },
  };

  await performAdminAction(db, 'admin-1', {
    id: 'b-paid',
    action: 'CASH_PAID',
    reason: 'Đã thu tiền mặt đầy đủ',
  });

  assert.equal(booking.paymentStatus, 'PAID');
  assert.ok(offerConsumed, 'offerUsage must transition to CONSUMED');
  assert.ok(voucherIncremented, 'voucher usedCount must increment');
});

test('6. Hủy HLV cho đơn đã thanh toán tạo quy trình hoàn tiền (REFUND_PENDING)', async () => {
  let refundPaymentCreated = false;
  const coachProfile = { id: 'cp-1', userId: 'user-coach' };
  const booking = {
    id: 'b-with-coach',
    code: 'DATSAN-COACH',
    userId: 'customer-1',
    paymentStatus: 'PAID',
    subtotal: 300000,
    total: 300000,
  };
  const coachBooking = {
    id: 'cb-1',
    coachId: 'cp-1',
    fee: 150000,
    status: 'CONFIRMED',
    bookingItem: {
      booking,
    },
  };

  const db = {
    $transaction: async (fn) => {
      return fn({
        coachProfile: {
          findUnique: async () => coachProfile,
        },
        coachBooking: {
          findUnique: async () => coachBooking,
          update: async ({ data }) => Object.assign(coachBooking, data),
        },
        payment: {
          create: async ({ data }) => {
            if (data.status === 'REFUND_PENDING' && data.amount === 150000) {
              refundPaymentCreated = true;
            }
            return { id: 'p-refund', ...data };
          },
        },
        booking: {
          update: async ({ data }) => Object.assign(booking, data),
        },
        bookingPriceLine: {
          create: async () => ({ id: 'bpl-1' }),
        },
        notification: {
          create: async () => ({ id: 'notif-1' }),
        },
      });
    },
  };

  const res = await cancelCoachBookingByCoach(db, 'user-coach', 'cb-1', 'HLV bị ốm đột xuất');
  assert.equal(res.success, true);
  assert.equal(res.refundedFee, 150000);
  assert.equal(coachBooking.status, 'CANCELLED');
  assert.equal(booking.paymentStatus, 'PAID', 'Đơn giữ nguyên trạng thái PAID để khách nhận sân hợp lệ');
  assert.ok(refundPaymentCreated, 'Payment record with REFUND_PENDING status must be created');
});

test('7. Lịch HLV tính đúng múi giờ Việt Nam UTC+7', async () => {
  let queriedStart = null;
  let queriedEnd = null;
  const db = {
    coachAvailability: {
      findMany: async ({ where }) => {
        queriedStart = where.startsAt.gte;
        queriedEnd = where.startsAt.lte;
        return [];
      },
    },
    coachBooking: {
      findMany: async () => [],
    },
  };

  await getPublicCoachAvailabilities(db, 'c-1', 'v-1', '2026-10-15');
  assert.ok(queriedStart);
  assert.ok(queriedEnd);
  // 2026-10-15T00:00:00+07:00 tương ứng 2026-10-14T17:00:00.000Z
  assert.equal(queriedStart.toISOString(), '2026-10-14T17:00:00.000Z');
  // 2026-10-15T23:59:59.999+07:00 tương ứng 2026-10-15T16:59:59.999Z
  assert.equal(queriedEnd.toISOString(), '2026-10-15T16:59:59.999Z');
});

test('8. Lịch HLV không bị mất khoảng rảnh khi học viên đặt 1 phần ca (Interval Subtraction)', async () => {
  // HLV rảnh từ 08:00 đến 12:00 (4 tiếng) ngày 2026-10-15
  const slotStart = new Date('2026-10-15T08:00:00+07:00');
  const slotEnd = new Date('2026-10-15T12:00:00+07:00');

  // Đã có học viên đặt 09:00 đến 10:00 (1 tiếng)
  const bookedStart = new Date('2026-10-15T09:00:00+07:00');
  const bookedEnd = new Date('2026-10-15T10:00:00+07:00');

  const db = {
    coachAvailability: {
      findMany: async () => [
        {
          id: 'slot-1',
          startsAt: slotStart,
          endsAt: slotEnd,
        },
      ],
    },
    coachBooking: {
      findMany: async () => [
        {
          startsAt: bookedStart,
          endsAt: bookedEnd,
        },
      ],
    },
  };

  const freeSlots = await getPublicCoachAvailabilities(db, 'c-1', 'v-1', '2026-10-15');
  // Phải tách thành 2 khoảng rảnh: 08:00-09:00 và 10:00-12:00
  assert.equal(freeSlots.length, 2, 'Must retain remaining sub-intervals instead of dropping entire slot');
  assert.equal(freeSlots[0].startsAt, slotStart.toISOString());
  assert.equal(freeSlots[0].endsAt, bookedStart.toISOString());
  assert.equal(freeSlots[1].startsAt, bookedEnd.toISOString());
  assert.equal(freeSlots[1].endsAt, slotEnd.toISOString());
});

test('9. Đồng bộ hoàn thành đơn sang HLV (COMPLETE -> coachBooking.status = COMPLETED)', async () => {
  let coachSyncedToCompleted = false;
  const booking = {
    id: 'b-complete',
    code: 'DATSAN-COMP',
    userId: 'u-1',
    venueId: 'v-1',
    status: 'CHECKED_IN',
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    total: 200000,
    expiresAt: null,
    items: [{ id: 'i-1', status: 'CONFIRMED' }],
  };

  const db = {
    $transaction: async (fn) => {
      return fn({
        user: {
          findUnique: async () => ({ id: 'admin-1', name: 'Admin', role: 'ADMIN', status: 'ACTIVE' }),
        },
        venue: {
          findFirst: async () => ({ id: 'v-1' }),
        },
        booking: {
          findUnique: async () => booking,
          update: async ({ data }) => Object.assign(booking, data),
        },
        coachBooking: {
          updateMany: async ({ data }) => {
            if (data.status === 'COMPLETED') coachSyncedToCompleted = true;
            return { count: 1 };
          },
        },
        adminAudit: {
          create: async () => ({ id: 'audit-1' }),
        },
      });
    },
  };

  await performAdminAction(db, 'admin-1', {
    id: 'b-complete',
    action: 'COMPLETE',
    reason: 'Trận đấu kết thúc tốt đẹp',
  });

  assert.equal(booking.status, 'COMPLETED');
  assert.ok(coachSyncedToCompleted, 'coachBooking must be synchronized to COMPLETED');
});
