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

const {
  assertVenueManagePermission,
  getVenueCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  saveVenueCourtLayout,
} = require('../src/services/court.service.ts');

const { createReservation } = require('../src/services/reservation.service.ts');
const { vietnamDate } = require('../src/lib/booking.ts');

const mockVenueId = 'venue-test-1';
const ownerUserId = 'owner-1';
const strangerOwnerId = 'owner-stranger';
const customerUserId = 'cust-1';
const adminUserId = 'admin-1';

function createMockDb(users = {}, venues = {}, courts = {}, bookingItems = []) {
  const allUsers = {
    [ownerUserId]: { id: ownerUserId, name: 'Chủ sân 1', role: 'OWNER', status: 'ACTIVE' },
    [strangerOwnerId]: { id: strangerOwnerId, name: 'Chủ sân 2', role: 'OWNER', status: 'ACTIVE' },
    [customerUserId]: { id: customerUserId, name: 'Khách hàng', role: 'CUSTOMER', status: 'ACTIVE' },
    [adminUserId]: { id: adminUserId, name: 'Quản trị viên', role: 'ADMIN', status: 'ACTIVE' },
    ...users,
  };

  const allVenues = {
    [mockVenueId]: { id: mockVenueId, ownerId: ownerUserId, name: 'SmashBook Cầu Giấy' },
    ...venues,
  };

  const courtsList = Array.isArray(courts) ? [...courts] : Object.values(courts);

  const db = {
    user: {
      findUnique: async ({ where }) => allUsers[where.id] || null,
    },
    venue: {
      findUnique: async ({ where }) => allVenues[where.id] || null,
    },
    court: {
      findUnique: async ({ where }) => {
        if (where.id) return courtsList.find((c) => c.id === where.id) || null;
        if (where.venueId_name) {
          return (
            courtsList.find(
              (c) =>
                c.venueId === where.venueId_name.venueId &&
                c.name.toLowerCase() === where.venueId_name.name.toLowerCase()
            ) || null
          );
        }
        return null;
      },
      findFirst: async ({ where }) => {
        return (
          courtsList.find((c) => {
            if (where.id && where.id.not && c.id === where.id.not) return false;
            if (where.venueId && c.venueId !== where.venueId) return false;
            if (where.name?.equals && c.name.toLowerCase() === where.name.equals.toLowerCase()) {
              return true;
            }
            if (
              where.positionRow !== undefined &&
              where.positionCol !== undefined &&
              c.positionRow === where.positionRow &&
              c.positionCol === where.positionCol
            ) {
              return true;
            }
            return false;
          }) || null
        );
      },
      findMany: async ({ where }) => courtsList.filter((c) => !where?.venueId || c.venueId === where.venueId),
      count: async ({ where }) => courtsList.filter((c) => !where?.venueId || c.venueId === where.venueId).length,
      aggregate: async () => ({ _max: { sortOrder: courtsList.length } }),
      create: async ({ data }) => {
        const newCourt = { id: `court-${Date.now()}-${Math.random()}`, ...data };
        courtsList.push(newCourt);
        return newCourt;
      },
      update: async ({ where, data }) => {
        const c = courtsList.find((item) => item.id === where.id);
        if (!c) throw new Error('Court not found');
        Object.assign(c, data);
        return c;
      },
      delete: async ({ where }) => {
        const idx = courtsList.findIndex((item) => item.id === where.id);
        if (idx >= 0) return courtsList.splice(idx, 1)[0];
        throw new Error('Court not found');
      },
    },
    courtBlock: {
      count: async () => 0,
      deleteMany: async () => ({ count: 0 }),
    },
    courtSession: {
      count: async () => 0,
    },
    pricingRule: {
      deleteMany: async () => ({ count: 0 }),
    },
    bookingItem: {
      count: async ({ where }) => {
        return bookingItems.filter((item) => {
          if (where.courtId && item.courtId !== where.courtId) return false;
          if (where.status?.in && !where.status.in.includes(item.status)) return false;
          return true;
        }).length;
      },
    },
  };

  db.$transaction = async (fn) => fn(db);
  return { db, courtsList };
}

test('Quyền quản lý sân con: Chỉ OWNER sở hữu cơ sở hoặc ADMIN mới có quyền (chặn người ngoài 403)', async () => {
  const { db } = createMockDb();

  // 1. OWNER của cơ sở -> Hợp lệ
  const venueForOwner = await assertVenueManagePermission(db, ownerUserId, mockVenueId);
  assert.equal(venueForOwner.id, mockVenueId);

  // 2. ADMIN hệ thống -> Hợp lệ
  const venueForAdmin = await assertVenueManagePermission(db, adminUserId, mockVenueId);
  assert.equal(venueForAdmin.id, mockVenueId);

  // 3. OWNER khác cơ sở -> Bị chặn 403
  await assert.rejects(
    assertVenueManagePermission(db, strangerOwnerId, mockVenueId),
    (err) => err.status === 403
  );

  // 4. CUSTOMER bình thường -> Bị chặn 403
  await assert.rejects(
    assertVenueManagePermission(db, customerUserId, mockVenueId),
    (err) => err.status === 403
  );

  // 5. Venue không tồn tại -> 404
  await assert.rejects(
    assertVenueManagePermission(db, ownerUserId, 'venue-non-existent'),
    (err) => err.status === 404
  );
});

test('Fallback lưới mặc định khi cơ sở cũ chưa có cấu hình bố cục sơ đồ', async () => {
  const mockCourts = [
    {
      id: 'c-1',
      venueId: mockVenueId,
      name: 'Sân 1',
      status: 'ACTIVE',
      positionRow: null,
      positionCol: null,
      sortOrder: 1,
      pricingRules: [],
      items: [],
      _count: { items: 0 },
    },
    {
      id: 'c-2',
      venueId: mockVenueId,
      name: 'Sân 2',
      status: 'ACTIVE',
      positionRow: null,
      positionCol: null,
      sortOrder: 2,
      pricingRules: [{ id: 'pr-1' }],
      items: [{ id: 'item-1' }],
      _count: { items: 5 },
    },
  ];

  const { db } = createMockDb({}, {}, mockCourts);
  const result = await getVenueCourts(db, ownerUserId, mockVenueId);
  assert.equal(result.length, 2);

  // Kiểm tra tính toán vị trí lưới mặc định:
  assert.equal(result[0].positionRow, 1);
  assert.equal(result[0].positionCol, 1);
  assert.equal(result[0].hasCustomPricing, false);
  assert.equal(result[0].activeBookingsCount, 0);

  assert.equal(result[1].positionRow, 1);
  assert.equal(result[1].positionCol, 2);
  assert.equal(result[1].hasCustomPricing, true);
  assert.equal(result[1].activeBookingsCount, 1);
  assert.equal(result[1].totalBookingsCount, 5);
});

test('Tạo sân con: Kiểm tra chống trùng tên và chống đè vị trí sơ đồ (409)', async () => {
  const existingCourts = [
    {
      id: 'c-1',
      venueId: mockVenueId,
      name: 'Sân 1',
      status: 'ACTIVE',
      positionRow: 1,
      positionCol: 1,
    },
  ];

  const { db } = createMockDb({}, {}, existingCourts);

  // 1. Trùng tên (không phân biệt hoa thường) -> 409
  await assert.rejects(
    createCourt(db, ownerUserId, { venueId: mockVenueId, name: 'sân 1' }),
    (err) => err.status === 409 && err.message.includes('đã tồn tại')
  );

  // 2. Trùng vị trí trên sơ đồ (hàng 1, cột 1) -> 409
  await assert.rejects(
    createCourt(db, ownerUserId, {
      venueId: mockVenueId,
      name: 'Sân 2',
      positionRow: 1,
      positionCol: 1,
    }),
    (err) => err.status === 409 && err.message.includes('đã có')
  );

  // 3. Hợp lệ -> Tạo thành công
  const created = await createCourt(db, ownerUserId, {
    venueId: mockVenueId,
    name: 'Sân 2',
    positionRow: 1,
    positionCol: 2,
    orientation: 'HORIZONTAL',
  });
  assert.equal(created.name, 'Sân 2');
  assert.equal(created.positionRow, 1);
  assert.equal(created.positionCol, 2);
});

test('Cập nhật và Xóa sân: Chặn xóa sân có lịch sử, chặn ngừng hoạt động sân có lịch hiệu lực', async () => {
  const courtWithHistory = {
    id: 'c-hist',
    venueId: mockVenueId,
    name: 'Sân VIP',
    status: 'ACTIVE',
    positionRow: 1,
    positionCol: 1,
    items: [{ id: 'b-active', status: 'CONFIRMED' }],
    _count: { items: 10 },
  };

  const courtNew = {
    id: 'c-new',
    venueId: mockVenueId,
    name: 'Sân Nháp',
    status: 'ACTIVE',
    positionRow: 1,
    positionCol: 2,
    items: [],
    _count: { items: 0 },
  };

  // bookingItems trong DB:
  const bookingItems = [
    { id: 'item-active', courtId: 'c-hist', status: 'CONFIRMED' },
    { id: 'item-old', courtId: 'c-hist', status: 'COMPLETED' },
  ];

  const { db } = createMockDb({}, {}, [courtWithHistory, courtNew], bookingItems);

  // 1. Chuyển sang MAINTENANCE khi sân đang có lịch hiệu lực -> Bị chặn 409
  await assert.rejects(
    updateCourt(db, ownerUserId, 'c-hist', { status: 'MAINTENANCE' }),
    (err) => err.status === 409 && err.message.includes('lịch đặt còn hiệu lực')
  );

  // 2. Chuyển sang INACTIVE khi sân đang có lịch hiệu lực -> Bị chặn 409
  await assert.rejects(
    updateCourt(db, ownerUserId, 'c-hist', { status: 'INACTIVE' }),
    (err) => err.status === 409 && err.message.includes('lịch đặt còn hiệu lực')
  );

  // 3. Xóa sân đã có lịch sử đặt trước đó -> Bị chặn 409 (yêu cầu lưu trữ INACTIVE)
  await assert.rejects(
    deleteCourt(db, ownerUserId, 'c-hist'),
    (err) => err.status === 409 && err.message.includes('lịch sử')
  );

  // 4. Xóa sân mới chưa có lịch sử và không có lịch đặt -> Xóa thành công
  const deleteResult = await deleteCourt(db, ownerUserId, 'c-new');
  assert.equal(deleteResult.success, true);
});

test('Lưu bố cục sơ đồ 2D hàng loạt: Phát hiện và chặn vị trí trùng lặp (409)', async () => {
  const courts = [
    { id: 'c-1', venueId: mockVenueId, name: 'Sân 1', positionRow: 1, positionCol: 1 },
    { id: 'c-2', venueId: mockVenueId, name: 'Sân 2', positionRow: 1, positionCol: 2 },
  ];

  const { db } = createMockDb({}, {}, courts);

  // 1. Gửi 2 sân trùng hàng và cột (1, 1) -> 409
  await assert.rejects(
    saveVenueCourtLayout(db, ownerUserId, mockVenueId, [
      { courtId: 'c-1', positionRow: 1, positionCol: 1 },
      { courtId: 'c-2', positionRow: 1, positionCol: 1 },
    ]),
    (err) => err.status === 409 && err.message.includes('xếp trùng')
  );

  // 2. Tọa độ hợp lệ khác nhau -> Thành công
  const saveResult = await saveVenueCourtLayout(db, ownerUserId, mockVenueId, [
    { courtId: 'c-1', positionRow: 1, positionCol: 1, orientation: 'HORIZONTAL' },
    { courtId: 'c-2', positionRow: 2, positionCol: 1, orientation: 'VERTICAL' },
  ]);
  assert.equal(saveResult.success, true);
  assert.equal(saveResult.updatedCount, 2);
});

test('Đặt nhiều sân con trong cùng cơ sở: Tính tổng đúng và rollback toàn bộ nếu 1 sân bị xung đột', async () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const targetDate = vietnamDate(tomorrow);

  const mockVenue = {
    id: mockVenueId,
    name: 'SmashBook Cầu Giấy',
    status: 'ACTIVE',
    paymentMode: 'PREPAY_REQUIRED',
    openMin: 300,
    closeMin: 1320,
    advanceDays: 30,
    minBookingMin: 60,
    maxBookingMin: 240,
    courts: [
      { id: 'c-1', name: 'Sân 1', status: 'ACTIVE' },
      { id: 'c-2', name: 'Sân 2', status: 'ACTIVE' },
    ],
    pricing: [
      { daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startMin: 300, endMin: 1320, walkInPrice: 120000 },
    ],
  };

  // Case 1: Đặt 2 sân cùng lúc thành công (mỗi sân 60 phút = 2 slot 30 phút)
  let createdBookingData = null;
  const mockDbSuccess = {
    $transaction: async (work) =>
      work({
        venue: { findUnique: async () => mockVenue },
        courtBlock: { findFirst: async () => null },
        bookingItem: { findFirst: async () => null },
        booking: {
          findUnique: async () => null,
          count: async () => 0,
          create: async ({ data }) => {
            createdBookingData = data;
            return { id: 'booking-multi', code: data.code, ...data };
          },
        },
      }),
  };

  const multiSlots = [
    { courtId: 'c-1', startMin: 480, endMin: 510 },
    { courtId: 'c-1', startMin: 510, endMin: 540 },
    { courtId: 'c-2', startMin: 480, endMin: 510 },
    { courtId: 'c-2', startMin: 510, endMin: 540 },
  ];

  const reservation = await createReservation(
    mockDbSuccess,
    'user-test',
    {
      venueId: mockVenueId,
      date: targetDate,
      slots: multiSlots,
    }
  );

  assert.ok(reservation);
  // Mỗi sân 60 phút giá 120k -> 2 sân = 240k
  assert.equal(reservation.total, 240000);
  assert.equal(createdBookingData.items.create.length, 4);

  // Xác nhận từng slot được gán đúng courtId tương ứng (không bị gán dồn vào court đầu tiên)
  assert.equal(createdBookingData.items.create[0].courtId, 'c-1');
  assert.equal(createdBookingData.items.create[1].courtId, 'c-1');
  assert.equal(createdBookingData.items.create[2].courtId, 'c-2');
  assert.equal(createdBookingData.items.create[3].courtId, 'c-2');

  // Case 2: Sân 2 bị xung đột (đã có người đặt slot thứ 3), sân 1 còn trống -> Phải fail toàn bộ đơn, không giữ chỗ một phần
  const mockDbConflict = {
    $transaction: async (work) =>
      work({
        venue: { findUnique: async () => mockVenue },
        courtBlock: { findFirst: async () => null },
        bookingItem: {
          findFirst: async ({ where }) => {
            // Sân c-2 bị trùng giờ
            if (where.courtId === 'c-2') {
              return { id: 'item-conflict', status: 'CONFIRMED' };
            }
            return null;
          },
        },
        booking: {
          findUnique: async () => null,
          count: async () => 0,
          create: async () => {
            throw new Error('Should not reach create');
          },
        },
      }),
  };

  await assert.rejects(
    createReservation(
      mockDbConflict,
      'user-test',
      {
        venueId: mockVenueId,
        date: targetDate,
        slots: multiSlots,
      }
    ),
    (err) => err.status === 409 && err.message.includes('Khung giờ vừa được đặt hoặc đã khóa')
  );
});
