import { Prisma, type PrismaClient, type CourtStatus } from "@prisma/client";
import { PaymentError } from "../lib/sepay";
import { serializable } from "./sepay.service";

export interface CourtDetail {
  id: string;
  venueId: string;
  name: string;
  sortOrder: number;
  surface: string | null;
  status: CourtStatus;
  description: string | null;
  positionRow: number;
  positionCol: number;
  orientation: "HORIZONTAL" | "VERTICAL";
  hasCustomPricing: boolean;
  activeBookingsCount: number;
  totalBookingsCount: number;
}

export interface CreateCourtInput {
  venueId: string;
  name: string;
  description?: string | null;
  surface?: string | null;
  sortOrder?: number;
  positionRow?: number;
  positionCol?: number;
  orientation?: "HORIZONTAL" | "VERTICAL";
}

export interface UpdateCourtInput {
  name?: string;
  description?: string | null;
  surface?: string | null;
  status?: CourtStatus;
  sortOrder?: number;
  positionRow?: number;
  positionCol?: number;
  orientation?: "HORIZONTAL" | "VERTICAL";
}

export interface CourtLayoutItem {
  courtId: string;
  positionRow: number;
  positionCol: number;
  orientation?: "HORIZONTAL" | "VERTICAL";
  sortOrder?: number;
}

/**
 * Kiểm tra quyền quản lý cơ sở của tài khoản operator.
 * Chỉ OWNER của cơ sở hoặc ADMIN hệ thống mới có quyền thay đổi cấu trúc sân.
 */
export async function assertVenueManagePermission(
  tx: Prisma.TransactionClient | PrismaClient,
  operatorId: string,
  venueId: string
): Promise<{ id: string; name: string; ownerId: string }> {
  const operator = await tx.user.findUnique({
    where: { id: operatorId },
    select: { id: true, role: true, status: true },
  });

  if (!operator || operator.status !== "ACTIVE") {
    throw new PaymentError(403, "Tài khoản không hoạt động hoặc không tồn tại.");
  }

  const venue = await tx.venue.findUnique({
    where: { id: venueId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!venue) {
    throw new PaymentError(404, "Không tìm thấy cơ sở thể thao.");
  }

  if (operator.role === "ADMIN") {
    return venue;
  }

  if (operator.role === "OWNER" && venue.ownerId === operator.id) {
    return venue;
  }

  throw new PaymentError(403, "Bạn không có quyền quản lý sân tại cơ sở này.");
}

/**
 * Lấy danh sách sân con của một cơ sở với thông tin bố cục và biểu giá.
 */
export async function getVenueCourts(
  db: PrismaClient,
  operatorId: string,
  venueId: string
): Promise<CourtDetail[]> {
  await assertVenueManagePermission(db, operatorId, venueId);
  const now = new Date();

  const courts = await db.court.findMany({
    where: { venueId },
    include: {
      pricingRules: { select: { id: true } },
      items: {
        where: {
          status: { in: ["HELD", "CONFIRMED"] },
          booking: {
            OR: [
              { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
              { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
            ],
          },
        },
        select: { id: true },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return courts.map((c, index) => {
    // Fallback bố cục mặc định nếu chưa được cấu hình
    const defaultRow = Math.floor(index / 3) + 1;
    const defaultCol = (index % 3) + 1;

    return {
      id: c.id,
      venueId: c.venueId,
      name: c.name,
      sortOrder: c.sortOrder,
      surface: c.surface,
      status: c.status,
      description: c.description,
      positionRow: c.positionRow && c.positionRow > 0 ? c.positionRow : defaultRow,
      positionCol: c.positionCol && c.positionCol > 0 ? c.positionCol : defaultCol,
      orientation: c.orientation === "VERTICAL" ? "VERTICAL" : "HORIZONTAL",
      hasCustomPricing: c.pricingRules.length > 0,
      activeBookingsCount: c.items.length,
      totalBookingsCount: c._count.items,
    };
  });
}

/**
 * Thêm sân con mới vào cơ sở.
 */
export async function createCourt(
  db: PrismaClient,
  operatorId: string,
  input: CreateCourtInput
) {
  return serializable(db, async (tx) => {
    await assertVenueManagePermission(tx, operatorId, input.venueId);

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new PaymentError(400, "Tên sân không được để trống.");
    }

    // 1. Kiểm tra trùng tên sân trong cùng cơ sở
    const existingName = await tx.court.findUnique({
      where: { venueId_name: { venueId: input.venueId, name: trimmedName } },
    });
    if (existingName) {
      throw new PaymentError(409, `Tên "${trimmedName}" đã tồn tại trong cơ sở này.`);
    }

    // 2. Tự động tính thứ tự sortOrder nếu không truyền
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const maxOrder = await tx.court.aggregate({
        where: { venueId: input.venueId },
        _max: { sortOrder: true },
      });
      sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;
    }

    // 3. Kiểm tra vị trí sơ đồ nếu được chỉ định
    const row = input.positionRow ?? 1;
    const col = input.positionCol ?? 1;
    if (row < 1 || col < 1) {
      throw new PaymentError(400, "Vị trí hàng và cột trên sơ đồ phải lớn hơn hoặc bằng 1.");
    }

    const collision = await tx.court.findFirst({
      where: {
        venueId: input.venueId,
        positionRow: row,
        positionCol: col,
        status: { not: "INACTIVE" },
      },
    });
    if (collision) {
      throw new PaymentError(409, `Vị trí hàng ${row}, cột ${col} đã có ${collision.name}. Vui lòng chọn vị trí khác.`);
    }

    return tx.court.create({
      data: {
        venueId: input.venueId,
        name: trimmedName,
        description: input.description?.trim() || null,
        surface: input.surface?.trim() || "Thảm PVC tiêu chuẩn",
        sortOrder,
        positionRow: row,
        positionCol: col,
        orientation: input.orientation === "VERTICAL" ? "VERTICAL" : "HORIZONTAL",
        status: "ACTIVE",
      },
    });
  });
}

/**
 * Cập nhật thông tin sân con hoặc trạng thái hoạt động / bảo trì.
 */
export async function updateCourt(
  db: PrismaClient,
  operatorId: string,
  courtId: string,
  input: UpdateCourtInput
) {
  return serializable(db, async (tx) => {
    const court = await tx.court.findUnique({
      where: { id: courtId },
      select: { id: true, venueId: true, name: true, status: true, positionRow: true, positionCol: true },
    });
    if (!court) {
      throw new PaymentError(404, "Không tìm thấy sân con.");
    }

    // Kiểm tra quyền sở hữu cơ sở
    await assertVenueManagePermission(tx, operatorId, court.venueId);

    const now = new Date();

    // 1. Kiểm tra nếu đổi tên sân -> không trùng trong cùng cơ sở
    if (input.name && input.name.trim() !== court.name) {
      const trimmed = input.name.trim();
      const existingName = await tx.court.findUnique({
        where: { venueId_name: { venueId: court.venueId, name: trimmed } },
      });
      if (existingName) {
        throw new PaymentError(409, `Tên "${trimmed}" đã được sử dụng cho một sân khác trong cơ sở.`);
      }
    }

    // 2. Kiểm tra nếu chuyển sang MAINTENANCE hoặc INACTIVE -> chặn nếu còn lịch đặt hiệu lực
    if (input.status && input.status !== court.status && ["MAINTENANCE", "INACTIVE"].includes(input.status)) {
      const activeBookingsCount = await tx.bookingItem.count({
        where: {
          courtId: court.id,
          status: { in: ["HELD", "CONFIRMED"] },
          booking: {
            OR: [
              { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
              { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
            ],
          },
        },
      });

      if (activeBookingsCount > 0) {
        const actionText = input.status === "MAINTENANCE" ? "tạm ngừng hoạt động / bảo trì" : "ngừng hoạt động";
        throw new PaymentError(
          409,
          `Không thể ${actionText} sân này vì đang có ${activeBookingsCount} lịch đặt còn hiệu lực. Vui lòng xử lý các đơn đặt sân trước.`
        );
      }
    }

    // 3. Kiểm tra vị trí sơ đồ nếu thay đổi
    const nextRow = input.positionRow ?? court.positionRow ?? 1;
    const nextCol = input.positionCol ?? court.positionCol ?? 1;
    if (nextRow < 1 || nextCol < 1) {
      throw new PaymentError(400, "Vị trí hàng và cột trên sơ đồ phải lớn hơn hoặc bằng 1.");
    }

    if (input.positionRow !== undefined || input.positionCol !== undefined) {
      const collision = await tx.court.findFirst({
        where: {
          venueId: court.venueId,
          positionRow: nextRow,
          positionCol: nextCol,
          id: { not: court.id },
          status: { not: "INACTIVE" },
        },
      });
      if (collision) {
        throw new PaymentError(409, `Vị trí hàng ${nextRow}, cột ${nextCol} đã có ${collision.name}. Vui lòng chọn vị trí khác.`);
      }
    }

    return tx.court.update({
      where: { id: court.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
        ...(input.surface !== undefined ? { surface: input.surface?.trim() || null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.positionRow !== undefined ? { positionRow: input.positionRow } : {}),
        ...(input.positionCol !== undefined ? { positionCol: input.positionCol } : {}),
        ...(input.orientation !== undefined ? { orientation: input.orientation } : {}),
      },
    });
  });
}

/**
 * Xóa sân con:
 * - Nếu sân đã có lịch sử đặt (BookingItem) -> TỪ CHỐI XÓA, bắt buộc chuyển sang lưu trữ (INACTIVE).
 * - Nếu sân chưa từng có lịch sử -> Cho phép xóa hoàn toàn.
 */
export async function deleteCourt(
  db: PrismaClient,
  operatorId: string,
  courtId: string
) {
  return serializable(db, async (tx) => {
    const court = await tx.court.findUnique({
      where: { id: courtId },
      select: { id: true, venueId: true, name: true },
    });
    if (!court) {
      throw new PaymentError(404, "Không tìm thấy sân con cần xóa.");
    }

    // Kiểm tra quyền sở hữu
    await assertVenueManagePermission(tx, operatorId, court.venueId);

    // 1. Kiểm tra lịch sử đặt sân
    const totalBookings = await tx.bookingItem.count({
      where: { courtId: court.id },
    });

    if (totalBookings > 0) {
      throw new PaymentError(
        409,
        `Sân "${court.name}" đã có ${totalBookings} lượt đặt trong lịch sử. Để bảo toàn dữ liệu và kế toán, sân không thể bị xóa vĩnh viễn. Vui lòng chuyển trạng thái sân sang "Lưu trữ / Ngừng hoạt động".`
      );
    }

    // 2. Kiểm tra xem có phiên hoạt động hoặc chặn lịch không
    const activeBlocks = await tx.courtBlock.count({ where: { courtId: court.id } });
    if (activeBlocks > 0) {
      await tx.courtBlock.deleteMany({ where: { courtId: court.id } });
    }

    const activeSessions = await tx.courtSession.count({ where: { courtId: court.id } });
    if (activeSessions > 0) {
      throw new PaymentError(409, `Sân "${court.name}" có dữ liệu phiên sử dụng, không thể xóa.`);
    }

    // Xóa các biểu giá riêng của sân nếu có
    await tx.pricingRule.deleteMany({ where: { courtId: court.id } });

    // Xóa sân
    await tx.court.delete({ where: { id: court.id } });

    return { success: true, message: `Đã xóa sân "${court.name}" thành công.` };
  });
}

/**
 * Lưu bố cục sơ đồ toàn bộ sân trong cơ sở (Batch Layout Update).
 * Kiểm tra chống chồng lấn vị trí các sân.
 */
export async function saveVenueCourtLayout(
  db: PrismaClient,
  operatorId: string,
  venueId: string,
  layoutItems: CourtLayoutItem[]
) {
  return serializable(db, async (tx) => {
    await assertVenueManagePermission(tx, operatorId, venueId);

    if (!Array.isArray(layoutItems) || layoutItems.length === 0) {
      throw new PaymentError(400, "Danh sách bố cục sân không hợp lệ.");
    }

    // 1. Kiểm tra trùng lặp vị trí giữa các sân trong layout gửi lên
    const positionOccupancy = new Map<string, string>();
    for (const item of layoutItems) {
      if (!item.courtId) throw new PaymentError(400, "Thiếu ID sân trong danh sách bố cục.");
      if (item.positionRow < 1 || item.positionCol < 1) {
        throw new PaymentError(400, "Vị trí hàng và cột phải lớn hơn hoặc bằng 1.");
      }

      const key = `${item.positionRow}_${item.positionCol}`;
      if (positionOccupancy.has(key)) {
        throw new PaymentError(
          409,
          `Vị trí hàng ${item.positionRow}, cột ${item.positionCol} bị xếp trùng cho nhiều hơn một sân. Vui lòng xếp mỗi sân vào một ô riêng.`
        );
      }
      positionOccupancy.set(key, item.courtId);
    }

    // 2. Đảm bảo tất cả các sân trong layout đều thuộc cơ sở này
    const courtIds = layoutItems.map((i) => i.courtId);
    const existingCourts = await tx.court.findMany({
      where: { id: { in: courtIds }, venueId },
      select: { id: true, name: true },
    });

    if (existingCourts.length !== courtIds.length) {
      throw new PaymentError(400, "Một số sân không thuộc cơ sở đang cấu hình.");
    }

    // 3. Cập nhật vị trí và hướng xoay cho từng sân trong transaction
    for (const item of layoutItems) {
      await tx.court.update({
        where: { id: item.courtId },
        data: {
          positionRow: item.positionRow,
          positionCol: item.positionCol,
          ...(item.orientation ? { orientation: item.orientation } : {}),
          ...(item.sortOrder !== undefined ? { sortOrder: item.sortOrder } : {}),
        },
      });
    }

    return {
      success: true,
      updatedCount: layoutItems.length,
      message: "Đã lưu bố cục sơ đồ sân thành công.",
    };
  });
}
