import { Prisma, type PrismaClient } from "@prisma/client";
import { PaymentError } from "../lib/sepay";

export interface EffectiveHoursResult {
  isOpen: boolean;
  openMin: number;
  closeMin: number;
  source: "EXCEPTION" | "WEEKLY" | "DEFAULT";
  reason?: string;
}

/**
 * Lấy giờ hoạt động thực tế có hiệu lực của một cơ sở vào ngày cụ thể.
 * Thứ tự ưu tiên: Ngoại lệ ngày (EXCEPTION) > Lịch tuần theo thứ (WEEKLY) > Giờ mặc định (DEFAULT).
 */
export async function getVenueEffectiveHours(
  db: PrismaClient | Prisma.TransactionClient,
  venueId: string,
  dateString: string
): Promise<EffectiveHoursResult> {
  const venue = await db.venue.findUnique({
    where: { id: venueId },
    select: { id: true, openMin: true, closeMin: true },
  });

  if (!venue) {
    throw new PaymentError(404, "Không tìm thấy cơ sở thể thao.");
  }

  // 1. Kiểm tra ngoại lệ theo ngày cụ thể (DateException)
  const exception = await db.venueDateException.findUnique({
    where: { venueId_date: { venueId, date: dateString } },
  });

  if (exception) {
    if (exception.isClosed) {
      return {
        isOpen: false,
        openMin: 0,
        closeMin: 0,
        source: "EXCEPTION",
        reason: exception.reason || "Cơ sở tạm nghỉ theo lịch ngoại lệ.",
      };
    }
    return {
      isOpen: true,
      openMin: exception.openMin ?? venue.openMin,
      closeMin: exception.closeMin ?? venue.closeMin,
      source: "EXCEPTION",
      reason: exception.reason || undefined,
    };
  }

  // 2. Kiểm tra lịch theo thứ trong tuần (WeeklySchedule)
  const targetDate = new Date(`${dateString}T00:00:00Z`);
  const dayOfWeek = targetDate.getUTCDay() || 7; // 1 = Thứ 2 ... 7 = Chủ nhật

  const weekly = await db.venueWeeklySchedule.findUnique({
    where: { venueId_dayOfWeek: { venueId, dayOfWeek } },
  });

  if (weekly) {
    if (weekly.isClosed) {
      return {
        isOpen: false,
        openMin: 0,
        closeMin: 0,
        source: "WEEKLY",
        reason: `Cơ sở nghỉ định kỳ vào Thứ ${dayOfWeek === 7 ? "Chủ nhật" : dayOfWeek + 1}.`,
      };
    }
    return {
      isOpen: true,
      openMin: weekly.openMin,
      closeMin: weekly.closeMin,
      source: "WEEKLY",
    };
  }

  // 3. Fallback về giờ mặc định của Venue
  return {
    isOpen: true,
    openMin: venue.openMin,
    closeMin: venue.closeMin,
    source: "DEFAULT",
  };
}

/**
 * Kiểm tra xem thay đổi giờ hoạt động hoặc tạm đóng cửa có ảnh hưởng đến các đơn đặt sân hiện hữu không.
 * Ngăn chặn việc tự động hủy hoặc làm sai lệch các đơn đã thanh toán.
 */
export async function checkScheduleConflictWithBookings(
  tx: Prisma.TransactionClient | PrismaClient,
  venueId: string,
  options: {
    date?: string;
    dayOfWeek?: number;
    newOpenMin?: number;
    newCloseMin?: number;
    isClosed?: boolean;
  }
) {
  const now = new Date();

  // Tìm các booking items tương lai thuộc cơ sở
  const items = await tx.bookingItem.findMany({
    where: {
      booking: {
        venueId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
      status: { in: ["HELD", "CONFIRMED"] },
    },
    include: {
      booking: {
        select: { id: true, code: true, customerName: true, customerPhone: true, paymentStatus: true },
      },
      court: { select: { name: true } },
    },
  });

  const conflicts = items.filter((item) => {
    const itemDateStr =
      item.date instanceof Date ? item.date.toISOString().slice(0, 10) : String(item.date).slice(0, 10);

    // Nếu kiểm tra theo ngày cụ thể
    if (options.date && itemDateStr !== options.date) {
      return false;
    }

    // Nếu kiểm tra theo thứ
    if (options.dayOfWeek) {
      const d = new Date(`${itemDateStr}T00:00:00Z`);
      const dow = d.getUTCDay() || 7;
      if (dow !== options.dayOfWeek) return false;
    }

    // Bị đóng cửa
    if (options.isClosed) return true;

    // Nằm ngoài khung giờ mở/đóng mới
    if (options.newOpenMin !== undefined && item.startMin < options.newOpenMin) return true;
    if (options.newCloseMin !== undefined && item.endMin > options.newCloseMin) return true;

    return false;
  });

  return conflicts;
}

/**
 * Cập nhật hoặc thiết lập lịch hoạt động tuần
 */
export async function setWeeklySchedule(
  tx: Prisma.TransactionClient | PrismaClient,
  venueId: string,
  schedules: {
    dayOfWeek: number;
    openMin: number;
    closeMin: number;
    isClosed?: boolean;
  }[]
) {
  const results = [];

  for (const s of schedules) {
    if (s.dayOfWeek < 1 || s.dayOfWeek > 7) {
      throw new PaymentError(400, "Ngày trong tuần phải từ 1 (Thứ 2) đến 7 (Chủ nhật).");
    }
    if (!s.isClosed && s.openMin >= s.closeMin) {
      throw new PaymentError(400, "Giờ mở cửa phải trước giờ đóng cửa.");
    }

    // Kiểm tra xung đột với đơn đã thanh toán
    const conflicts = await checkScheduleConflictWithBookings(tx, venueId, {
      dayOfWeek: s.dayOfWeek,
      newOpenMin: s.openMin,
      newCloseMin: s.closeMin,
      isClosed: s.isClosed,
    });

    if (conflicts.length > 0) {
      const codes = Array.from(new Set(conflicts.map((c) => c.booking.code))).join(", ");
      throw new PaymentError(
        409,
        `Không thể đổi lịch Thứ ${s.dayOfWeek === 7 ? "CN" : s.dayOfWeek + 1}: Có ${conflicts.length} lượt đặt đã xác nhận bị ảnh hưởng (${codes}). Vui lòng xử lý đơn trước.`
      );
    }

    const item = await tx.venueWeeklySchedule.upsert({
      where: { venueId_dayOfWeek: { venueId, dayOfWeek: s.dayOfWeek } },
      create: {
        venueId,
        dayOfWeek: s.dayOfWeek,
        openMin: s.openMin,
        closeMin: s.closeMin,
        isClosed: s.isClosed ?? false,
      },
      update: {
        openMin: s.openMin,
        closeMin: s.closeMin,
        isClosed: s.isClosed ?? false,
      },
    });

    results.push(item);
  }

  return results;
}

/**
 * Cập nhật hoặc thiết lập ngày nghỉ/ngoại lệ
 */
export async function setDateException(
  tx: Prisma.TransactionClient | PrismaClient,
  venueId: string,
  input: {
    date: string;
    isClosed: boolean;
    openMin?: number;
    closeMin?: number;
    reason?: string;
  }
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new PaymentError(400, "Định dạng ngày không hợp lệ (YYYY-MM-DD).");
  }

  if (!input.isClosed && input.openMin !== undefined && input.closeMin !== undefined) {
    if (input.openMin >= input.closeMin) {
      throw new PaymentError(400, "Giờ mở cửa ngoại lệ phải trước giờ đóng cửa.");
    }
  }

  // Kiểm tra xung đột với đơn đã đặt
  const conflicts = await checkScheduleConflictWithBookings(tx, venueId, {
    date: input.date,
    newOpenMin: input.openMin,
    newCloseMin: input.closeMin,
    isClosed: input.isClosed,
  });

  if (conflicts.length > 0) {
    const codes = Array.from(new Set(conflicts.map((c) => c.booking.code))).join(", ");
    throw new PaymentError(
      409,
      `Không thể đặt lịch ngoại lệ ngày ${input.date}: Có ${conflicts.length} lượt đặt đã xác nhận bị ảnh hưởng (${codes}). Vui lòng liên hệ người đặt để xử lý trước.`
    );
  }

  return tx.venueDateException.upsert({
    where: { venueId_date: { venueId, date: input.date } },
    create: {
      venueId,
      date: input.date,
      isClosed: input.isClosed,
      openMin: input.openMin,
      closeMin: input.closeMin,
      reason: input.reason,
    },
    update: {
      isClosed: input.isClosed,
      openMin: input.openMin,
      closeMin: input.closeMin,
      reason: input.reason,
    },
  });
}
