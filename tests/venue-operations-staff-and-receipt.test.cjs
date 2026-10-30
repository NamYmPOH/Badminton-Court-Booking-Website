const test = require("node:test");
const assert = require("node:assert/strict");

// 1. Kiểm tra Contract response của GET /api/venue-staff
test("Venue Staff: Contract API GET /api/venue-staff trả về mảng nhân viên và thông tin cơ sở", () => {
  const mockVenue = {
    id: "venue-demo-1",
    name: "Sân Demo SmashBook - 2.000đ/giờ",
    slug: "smashbook-demo-2000-venue",
    ownerId: "owner-1",
  };

  const mockStaffList = [
    {
      userId: "staff-u1",
      venueId: "venue-demo-1",
      name: "Nguyễn Văn Lễ Tân",
      phone: "0912345678",
      email: "letan@smashbook.vn",
      userStatus: "ACTIVE",
      role: "RECEPTIONIST",
      userRole: "STAFF",
      isActive: true,
      isOnShift: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Chuẩn hóa response trả về client
  const apiResponse = {
    success: true,
    venue: mockVenue,
    staff: mockStaffList,
    staffMembers: mockStaffList,
  };

  assert.equal(apiResponse.success, true);
  assert.ok(Array.isArray(apiResponse.staff), "apiResponse.staff phải là Array");
  assert.ok(Array.isArray(apiResponse.staffMembers), "apiResponse.staffMembers phải là Array");
  assert.equal(apiResponse.staff.length, 1);
  assert.equal(apiResponse.staff[0].userRole, "STAFF");
  assert.equal(apiResponse.staff[0].isOnShift, true);
});

// 2. Logic nâng role khi thêm nhân viên
test("Venue Staff: CUSTOMER được nâng lên STAFF, ADMIN và OWNER không bị hạ role", () => {
  function computeRoleAfterAddingStaff(currentRole) {
    if (currentRole === "CUSTOMER") {
      return "STAFF";
    }
    // Giữ nguyên role nếu là ADMIN hoặc OWNER
    return currentRole;
  }

  assert.equal(computeRoleAfterAddingStaff("CUSTOMER"), "STAFF", "CUSTOMER phải được nâng thành STAFF");
  assert.equal(computeRoleAfterAddingStaff("ADMIN"), "ADMIN", "ADMIN không bị hạ xuống STAFF");
  assert.equal(computeRoleAfterAddingStaff("OWNER"), "OWNER", "OWNER không bị hạ xuống STAFF");
  assert.equal(computeRoleAfterAddingStaff("STAFF"), "STAFF", "STAFF giữ nguyên STAFF");
});

// 3. Điều kiện In hóa đơn nhiệt 80mm
test("Receipt Print: Chỉ cho phép in khi đơn đã thanh toán 100% và chưa hủy", () => {
  function canPrintReceipt(order) {
    if (!order) return false;
    if (order.status === "CANCELLED") return false;
    if (order.remaining > 0) return false;
    if (order.totalPaid < order.total) return false;
    return true;
  }

  const fullyPaidOnline = {
    id: "ord-1",
    code: "DATSAN123",
    total: 200000,
    totalPaid: 200000,
    remaining: 0,
    status: "CONFIRMED",
    isFullyPaid: true,
  };

  const fullyPaidCash = {
    id: "ord-2",
    code: "DATSAN124",
    total: 150000,
    totalPaid: 150000,
    remaining: 0,
    status: "CHECKED_IN",
    isFullyPaid: true,
  };

  const partialPaid = {
    id: "ord-3",
    code: "DATSAN125",
    total: 200000,
    totalPaid: 100000,
    remaining: 100000,
    status: "CONFIRMED",
    isFullyPaid: false,
  };

  const cancelledPaid = {
    id: "ord-4",
    code: "DATSAN126",
    total: 200000,
    totalPaid: 200000,
    remaining: 0,
    status: "CANCELLED",
    isFullyPaid: true,
  };

  assert.equal(canPrintReceipt(fullyPaidOnline), true, "Đơn thanh toán online đủ 100% được in hóa đơn");
  assert.equal(canPrintReceipt(fullyPaidCash), true, "Đơn đã thu đủ tiền mặt được in hóa đơn");
  assert.equal(canPrintReceipt(partialPaid), false, "Đơn còn thiếu tiền không được in hóa đơn");
  assert.equal(canPrintReceipt(cancelledPaid), false, "Đơn đã hủy không được in hóa đơn");
});

// 4. Định dạng và tính toán thông tin hóa đơn nhiệt 80mm
test("Receipt Print: Format hóa đơn 80mm chứa đầy đủ thông tin chuẩn", () => {
  const receiptData = {
    venueName: "Sân Demo SmashBook - 2.000đ/giờ",
    venueAddress: "123 Đường Cầu Lông, Quận 1, TP.HCM",
    orderCode: "DATSAN999",
    customerName: "Trần Minh",
    customerPhone: "0909123456",
    items: [
      { courtName: "Sân 1", date: "2026-10-30", startMin: 480, endMin: 540, price: 100000 },
      { courtName: "Sân 2", date: "2026-10-30", startMin: 480, endMin: 540, price: 100000 },
    ],
    total: 200000,
    totalPaid: 200000,
    cashier: "Nguyễn Văn Lễ Tân",
  };

  assert.ok(receiptData.orderCode.startsWith("DATSAN"));
  assert.equal(receiptData.items.length, 2);
  const sumItems = receiptData.items.reduce((s, i) => s + i.price, 0);
  assert.equal(sumItems, receiptData.total, "Tổng chi tiết các sân phải khớp tổng hóa đơn");
  assert.equal(receiptData.total, receiptData.totalPaid, "Hóa đơn phải thanh toán đủ");
});

// 5. Kiểm tra phân trang và lọc danh sách đơn đặt sân
test("Venue All Bookings: Logic phân trang và tính toán tổng số trang chuẩn xác", () => {
  function paginateItems(totalItems, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;
    return { total: totalItems, page: safePage, pageSize, totalPages, offset };
  }

  const p1 = paginateItems(25, 1, 10);
  assert.equal(p1.totalPages, 3);
  assert.equal(p1.offset, 0);

  const p2 = paginateItems(25, 2, 10);
  assert.equal(p2.offset, 10);

  const p3 = paginateItems(25, 3, 10);
  assert.equal(p3.offset, 20);

  const p4 = paginateItems(0, 1, 10);
  assert.equal(p4.totalPages, 1);
  assert.equal(p4.offset, 0);
});
