import { type PrismaClient } from "@prisma/client";
import { serializable } from "./sepay.service";

export interface CleanupExpiredResult {
  expiredBookingsCount: number;
  releasedItemsCount: number;
  releasedCoachBookingsCount: number;
  releasedOfferUsagesCount: number;
}

/**
 * Tác vụ dọn dẹp các đơn PENDING_PAYMENT đã quá hạn giữ chỗ (expiresAt <= now).
 * Được thiết kế chạy an toàn, có thể gọi định kỳ hoặc theo cron mà không sợ race condition.
 * Không giải phóng các đơn đã CONFIRMED hoặc thanh toán hợp lệ.
 */
export async function cleanupExpiredBookings(
  db: PrismaClient,
  now = new Date()
): Promise<CleanupExpiredResult> {
  return serializable(db, async (tx) => {
    // 1. Tìm các đơn đặt sân PENDING_PAYMENT có expiresAt quá khứ
    const expiredBookings = await tx.booking.findMany({
      where: {
        status: "PENDING_PAYMENT",
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        code: true,
        voucherId: true,
        group: { select: { id: true, closedAt: true } },
      },
      take: 100, // Batch an toàn tránh lock quá lâu
    });

    if (expiredBookings.length === 0) {
      return {
        expiredBookingsCount: 0,
        releasedItemsCount: 0,
        releasedCoachBookingsCount: 0,
        releasedOfferUsagesCount: 0,
      };
    }

    const bookingIds = expiredBookings.map((b) => b.id);

    // 2. Chuyển trạng thái BookingItem từ HELD sang EXPIRED
    const itemsResult = await tx.bookingItem.updateMany({
      where: {
        bookingId: { in: bookingIds },
        status: "HELD",
      },
      data: {
        status: "EXPIRED",
      },
    });

    // 3. Giải phóng CoachBooking nếu có
    const coachResult = await tx.coachBooking.updateMany({
      where: {
        bookingItem: {
          bookingId: { in: bookingIds },
        },
        status: "HELD",
      },
      data: {
        status: "CANCELLED",
      },
    });

    // 4. Giải phóng ngân sách ưu đãi đối tác / voucher (OfferUsage: RESERVED -> RELEASED)
    const offerResult = await tx.offerUsage.updateMany({
      where: {
        bookingId: { in: bookingIds },
        state: "RESERVED",
      },
      data: {
        state: "RELEASED",
        expiresAt: null,
      },
    });

    // 5. Cập nhật trạng thái Booking sang EXPIRED
    const bookingsResult = await tx.booking.updateMany({
      where: {
        id: { in: bookingIds },
        status: "PENDING_PAYMENT", // Đảm bảo không ghi đè nếu vừa thanh toán thành công
      },
      data: {
        status: "EXPIRED",
      },
    });

    return {
      expiredBookingsCount: bookingsResult.count,
      releasedItemsCount: itemsResult.count,
      releasedCoachBookingsCount: coachResult.count,
      releasedOfferUsagesCount: offerResult.count,
    };
  });
}
