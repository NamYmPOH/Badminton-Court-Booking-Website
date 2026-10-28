import { PrismaClient, CourtStatus } from "@prisma/client";
import { PaymentError } from "../lib/sepay";
import { serializable } from "../lib/transaction";

export interface CreateCourtInput {
  venueId: string;
  name: string;
  surface?: string | null;
  sortOrder?: number;
}

export interface UpdateCourtInput {
  courtId: string;
  name?: string;
  surface?: string | null;
  status?: CourtStatus;
  sortOrder?: number;
}

export interface UpsertPricingRuleInput {
  id?: string;
  venueId: string;
  label?: string | null;
  daysOfWeek: number[]; // 1=T2 .. 7=CN
  startMin: number;
  endMin: number;
  walkInPrice: number;
  fixedPrice?: number;
}

export interface CreateCourtBlockInput {
  courtId: string;
  date: string; // YYYY-MM-DD
  startMin: number;
  endMin: number;
  reason?: string | null;
}

/**
 * Kiểm tra quyền quản lý sân (chỉ OWNER cơ sở hoặc ADMIN)
 */
async function assertCourtManagementAccess(
  tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
  actor: { id: string; role: string; status: string },
  venueId: string
) {
  if (actor.status !== "ACTIVE") {
    throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
  }

  if (actor.role === "ADMIN") return;

  if (actor.role === "OWNER") {
    const venue = await tx.venue.findFirst({
      where: { id: venueId, ownerId: actor.id },
      select: { id: true, status: true },
    });
    if (!venue) {
      throw new PaymentError(403, "Bạn không phải chủ sở hữu của cơ sở này.");
    }
    return;
  }

  throw new PaymentError(403, "Nhân viên không có quyền thay đổi sân con, bảng giá hoặc khóa khung giờ.");
}

/**
 * Lấy danh sách sân con, bảng giá và khung giờ khóa của cơ sở
 */
export async function getVenueCourtsAndPricing(
  db: PrismaClient,
  actor: { id: string; role: string; status: string },
  venueId: string,
  targetDate?: string // YYYY-MM-DD
) {
  const venue = await db.venue.findUnique({
    where: { id: venueId },
    select: { id: true, name: true, ownerId: true, status: true },
  });
  if (!venue) throw new PaymentError(404, "Không tìm thấy cơ sở.");

  // Cho phép STAFF, OWNER, ADMIN xem để phục vụ vận hành
  if (actor.role !== "ADMIN" && venue.ownerId !== actor.id) {
    const staff = await db.venueStaff.findFirst({
      where: { userId: actor.id, venueId, isActive: true },
    });
    if (!staff) throw new PaymentError(403, "Bạn không có quyền truy cập cơ sở này.");
  }

  const courts = await db.court.findMany({
    where: { venueId },
    orderBy: { sortOrder: "asc" },
  });

  const pricingRules = await db.pricingRule.findMany({
    where: { venueId },
    orderBy: [{ startMin: "asc" }, { endMin: "asc" }],
  });

  const queryDate = targetDate ? new Date(`${targetDate}T00:00:00.000Z`) : new Date();
  queryDate.setUTCHours(0, 0, 0, 0);

  const courtBlocks = await db.courtBlock.findMany({
    where: {
      court: { venueId },
      date: { gte: queryDate },
    },
    include: { court: { select: { id: true, name: true } } },
    orderBy: [{ date: "asc" }, { startMin: "asc" }],
  });

  return {
    venue,
    courts,
    pricingRules,
    courtBlocks: courtBlocks.map((b) => ({
      id: b.id,
      courtId: b.courtId,
      courtName: b.court.name,
      date: b.date.toISOString().split("T")[0],
      startMin: b.startMin,
      endMin: b.endMin,
      reason: b.reason,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

/**
 * Thêm sân con mới
 */
export async function createCourt(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  input: CreateCourtInput
) {
  return serializable(db, async (tx) => {
    await assertCourtManagementAccess(tx, actor, input.venueId);

    const existing = await tx.court.findFirst({
      where: { venueId: input.venueId, name: input.name.trim() },
    });
    if (existing) {
      throw new PaymentError(409, `Tên sân "${input.name}" đã tồn tại tại cơ sở này.`);
    }

    const maxSort = await tx.court.aggregate({
      where: { venueId: input.venueId },
      _max: { sortOrder: true },
    });
    const nextSort = (maxSort._max.sortOrder ?? 0) + 1;

    const court = await tx.court.create({
      data: {
        venueId: input.venueId,
        name: input.name.trim(),
        surface: input.surface?.trim() || null,
        sortOrder: input.sortOrder ?? nextSort,
        status: "ACTIVE",
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "CREATE_COURT",
        entityId: court.id,
        reason: `Tạo sân con mới: ${court.name}`,
        details: { venueId: input.venueId, name: court.name },
      },
    });

    return { success: true, court };
  });
}

/**
 * Cập nhật sân con (đổi tên, trạng thái, bề mặt)
 */
export async function updateCourt(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  input: UpdateCourtInput
) {
  return serializable(db, async (tx) => {
    const court = await tx.court.findUnique({
      where: { id: input.courtId },
      include: { venue: { select: { id: true, ownerId: true } } },
    });
    if (!court) throw new PaymentError(404, "Không tìm thấy sân con.");

    await assertCourtManagementAccess(tx, actor, court.venueId);

    // Nếu chuyển sang MAINTENANCE hoặc INACTIVE, kiểm tra xem có đơn đặt tương lai không
    if (input.status && input.status !== "ACTIVE" && court.status === "ACTIVE") {
      const now = new Date();
      const futureBookings = await tx.bookingItem.findMany({
        where: {
          courtId: court.id,
          date: { gte: new Date(now.toISOString().split("T")[0]) },
          status: { in: ["HELD", "CONFIRMED"] },
          booking: {
            OR: [
              { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
              { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
            ],
          },
        },
        include: { booking: { select: { code: true, customerName: true, customerPhone: true } } },
        take: 5,
      });

      if (futureBookings.length > 0) {
        const codes = futureBookings.map((b) => b.booking.code).join(", ");
        throw new PaymentError(
          409,
          `Không thể ngừng hoạt động sân ${court.name} vì đang có ${futureBookings.length} đơn đặt sắp diễn ra (${codes}...). Vui lòng liên hệ khách hoặc dời lịch trước.`
        );
      }
    }

    const updated = await tx.court.update({
      where: { id: court.id },
      data: {
        name: input.name ? input.name.trim() : court.name,
        surface: input.surface !== undefined ? input.surface?.trim() || null : court.surface,
        status: input.status ?? court.status,
        sortOrder: input.sortOrder ?? court.sortOrder,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "UPDATE_COURT",
        entityId: court.id,
        reason: `Cập nhật thông tin sân con: ${updated.name}`,
        details: { before: { status: court.status }, after: { status: updated.status } },
      },
    });

    return { success: true, court: updated };
  });
}

/**
 * Xóa hoặc ẩn sân con (bảo vệ lịch sử đặt)
 */
export async function deleteCourt(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  courtId: string
) {
  return serializable(db, async (tx) => {
    const court = await tx.court.findUnique({
      where: { id: courtId },
      include: {
        _count: { select: { items: true } },
      },
    });
    if (!court) throw new PaymentError(404, "Không tìm thấy sân con.");

    await assertCourtManagementAccess(tx, actor, court.venueId);

    // Không xóa dữ liệu sân làm mất lịch sử đặt. Nếu đã có đơn từng đặt, chỉ cho phép đổi sang INACTIVE
    if (court._count.items > 0) {
      await tx.court.update({
        where: { id: court.id },
        data: { status: "INACTIVE" },
      });
      return { success: true, message: "Sân đã có lịch sử đặt nên đã được chuyển sang trạng thái Ngừng hoạt động (INACTIVE) để bảo toàn dữ liệu." };
    }

    await tx.court.delete({ where: { id: court.id } });
    return { success: true, message: "Đã xóa sân con thành công." };
  });
}

/**
 * Lưu quy tắc bảng giá (PricingRule)
 */
export async function upsertPricingRule(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  input: UpsertPricingRuleInput
) {
  return serializable(db, async (tx) => {
    await assertCourtManagementAccess(tx, actor, input.venueId);

    if (input.startMin >= input.endMin) {
      throw new PaymentError(400, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
    }
    if (input.walkInPrice <= 0) {
      throw new PaymentError(400, "Giá thuê phải lớn hơn 0.");
    }

    let rule;
    if (input.id) {
      rule = await tx.pricingRule.update({
        where: { id: input.id },
        data: {
          label: input.label?.trim() || null,
          daysOfWeek: input.daysOfWeek,
          startMin: input.startMin,
          endMin: input.endMin,
          walkInPrice: input.walkInPrice,
          fixedPrice: input.fixedPrice ?? input.walkInPrice,
        },
      });
    } else {
      rule = await tx.pricingRule.create({
        data: {
          venueId: input.venueId,
          label: input.label?.trim() || null,
          daysOfWeek: input.daysOfWeek,
          startMin: input.startMin,
          endMin: input.endMin,
          walkInPrice: input.walkInPrice,
          fixedPrice: input.fixedPrice ?? input.walkInPrice,
        },
      });
    }

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "UPSERT_PRICING",
        entityId: rule.id,
        reason: `Cập nhật bảng giá cho cơ sở (${rule.walkInPrice.toLocaleString("vi-VN")} đ/giờ)`,
        details: { venueId: input.venueId, startMin: input.startMin, endMin: input.endMin },
      },
    });

    return { success: true, rule };
  });
}

/**
 * Xóa quy tắc bảng giá
 */
export async function deletePricingRule(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  pricingRuleId: string
) {
  return serializable(db, async (tx) => {
    const rule = await tx.pricingRule.findUnique({
      where: { id: pricingRuleId },
    });
    if (!rule) throw new PaymentError(404, "Không tìm thấy quy tắc giá.");

    await assertCourtManagementAccess(tx, actor, rule.venueId);

    await tx.pricingRule.delete({ where: { id: pricingRuleId } });
    return { success: true };
  });
}

/**
 * Khóa khung giờ (CourtBlock)
 */
export async function createCourtBlock(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  input: CreateCourtBlockInput
) {
  return serializable(db, async (tx) => {
    const court = await tx.court.findUnique({
      where: { id: input.courtId },
      include: { venue: true },
    });
    if (!court) throw new PaymentError(404, "Không tìm thấy sân con.");

    await assertCourtManagementAccess(tx, actor, court.venueId);

    if (input.startMin >= input.endMin) {
      throw new PaymentError(400, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
    }

    const dateObj = new Date(`${input.date}T00:00:00.000Z`);
    const now = new Date();

    // 1. Kiểm tra xem có đơn đặt sân nào đang tồn tại trong khung giờ này không
    const conflictBooking = await tx.bookingItem.findFirst({
      where: {
        courtId: court.id,
        date: dateObj,
        startMin: { lt: input.endMin },
        endMin: { gt: input.startMin },
        status: { in: ["HELD", "CONFIRMED"] },
        booking: {
          OR: [
            { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED"] } },
            { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
          ],
        },
      },
      include: { booking: { select: { code: true, customerName: true } } },
    });

    if (conflictBooking) {
      throw new PaymentError(
        409,
        `Khung giờ này đã có đơn đặt (${conflictBooking.booking.code} - ${conflictBooking.booking.customerName}). Không thể khóa khung giờ khi đang có đơn.`
      );
    }

    // 2. Kiểm tra xem đã bị khóa chưa
    const existingBlock = await tx.courtBlock.findFirst({
      where: {
        courtId: court.id,
        date: dateObj,
        startMin: { lt: input.endMin },
        endMin: { gt: input.startMin },
      },
    });
    if (existingBlock) {
      throw new PaymentError(409, "Khung giờ này đã có lịch khóa trước đó.");
    }

    const block = await tx.courtBlock.create({
      data: {
        courtId: court.id,
        date: dateObj,
        startMin: input.startMin,
        endMin: input.endMin,
        reason: input.reason?.trim() || "Chủ sân khóa khung giờ",
        createdById: actor.id,
      },
    });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "LOCK_COURT_SLOT",
        entityId: block.id,
        reason: `Khóa khung giờ sân ${court.name} ngày ${input.date}`,
        details: { courtId: court.id, date: input.date, startMin: input.startMin, endMin: input.endMin },
      },
    });

    return { success: true, block };
  });
}

/**
 * Mở khóa khung giờ (Xóa CourtBlock)
 */
export async function deleteCourtBlock(
  db: PrismaClient,
  actor: { id: string; role: string; status: string; name: string },
  courtBlockId: string
) {
  return serializable(db, async (tx) => {
    const block = await tx.courtBlock.findUnique({
      where: { id: courtBlockId },
      include: { court: { select: { venueId: true, name: true } } },
    });
    if (!block) throw new PaymentError(404, "Không tìm thấy khung giờ khóa.");

    await assertCourtManagementAccess(tx, actor, block.court.venueId);

    await tx.courtBlock.delete({ where: { id: courtBlockId } });

    await tx.adminAudit.create({
      data: {
        actorId: actor.id,
        actorName: actor.name,
        action: "UNLOCK_COURT_SLOT",
        entityId: courtBlockId,
        reason: `Mở khóa khung giờ sân ${block.court.name}`,
        details: { courtBlockId },
      },
    });

    return { success: true };
  });
}
