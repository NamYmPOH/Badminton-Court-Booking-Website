/**
 * Script đối soát và chuẩn bị phương án backfill bộ đếm Voucher cho đơn nhóm cũ.
 * Chế độ mặc định: DRY-RUN (chỉ đọc, không sửa dữ liệu production).
 *
 * Chạy đối soát an toàn (Dry-Run):
 *   node scripts/audit-voucher-backfill.cjs
 *
 * Chạy áp dụng cập nhật có bảo vệ và transaction:
 *   node scripts/audit-voucher-backfill.cjs --apply
 */

const { PrismaClient } = require("@prisma/client");

/**
 * Phân loại và thực hiện đối soát / backfill bộ đếm voucher.
 * Hàm được đóng gói để vừa chạy CLI độc lập vừa có thể kiểm thử tự động.
 */
async function auditAndBackfillVouchers(prisma, options = {}) {
  const isApply = Boolean(options.apply);
  const batchSize = Math.max(1, options.batchSize || 50);
  const log = options.logFn || console.log;

  log(`[VOUCHER AUDIT & BACKFILL] Chế độ: ${isApply ? "ÁP DỤNG THẬT (--apply)" : "DRY-RUN (CHỈ ĐỐI SOÁT - AN TOÀN)"}`);

  // 1. Tìm tất cả đơn nhóm đã thanh toán (PAID) có sử dụng voucherId
  const paidGroupBookings = await prisma.booking.findMany({
    where: {
      group: { isNot: null },
      paymentStatus: "PAID",
      voucherId: { not: null },
    },
    select: {
      id: true,
      code: true,
      total: true,
      voucherId: true,
      createdAt: true,
      voucher: {
        select: {
          id: true,
          code: true,
          usedCount: true,
          usageLimit: true,
        },
      },
      offerUsages: {
        select: {
          id: true,
          state: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  log(`Tìm thấy ${paidGroupBookings.length} đơn nhóm đã thanh toán (PAID) có gắn voucherId.`);

  // 2. Thu thập dữ liệu chứng từ đã có (VoucherUsage và AdminAudit)
  const bookingIds = paidGroupBookings.map((b) => b.id);

  let existingVoucherUsages = [];
  if (prisma.voucherUsage && typeof prisma.voucherUsage.findMany === "function") {
    try {
      existingVoucherUsages = await prisma.voucherUsage.findMany({
        where: { bookingId: { in: bookingIds } },
        select: { voucherId: true, bookingId: true },
      });
    } catch {
      existingVoucherUsages = [];
    }
  }

  let existingAudits = [];
  if (prisma.adminAudit && typeof prisma.adminAudit.findMany === "function") {
    try {
      existingAudits = await prisma.adminAudit.findMany({
        where: {
          action: "VOUCHER_CONSUMED",
          entityId: { in: paidGroupBookings.map((b) => `VOUCHER_CONSUMED:${b.id}:${b.voucherId}`) },
        },
        select: { entityId: true },
      });
    } catch {
      existingAudits = [];
    }
  }

  const voucherUsageSet = new Set(existingVoucherUsages.map((u) => `${u.bookingId}:${u.voucherId}`));
  const auditSet = new Set(existingAudits.map((a) => a.entityId));

  // 3. Phân loại từng đơn vào 3 nhóm
  const vouchersMap = new Map();
  const candidatesToBackfill = [];

  for (const b of paidGroupBookings) {
    if (!b.voucherId || !b.voucher) continue;
    const vId = b.voucherId;

    if (!vouchersMap.has(vId)) {
      vouchersMap.set(vId, {
        voucher: b.voucher,
        totalPaidGroupBookings: 0,
        confirmedRecorded: 0,
        confirmedUnrecorded: 0,
        ambiguousNeedReview: 0,
        sampleRecorded: [],
        sampleUnrecorded: [],
        sampleAmbiguous: [],
      });
    }

    const stat = vouchersMap.get(vId);
    stat.totalPaidGroupBookings++;

    const hasOfferUsageConsumed = b.offerUsages && b.offerUsages.some((ou) => ou.state === "CONSUMED");
    const hasVoucherUsageRecord = voucherUsageSet.has(`${b.id}:${b.voucherId}`);
    const hasAuditMarker = auditSet.has(`VOUCHER_CONSUMED:${b.id}:${b.voucherId}`);

    // Nhóm 1: Có bằng chứng rõ ràng đã ghi nhận
    if (hasOfferUsageConsumed || hasVoucherUsageRecord || hasAuditMarker) {
      stat.confirmedRecorded++;
      if (stat.sampleRecorded.length < 3) stat.sampleRecorded.push(b.code);
      continue;
    }

    // Kiểm tra tính toàn vẹn của thanh toán
    const validPayments = (b.payments || []).filter((p) => p.status === "PAID" || p.status === "REFUND_PENDING");
    const totalPaidOnPayments = validPayments.reduce((sum, p) => sum + p.amount, 0);

    // Nhóm 3: Mơ hồ / không đủ bằng chứng
    // - Tiền thanh toán không khớp đơn
    // - Đơn có vấn đề về dữ liệu voucher
    if (b.total > 0 && totalPaidOnPayments < b.total) {
      stat.ambiguousNeedReview++;
      stat.sampleAmbiguous.push(`${b.code} (Tiền thu ${totalPaidOnPayments} < Tổng ${b.total})`);
      continue;
    }

    // Nhóm 2: Có bằng chứng chưa ghi nhận (đủ điều kiện bù)
    stat.confirmedUnrecorded++;
    if (stat.sampleUnrecorded.length < 5) stat.sampleUnrecorded.push(b.code);
    candidatesToBackfill.push(b);
  }

  // 4. In báo cáo đối soát chi tiết
  log("\n================ KẾT QUẢ ĐỐI SOÁT THEO TỪNG VOUCHER ================");
  let totalCandidatesCount = 0;
  let totalAmbiguousCount = 0;
  let totalRecordedCount = 0;

  for (const [vId, stat] of vouchersMap.entries()) {
    totalCandidatesCount += stat.confirmedUnrecorded;
    totalAmbiguousCount += stat.ambiguousNeedReview;
    totalRecordedCount += stat.confirmedRecorded;

    log(`\n- Voucher [${stat.voucher.code}] (ID: ${vId}):`);
    log(`  + usedCount hiện tại trên DB: ${stat.voucher.usedCount}`);
    log(`  + Tổng đơn nhóm PAID: ${stat.totalPaidGroupBookings}`);
    log(`  + [Nhóm 1] Đã có chứng từ ghi nhận: ${stat.confirmedRecorded} đơn`);
    log(`  + [Nhóm 2] Có bằng chứng chưa ghi nhận (cần bù): ${stat.confirmedUnrecorded} đơn`);
    log(`  + [Nhóm 3] Mơ hồ / cần kiểm tra thủ công: ${stat.ambiguousNeedReview} đơn`);
    if (stat.sampleUnrecorded.length > 0) {
      log(`  + Mã đơn mẫu cần bù: ${stat.sampleUnrecorded.join(", ")}`);
    }
    if (stat.sampleAmbiguous.length > 0) {
      log(`  + Mã đơn mơ hồ cần đối soát: ${stat.sampleAmbiguous.join(", ")}`);
    }
  }

  log("\n================ KẾT LUẬN & PHƯƠNG ÁN XỬ LÝ ================");
  log(`- Tổng đơn đã ghi nhận: ${totalRecordedCount}`);
  log(`- Tổng đơn đủ điều kiện bù (backfill): ${totalCandidatesCount}`);
  log(`- Tổng đơn mơ hồ giữ nguyên (không tự động tăng): ${totalAmbiguousCount}`);

  // 5. Áp dụng cập nhật (khi có cờ --apply)
  if (isApply) {
    if (candidatesToBackfill.length === 0) {
      log("✔ Không có đơn hàng nào cần bù lượt dùng. Dữ liệu đã đồng bộ 100%.");
      return {
        totalProcessed: 0,
        totalRecorded: totalRecordedCount,
        totalBackfilled: 0,
        totalAmbiguous: totalAmbiguousCount,
      };
    }

    log(`\nCẢNH BÁO: Bắt đầu áp dụng cập nhật cho ${candidatesToBackfill.length} đơn theo batch (${batchSize} đơn/batch)...`);

    let backfilledCount = 0;
    for (let i = 0; i < candidatesToBackfill.length; i += batchSize) {
      const batch = candidatesToBackfill.slice(i, i + batchSize);
      log(`Đang xử lý batch ${Math.floor(i / batchSize) + 1} (${batch.length} đơn)...`);

      await prisma.$transaction(async (tx) => {
        for (const booking of batch) {
          const auditMarker = `VOUCHER_CONSUMED:${booking.id}:${booking.voucherId}`;

          // Kiểm tra lại trong transaction chống race condition
          let alreadyRecordedInTx = false;
          if (tx.voucherUsage && typeof tx.voucherUsage.findUnique === "function") {
            const existing = await tx.voucherUsage.findUnique({
              where: { voucherId_bookingId: { voucherId: booking.voucherId, bookingId: booking.id } },
            });
            if (existing) alreadyRecordedInTx = true;
          } else if (tx.adminAudit && typeof tx.adminAudit.findFirst === "function") {
            const existingAudit = await tx.adminAudit.findFirst({
              where: { action: "VOUCHER_CONSUMED", entityId: auditMarker },
            });
            if (existingAudit) alreadyRecordedInTx = true;
          }

          if (alreadyRecordedInTx) {
            continue;
          }

          // 1. Tạo chứng từ VoucherUsage nếu hỗ trợ
          if (tx.voucherUsage && typeof tx.voucherUsage.create === "function") {
            try {
              await tx.voucherUsage.create({
                data: {
                  voucherId: booking.voucherId,
                  bookingId: booking.id,
                },
              });
            } catch (err) {
              const isP2002 = Boolean(err && typeof err === "object" && err.code === "P2002");
              if (!isP2002) throw err;
              continue; // Nếu vừa bị tạo bởi tiến trình khác, bỏ qua không tăng bộ đếm
            }
          }

          // 2. Tạo chứng từ AdminAudit
          if (tx.adminAudit && typeof tx.adminAudit.create === "function") {
            await tx.adminAudit.create({
              data: {
                actorId: "system:backfill",
                actorName: "Hệ thống Backfill Voucher",
                action: "VOUCHER_CONSUMED",
                entityId: auditMarker,
                reason: `Bù lượt dùng voucher cho đơn nhóm cũ ${booking.code}`,
                details: {
                  bookingId: booking.id,
                  voucherId: booking.voucherId,
                  batch: Math.floor(i / batchSize) + 1,
                  type: "BACKFILL",
                },
              },
            });
          }

          // 3. Tăng usedCount chính xác 1 lần trong cùng transaction
          await tx.voucher.update({
            where: { id: booking.voucherId },
            data: { usedCount: { increment: 1 } },
          });

          backfilledCount++;
        }
      });
    }

    log(`✔ Hoàn tất cập nhật. Đã bù thành công ${backfilledCount} lượt dùng.`);
    return {
      totalProcessed: candidatesToBackfill.length,
      totalRecorded: totalRecordedCount,
      totalBackfilled: backfilledCount,
      totalAmbiguous: totalAmbiguousCount,
    };
  }

  log("\nĐây là chế độ DRY-RUN. Cơ sở dữ liệu KHÔNG bị thay đổi.");
  log("Để áp dụng cập nhật, quản trị viên cần chạy với cờ: node scripts/audit-voucher-backfill.cjs --apply");
  return {
    totalProcessed: 0,
    totalRecorded: totalRecordedCount,
    totalBackfilled: 0,
    totalCandidates: totalCandidatesCount,
    totalAmbiguous: totalAmbiguousCount,
  };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const isApply = process.argv.includes("--apply");
    await auditAndBackfillVouchers(prisma, { apply: isApply });
    process.exit(0);
  } catch (error) {
    console.error("[VOUCHER BACKFILL ERROR]", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { auditAndBackfillVouchers };
