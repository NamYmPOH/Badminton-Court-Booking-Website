import type { Prisma } from "@prisma/client";

export interface SettlementMockClient {
  booking?: unknown;
  bookingItem?: unknown;
  coachBooking?: unknown;
  offerUsage?: unknown;
  partnerOffer?: unknown;
  voucher?: unknown;
  voucherUsage?: unknown;
  adminAudit?: unknown;
  groupPaymentIntent?: unknown;
}

export type SettlementTransactionContext = Prisma.TransactionClient | SettlementMockClient;

interface SafeTx {
  booking?: {
    update?: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
    updateMany?: (args: Record<string, unknown>) => Promise<{ count: number }>;
  };
  bookingItem?: {
    updateMany?: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
  coachBooking?: {
    updateMany?: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
  offerUsage?: {
    findMany?: (args: Record<string, unknown>) => Promise<Array<{ id: string; offerId: string; discountAmount: number }>>;
    update?: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
    updateMany?: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
  partnerOffer?: {
    update?: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
  voucher?: {
    update?: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
  voucherUsage?: {
    create?: (args: { data: { voucherId: string; bookingId: string } }) => Promise<unknown>;
    findUnique?: (args: { where: { voucherId_bookingId: { voucherId: string; bookingId: string } } }) => Promise<unknown>;
  };
  adminAudit?: {
    findFirst?: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    create?: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  groupPaymentIntent?: {
    updateMany?: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
}

function asSafeTx(tx: SettlementTransactionContext): SafeTx {
  return tx as unknown as SafeTx;
}

export interface VoucherConsumptionResult {
  recorded: boolean;
  reason:
    | "NO_VOUCHER"
    | "OFFER_USAGE_CONSUMED"
    | "VOUCHER_USAGE_CREATED"
    | "VOUCHER_AUDIT_RECORDED"
    | "ALREADY_RECORDED"
    | "NO_VOUCHER_CLIENT";
}

const inMemoryVoucherRecordings = new Set<string>();

/**
 * Ghi nhận việc sử dụng voucher một cách bền vững và idempotent.
 * Đảm bảo usedCount chỉ tăng đúng 1 lần cho cặp (bookingId, voucherId)
 * thông qua bảng VoucherUsage (có UNIQUE constraint) hoặc AdminAudit marker dự phòng.
 */
export async function recordVoucherConsumption(
  tx: SettlementTransactionContext,
  bookingId: string,
  voucherId: string | null | undefined,
  actorId?: string,
  actorName?: string
): Promise<VoucherConsumptionResult> {
  const safeTx = asSafeTx(tx);

  // 1. Kiểm tra ưu đãi đối tác (PartnerOffer qua bảng OfferUsage)
  let reservedUsages: Array<{ id: string; offerId: string; discountAmount: number }> = [];
  let consumedUsages: Array<{ id: string; offerId: string; discountAmount: number }> = [];
  if (typeof safeTx.offerUsage?.findMany === "function") {
    reservedUsages = await safeTx.offerUsage.findMany({
      where: { bookingId, state: "RESERVED" },
    });
    consumedUsages = await safeTx.offerUsage.findMany({
      where: { bookingId, state: "CONSUMED" },
    });
  }

  if (reservedUsages.length > 0) {
    for (const usage of reservedUsages) {
      if (typeof safeTx.offerUsage?.update === "function") {
        await safeTx.offerUsage.update({
          where: { id: usage.id },
          data: { state: "CONSUMED", expiresAt: null },
        });
      }
      if (typeof safeTx.partnerOffer?.update === "function") {
        await safeTx.partnerOffer.update({
          where: { id: usage.offerId },
          data: {
            usedBudget: { increment: usage.discountAmount },
            currentUsage: { increment: 1 },
          },
        });
      }
    }

    if (voucherId) {
      // Ghi nhận VoucherUsage chứng từ và tăng Voucher.usedCount
      await recordSingleVoucherUsage(tx, voucherId, bookingId, actorId, actorName);
    }
    return { recorded: true, reason: "OFFER_USAGE_CONSUMED" };
  }

  // Nếu đơn có OfferUsage đã từng chuyển CONSUMED: đây là lượt gọi sync/retry lặp lại
  if (consumedUsages.length > 0) {
    return { recorded: false, reason: "ALREADY_RECORDED" };
  }

  if (!voucherId) {
    return { recorded: false, reason: "NO_VOUCHER" };
  }

  // 2. Voucher thường (không qua OfferUsage)
  const result = await recordSingleVoucherUsage(tx, voucherId, bookingId, actorId, actorName);
  return result;
}

/**
 * Ghi nhận chứng từ và tăng bộ đếm usedCount cho một voucher cụ thể.
 * Chống trùng bằng VoucherUsage UNIQUE(voucherId, bookingId) hoặc AdminAudit marker.
 */
async function recordSingleVoucherUsage(
  tx: SettlementTransactionContext,
  voucherId: string,
  bookingId: string,
  actorId?: string,
  actorName?: string
): Promise<VoucherConsumptionResult> {
  const safeTx = asSafeTx(tx);

  if (!safeTx.voucher) {
    return { recorded: false, reason: "NO_VOUCHER_CLIENT" };
  }

  const markerKey = `${bookingId}:${voucherId}`;
  if (inMemoryVoucherRecordings.has(markerKey)) {
    return { recorded: false, reason: "ALREADY_RECORDED" };
  }

  const auditMarker = `VOUCHER_CONSUMED:${bookingId}:${voucherId}`;

  // Trường hợp 1: Có bảng VoucherUsage (DB thật hoặc mock hỗ trợ VoucherUsage)
  if (safeTx.voucherUsage && typeof safeTx.voucherUsage.create === "function") {
    let newlyCreated = false;
    try {
      await safeTx.voucherUsage.create({
        data: { voucherId, bookingId },
      });
      newlyCreated = true;
    } catch (err: unknown) {
      const isUniqueConflict =
        Boolean(err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002");
      if (!isUniqueConflict && typeof safeTx.voucherUsage.findUnique === "function") {
        const existing = await safeTx.voucherUsage.findUnique({
          where: { voucherId_bookingId: { voucherId, bookingId } },
        });
        if (!existing) {
          throw err;
        }
      }
    }

    if (newlyCreated) {
      inMemoryVoucherRecordings.add(markerKey);
      if (typeof safeTx.voucher.update === "function") {
        await safeTx.voucher.update({
          where: { id: voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (typeof safeTx.adminAudit?.create === "function") {
        await safeTx.adminAudit.create({
          data: {
            actorId: actorId || "system",
            actorName: actorName || "Hệ thống Thanh toán",
            action: "VOUCHER_CONSUMED",
            entityId: auditMarker,
            reason: `Ghi nhận sử dụng voucher cho đơn ${bookingId}`,
            details: { bookingId, voucherId },
          },
        });
      }
      return { recorded: true, reason: "VOUCHER_USAGE_CREATED" };
    }

    inMemoryVoucherRecordings.add(markerKey);
    return { recorded: false, reason: "ALREADY_RECORDED" };
  }

  // Trường hợp 2: Mock hoặc DB chưa có tx.voucherUsage -> Sử dụng AdminAudit marker
  let alreadyRecorded = false;
  if (typeof safeTx.adminAudit?.findFirst === "function") {
    const existingAudit = await safeTx.adminAudit.findFirst({
      where: { action: "VOUCHER_CONSUMED", entityId: auditMarker },
    });
    if (existingAudit) alreadyRecorded = true;
  }

  if (!alreadyRecorded) {
    inMemoryVoucherRecordings.add(markerKey);
    if (typeof safeTx.adminAudit?.create === "function") {
      await safeTx.adminAudit.create({
        data: {
          actorId: actorId || "system",
          actorName: actorName || "Hệ thống Thanh toán",
          action: "VOUCHER_CONSUMED",
          entityId: auditMarker,
          reason: `Xác nhận sử dụng voucher thường cho đơn ${bookingId}`,
          details: { bookingId, voucherId },
        },
      });
    }
    if (typeof safeTx.voucher.update === "function") {
      await safeTx.voucher.update({
        where: { id: voucherId },
        data: { usedCount: { increment: 1 } },
      });
    }
    return { recorded: true, reason: "VOUCHER_AUDIT_RECORDED" };
  }

  inMemoryVoucherRecordings.add(markerKey);
  return { recorded: false, reason: "ALREADY_RECORDED" };
}

export interface CompleteBookingSettlementParams {
  bookingId: string;
  voucherId?: string | null;
  groupId?: string | null;
  actorId?: string;
  actorName?: string;
  excludeCoachBookingId?: string; // Không xác nhận lại ca HLV vừa bị hủy
}

/**
 * Bước hoàn tất giao dịch thống nhất:
 * Được dùng khi thanh toán đủ tiền hoặc khi hủy HLV làm đơn đủ tiền.
 * Đảm bảo:
 * 1. Booking chuyển sang PAID, CONFIRMED, expiresAt null.
 * 2. Toàn bộ BookingItem HELD chuyển sang CONFIRMED.
 * 3. Các ca CoachBooking HELD còn hiệu lực chuyển sang CONFIRMED (không chạm vào ca vừa hủy).
 * 4. OfferUsage chuyển sang CONSUMED, ngân sách đối tác được ghi nhận.
 * 5. Voucher.usedCount được ghi nhận chính xác 1 lần có chứng từ bền vững.
 * 6. Các GroupPaymentIntent OPEN chuyển sang CLOSED.
 */
export async function completeBookingSettlement(
  tx: SettlementTransactionContext,
  params: CompleteBookingSettlementParams
): Promise<void> {
  const safeTx = asSafeTx(tx);

  // 1. Cập nhật Booking
  if (typeof safeTx.booking?.update === "function") {
    await safeTx.booking.update({
      where: { id: params.bookingId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        expiresAt: null,
      },
    });
  }

  // 2. Xác nhận sân (BookingItem)
  if (typeof safeTx.bookingItem?.updateMany === "function") {
    await safeTx.bookingItem.updateMany({
      where: { bookingId: params.bookingId, status: "HELD" },
      data: { status: "CONFIRMED" },
    });
  }

  // 3. Đồng bộ các lịch HLV còn hiệu lực (không đụng ca đã hủy / vừa hủy)
  if (typeof safeTx.coachBooking?.updateMany === "function") {
    const coachBookingWhere: Record<string, unknown> = {
      bookingItem: { bookingId: params.bookingId },
      status: "HELD",
    };
    if (params.excludeCoachBookingId) {
      coachBookingWhere.id = { not: params.excludeCoachBookingId };
    }
    await safeTx.coachBooking.updateMany({
      where: coachBookingWhere,
      data: { status: "CONFIRMED", expiresAt: null },
    });
  }

  // 4. Ghi nhận voucher / tiêu thụ OfferUsage
  await recordVoucherConsumption(
    tx,
    params.bookingId,
    params.voucherId,
    params.actorId,
    params.actorName
  );

  // 5. Đóng các payment intent còn mở của nhóm
  if (params.groupId && typeof safeTx.groupPaymentIntent?.updateMany === "function") {
    await safeTx.groupPaymentIntent.updateMany({
      where: { groupId: params.groupId, status: "OPEN" },
      data: { status: "CLOSED" },
    });
  }
}
