const assert = require("node:assert/strict");
const { test } = require("node:test");
const { auditAndBackfillVouchers } = require("../scripts/audit-voucher-backfill.cjs");

test("Backfill: Dry-run mặc định không thay đổi usedCount và không tạo chứng từ", async () => {
  let voucherUpdateCalled = false;
  let auditCreateCalled = false;
  let usageCreateCalled = false;

  const voucher = { id: "v-1", code: "CHAOBAN", usedCount: 5, usageLimit: 100 };
  const booking = {
    id: "b-1",
    code: "SB-1001",
    total: 200000,
    voucherId: "v-1",
    voucher,
    offerUsages: [],
    payments: [{ id: "p-1", amount: 200000, status: "PAID" }],
  };

  const mockPrisma = {
    booking: {
      findMany: async () => [booking],
    },
    voucherUsage: {
      findMany: async () => [],
      create: async () => {
        usageCreateCalled = true;
      },
    },
    adminAudit: {
      findMany: async () => [],
      create: async () => {
        auditCreateCalled = true;
      },
    },
    voucher: {
      update: async () => {
        voucherUpdateCalled = true;
      },
    },
  };

  const result = await auditAndBackfillVouchers(mockPrisma, { apply: false, logFn: () => {} });

  assert.equal(result.totalCandidates, 1, "Đơn phải được phân loại là ứng viên cần bù");
  assert.equal(result.totalBackfilled, 0, "Chế độ dry-run không được bù dữ liệu");
  assert.equal(voucherUpdateCalled, false, "Dry-run không được gọi voucher.update");
  assert.equal(auditCreateCalled, false, "Dry-run không được tạo AdminAudit");
  assert.equal(usageCreateCalled, false, "Dry-run không được tạo VoucherUsage");
  assert.equal(voucher.usedCount, 5, "usedCount của voucher phải giữ nguyên");
});

test("Backfill: Đơn đã có chứng từ ghi nhận không bị tăng thêm", async () => {
  let voucherIncrementCount = 0;

  const voucher = { id: "v-2", code: "TRIAN", usedCount: 10, usageLimit: 100 };
  const booking = {
    id: "b-2",
    code: "SB-1002",
    total: 200000,
    voucherId: "v-2",
    voucher,
    offerUsages: [],
    payments: [{ id: "p-2", amount: 200000, status: "PAID" }],
  };

  const mockPrisma = {
    booking: {
      findMany: async () => [booking],
    },
    voucherUsage: {
      findMany: async () => [{ voucherId: "v-2", bookingId: "b-2" }], // Đã có chứng từ
      findUnique: async () => ({ id: "vu-1" }),
    },
    adminAudit: {
      findMany: async () => [],
    },
    voucher: {
      update: async ({ data }) => {
        if (data.usedCount?.increment) voucherIncrementCount += data.usedCount.increment;
      },
    },
    $transaction: async (fn) => fn(mockPrisma),
  };

  const result = await auditAndBackfillVouchers(mockPrisma, { apply: true, logFn: () => {} });

  assert.equal(result.totalRecorded, 1, "Đơn phải được phân loại vào Nhóm 1 (Đã ghi nhận)");
  assert.equal(result.totalBackfilled, 0, "Không được backfill đơn đã có chứng từ");
  assert.equal(voucherIncrementCount, 0, "Voucher.usedCount không được tăng thêm");
});

test("Backfill: Đơn mơ hồ (tiền thu không khớp tổng) được đưa vào đối soát, không tự động tăng", async () => {
  let voucherIncrementCount = 0;

  const voucher = { id: "v-3", code: "GIAM50K", usedCount: 2, usageLimit: 50 };
  // Đơn total 300k nhưng payments chỉ có 100k -> Mơ hồ, chưa thanh toán đủ thực tế
  const booking = {
    id: "b-3",
    code: "SB-1003",
    total: 300000,
    voucherId: "v-3",
    voucher,
    offerUsages: [],
    payments: [{ id: "p-3", amount: 100000, status: "PAID" }],
  };

  const mockPrisma = {
    booking: {
      findMany: async () => [booking],
    },
    voucherUsage: {
      findMany: async () => [],
    },
    adminAudit: {
      findMany: async () => [],
    },
    voucher: {
      update: async ({ data }) => {
        if (data.usedCount?.increment) voucherIncrementCount += data.usedCount.increment;
      },
    },
    $transaction: async (fn) => fn(mockPrisma),
  };

  const result = await auditAndBackfillVouchers(mockPrisma, { apply: true, logFn: () => {} });

  assert.equal(result.totalAmbiguous, 1, "Đơn thanh toán thiếu phải được đưa vào nhóm Mơ hồ (Ambiguous)");
  assert.equal(result.totalBackfilled, 0, "Không được tự động backfill đơn mơ hồ");
  assert.equal(voucherIncrementCount, 0, "Bộ đếm usedCount không được tăng");
});

test("Backfill: Apply lần 1 bù thành công, apply lần 2 idempotent không tăng thêm", async () => {
  let voucherIncrementCount = 0;
  const recordedUsages = new Set();
  const recordedAudits = new Set();

  const voucher = { id: "v-4", code: "SMASH20", usedCount: 3, usageLimit: 100 };
  const booking = {
    id: "b-4",
    code: "SB-1004",
    total: 200000,
    voucherId: "v-4",
    voucher,
    offerUsages: [],
    payments: [{ id: "p-4", amount: 200000, status: "PAID" }],
  };

  const mockPrisma = {
    booking: {
      findMany: async () => [booking],
    },
    voucherUsage: {
      findMany: async () => Array.from(recordedUsages).map((key) => {
        const [bookingId, voucherId] = key.split(":");
        return { bookingId, voucherId };
      }),
      findUnique: async ({ where }) => {
        const key = `${where.voucherId_bookingId.bookingId}:${where.voucherId_bookingId.voucherId}`;
        return recordedUsages.has(key) ? { id: "vu-exists" } : null;
      },
      create: async ({ data }) => {
        const key = `${data.bookingId}:${data.voucherId}`;
        if (recordedUsages.has(key)) {
          const err = new Error("Unique constraint violation");
          err.code = "P2002";
          throw err;
        }
        recordedUsages.add(key);
        return { id: "vu-created" };
      },
    },
    adminAudit: {
      findMany: async () => Array.from(recordedAudits).map((entityId) => ({ entityId })),
      findFirst: async ({ where }) => recordedAudits.has(where.entityId) ? { id: "aud-exists" } : null,
      create: async ({ data }) => {
        recordedAudits.add(data.entityId);
        return { id: "aud-created" };
      },
    },
    voucher: {
      update: async ({ data }) => {
        if (data.usedCount?.increment) {
          voucherIncrementCount += data.usedCount.increment;
          voucher.usedCount += data.usedCount.increment;
        }
      },
    },
    $transaction: async (fn) => fn(mockPrisma),
  };

  // Chạy lần 1: Phải bù 1 lượt
  const res1 = await auditAndBackfillVouchers(mockPrisma, { apply: true, logFn: () => {} });
  assert.equal(res1.totalBackfilled, 1, "Lần 1 phải bù đúng 1 lượt");
  assert.equal(voucherIncrementCount, 1, "Voucher usedCount phải tăng đúng 1");
  assert.equal(voucher.usedCount, 4);

  // Chạy lần 2: Đã có chứng từ, không được tăng thêm
  const res2 = await auditAndBackfillVouchers(mockPrisma, { apply: true, logFn: () => {} });
  assert.equal(res2.totalBackfilled, 0, "Lần 2 chạy lại không được bù thêm");
  assert.equal(res2.totalRecorded, 1, "Đơn đã chuyển sang nhóm Đã ghi nhận");
  assert.equal(voucherIncrementCount, 1, "Voucher usedCount không đổi sau lần 2");
  assert.equal(voucher.usedCount, 4);
});

test("Backfill: Lỗi giữa transaction của một batch phải rollback toàn bộ batch", async () => {
  let voucherIncrementCount = 0;
  const recordedUsages = new Set();

  const voucher = { id: "v-5", code: "FAILBATCH", usedCount: 0, usageLimit: 50 };
  const bookings = [
    {
      id: "b-5-1",
      code: "SB-501",
      total: 100000,
      voucherId: "v-5",
      voucher,
      offerUsages: [],
      payments: [{ id: "p-5-1", amount: 100000, status: "PAID" }],
    },
    {
      id: "b-5-2",
      code: "SB-502",
      total: 100000,
      voucherId: "v-5",
      voucher,
      offerUsages: [],
      payments: [{ id: "p-5-2", amount: 100000, status: "PAID" }],
    },
  ];

  let shouldThrowInDb = true;

  const mockPrisma = {
    booking: {
      findMany: async () => bookings,
    },
    voucherUsage: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }) => {
        recordedUsages.add(data.bookingId);
      },
    },
    adminAudit: {
      findMany: async () => [],
      findFirst: async () => null,
      create: async () => ({ id: "aud" }),
    },
    voucher: {
      update: async ({ data }) => {
        if (shouldThrowInDb && recordedUsages.has("b-5-2")) {
          throw new Error("Simulated database network error during batch");
        }
        if (data.usedCount?.increment) voucherIncrementCount += data.usedCount.increment;
      },
    },
    $transaction: async (fn) => {
      // Giả lập transaction rollback: nếu work ném lỗi thì xóa state
      const beforeState = new Set(recordedUsages);
      const beforeCount = voucherIncrementCount;
      try {
        return await fn(mockPrisma);
      } catch (err) {
        recordedUsages.clear();
        beforeState.forEach((k) => recordedUsages.add(k));
        voucherIncrementCount = beforeCount;
        throw err;
      }
    },
  };

  await assert.rejects(
    async () => {
      await auditAndBackfillVouchers(mockPrisma, { apply: true, batchSize: 2, logFn: () => {} });
    },
    /Simulated database network error/
  );

  // Khẳng định rollback sạch sẽ: không có chứng từ nào của batch được lưu lại và count không đổi
  assert.equal(recordedUsages.size, 0, "Transaction rollback phải xóa toàn bộ chứng từ của batch bị lỗi");
  assert.equal(voucherIncrementCount, 0, "Transaction rollback không được tăng usedCount");
});
