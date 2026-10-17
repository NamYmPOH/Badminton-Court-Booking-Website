/**
 * Script đối soát và chuẩn bị phương án backfill bộ đếm Voucher cho đơn nhóm cũ.
 * Chế độ mặc định: DRY-RUN (chỉ đọc, không sửa dữ liệu production).
 *
 * Chạy:
 *   node scripts/audit-voucher-backfill.cjs [--dry-run]
 */

const { PrismaClient } = require("@prisma/client");

async function main() {
  const isApply = process.argv.includes("--apply");
  console.log(`[VOUCHER AUDIT & BACKFILL] Chế độ: ${isApply ? "ÁP DỤNG THẬT (--apply)" : "DRY-RUN (CHỈ ĐỐI SOÁT - AN TOÀN)"}`);

  const prisma = new PrismaClient();

  try {
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
      },
    });

    console.log(`Tìm thấy ${paidGroupBookings.length} đơn nhóm đã thanh toán (PAID) có gắn voucherId.`);

    const vouchersMap = new Map();
    let undercountedCount = 0;

    for (const b of paidGroupBookings) {
      if (!b.voucherId || !b.voucher) continue;
      const vId = b.voucherId;
      if (!vouchersMap.has(vId)) {
        vouchersMap.set(vId, {
          voucher: b.voucher,
          totalPaidGroupBookings: 0,
          bookingsWithOfferUsage: 0,
          bookingsWithoutOfferUsage: 0,
          sampleBookings: [],
        });
      }
      const stat = vouchersMap.get(vId);
      stat.totalPaidGroupBookings++;
      if (b.offerUsages && b.offerUsages.length > 0) {
        stat.bookingsWithOfferUsage++;
      } else {
        stat.bookingsWithoutOfferUsage++;
        stat.sampleBookings.push(b.code);
        undercountedCount++;
      }
    }

    console.log("\n================ KẾT QUẢ ĐỐI SOÁT THEO TỪNG VOUCHER ================");
    for (const [vId, stat] of vouchersMap.entries()) {
      console.log(`\n- Voucher [${stat.voucher.code}] (ID: ${vId}):`);
      console.log(`  + usedCount hiện tại trên DB: ${stat.voucher.usedCount}`);
      console.log(`  + Tổng đơn nhóm PAID: ${stat.totalPaidGroupBookings}`);
      console.log(`  + Đơn có OfferUsage (đã được tính trước đây): ${stat.bookingsWithOfferUsage}`);
      console.log(`  + Đơn voucher thường (bị thiếu lượt dùng trước bản vá): ${stat.bookingsWithoutOfferUsage}`);
      if (stat.sampleBookings.length > 0) {
        console.log(`  + Mã đơn mẫu: ${stat.sampleBookings.slice(0, 5).join(", ")}${stat.sampleBookings.length > 5 ? "..." : ""}`);
      }
    }

    console.log("\n================ KẾT LUẬN & PHƯƠNG ÁN XỬ LÝ ================");
    console.log(`Tổng số lượt dùng voucher thường cần bù (backfill): ${undercountedCount}`);

    if (isApply) {
      console.log("CẢNH BÁO: Bắt đầu áp dụng cập nhật vào cơ sở dữ liệu...");
      for (const [vId, stat] of vouchersMap.entries()) {
        if (stat.bookingsWithoutOfferUsage > 0) {
          await prisma.voucher.update({
            where: { id: vId },
            data: { usedCount: { increment: stat.bookingsWithoutOfferUsage } },
          });
          console.log(`✔ Đã cập nhật voucher [${stat.voucher.code}] +${stat.bookingsWithoutOfferUsage} lượt.`);
        }
      }
      console.log("Hoàn tất cập nhật.");
    } else {
      console.log("Đây là chế độ DRY-RUN. Cơ sở dữ liệu KHÔNG bị thay đổi.");
      console.log("Để áp dụng cập nhật, quản trị viên cần chạy với cờ: node scripts/audit-voucher-backfill.cjs --apply");
    }
  } catch (error) {
    console.error("Lỗi đối soát:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
