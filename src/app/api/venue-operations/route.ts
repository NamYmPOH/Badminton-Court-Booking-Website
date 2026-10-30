import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { operatorVenueScope } from "@/lib/venue-operations";
import { assertSameOrigin } from "@/lib/admin-policy";
import { PaymentError, paymentErrorResponse, readPaymentBody } from "@/lib/sepay";
import { performAdminAction } from "@/services/admin.service";
import {
  processOverdueAndCompletions,
  getVenueCourtsLiveStatus,
  getCurrentStaffShift,
  hasActiveStaffShift,
  confirmCashPayment,
  completeBookingSession,
  startStaffShift,
  endStaffShift,
  calculateBookingPaymentDetails,
  getBookingEndTimestamp,
  createCounterBooking,
  requestBookingCancellation,
  approveBookingCancellation,
  recordManualRefund,
  type CourtLiveStatus,
} from "@/services/venue-session.service";

export const dynamic = "force-dynamic";

const venueOpActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CASH_PAID"),
    id: z.string().min(1),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
    expectedAmount: z.number().int().positive("Số tiền thu phải lớn hơn 0.").optional(),
  }),
  z.object({
    action: z.literal("COMPLETE"),
    id: z.string().min(1),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
  }),
  z.object({
    action: z.enum(["CONFIRM", "CHECK_IN", "CANCEL"]),
    id: z.string().min(1),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
  }),
  z.object({
    action: z.literal("START_SHIFT"),
    venueId: z.string().min(1),
    note: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("END_SHIFT"),
    venueId: z.string().min(1),
    note: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("COUNTER_BOOKING"),
    venueId: z.string().min(1),
    courtId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày không hợp lệ (YYYY-MM-DD)"),
    startMin: z.number().int().min(0).max(1440),
    endMin: z.number().int().min(0).max(1440),
    customerName: z.string().trim().min(2, "Họ tên khách ít nhất 2 ký tự").max(100),
    customerPhone: z.string().trim().min(8, "Số điện thoại không hợp lệ").max(20),
    customerEmail: z.string().trim().email("Email không hợp lệ").optional().nullable(),
    note: z.string().trim().max(500).optional().nullable(),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER"]),
    requestId: z.string().optional(),
  }),
  z.object({
    action: z.literal("CANCEL_REQUEST"),
    id: z.string().min(1),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
  }),
  z.object({
    action: z.literal("APPROVE_CANCEL"),
    id: z.string().min(1),
    refundAmount: z.number().int().nonnegative(),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
  }),
  z.object({
    action: z.literal("RECORD_REFUND"),
    refundId: z.string().min(1).max(100),
    reference: z.string().trim().min(5).max(160),
    id: z.string().min(1),
    amount: z.number().int().positive("Số tiền hoàn phải lớn hơn 0"),
    reason: z.string().trim().min(5, "Ghi lý do ít nhất 5 ký tự.").max(500),
  }),
]);

export async function GET(request: Request) {
  try {
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    if (actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
    }

    // 1. Phân quyền: CUSTOMER không được truy cập trang vận hành
    if (actor.role !== "ADMIN" && actor.role !== "OWNER" && actor.role !== "STAFF") {
      throw new PaymentError(403, "Bạn không có quyền truy cập khu vực vận hành cơ sở.");
    }

    // 2. Chỉ chạy tác vụ bù đắp khi đã xác thực người gọi là nhân sự vận hành hợp lệ
    try {
      await processOverdueAndCompletions(db);
    } catch (e) {
      console.error("Auto overdue processor catchup error:", e);
    }

    const q = (new URL(request.url).searchParams.get("q") || "").slice(0, 80);
    const scope = operatorVenueScope(actor);

    // Lấy danh sách cơ sở sân được phân quyền
    const venues = await db.venue.findMany({
      where: scope,
      select: { id: true, name: true, slug: true, paymentMode: true, ownerId: true, status: true },
    });

    const now = new Date();

    // Lấy thông tin sân con và ca làm theo từng cơ sở
    const courtsByVenue: Record<string, CourtLiveStatus[]> = {};
    const shiftsByVenue: Record<string, { myShiftId: string | null; hasActiveShift: boolean }> = {};

    for (const v of venues) {
      courtsByVenue[v.id] = await getVenueCourtsLiveStatus(db, v.id, now);
      const myShift = await getCurrentStaffShift(db, actor.id, v.id);
      const venueHasShift = await hasActiveStaffShift(db, v.id);
      shiftsByVenue[v.id] = {
        myShiftId: myShift ? myShift.id : null,
        hasActiveShift: venueHasShift,
      };
    }

    const rawBookings = await db.booking.findMany({
      where: {
        venue: scope,
        ...(q ? { code: { contains: q, mode: "insensitive" } } : {}),
        OR: [
          { group: { isNot: null }, paymentStatus: "REFUND_PENDING" },
          { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
          { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
          { cancelRequestedAt: { not: null } },
          { paymentStatus: "REFUND_PENDING" },
          { payments: { some: { groupRefund: { is: { status: { in: ["PENDING", "REVIEW_REQUIRED"] } } } } } },
        ],
      },
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: { date: true, startMin: true, endMin: true, court: { select: { id: true, name: true } } },
        },
        venue: { select: { id: true, name: true, paymentMode: true } },
        payments: {
          where: { status: { in: ["PAID", "REFUND_PENDING", "REFUNDED"] } },
          include: { groupRefund: true },
        },
        group: {
          select: {
            inviteToken: true,
            shares: { select: { id: true, position: true, amount: true, cashRequested: true, paymentId: true } },
          },
        },
      },
    });

    const bookings = rawBookings.map((b) => {
      const receipts = b.payments.filter((p) => !p.txnRef.startsWith("REFUND-"));
      const received = receipts.reduce((sum, p) => sum + p.amount, 0);
      const refunds = receipts.flatMap((p) => p.groupRefund ? [{
        id: p.groupRefund.id, amount: p.groupRefund.amount, completedAmount: p.groupRefund.completedAmount,
        remaining: p.groupRefund.amount - p.groupRefund.completedAmount, txnRef: p.txnRef, provider: p.provider,
      }] : []);
      const refundApproved = refunds.reduce((sum, r) => sum + r.amount, 0);
      const refundNeedsReview = b.payments.some((p) => p.txnRef.startsWith("REFUND-") || (p.status !== "PAID" && !p.groupRefund))
        || b.payments.some((p) => p.groupRefund?.status === "REVIEW_REQUIRED")
        || refundApproved > received || refunds.some((r) => r.remaining < 0);
      const paymentDetails = calculateBookingPaymentDetails(b);
      const endTimestamp = getBookingEndTimestamp(b.items);
      const isOverdue = endTimestamp > 0 && now.getTime() >= endTimestamp;

      return {
        id: b.id,
        code: b.code,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        total: b.total,
        status: b.status,
        sessionStatus: b.sessionStatus,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        hasCashPayment: paymentDetails.hasCashPayment,
        totalPaid: paymentDetails.totalPaid,
        remaining: paymentDetails.remaining,
        isFullyPaid: paymentDetails.isFullyPaid,
        isOverdue,
        endTimestamp,
        expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
        cancelRequestedAt: b.cancelRequestedAt ? b.cancelRequestedAt.toISOString() : null,
        cancelApprovedAt: b.cancelApprovedAt ? b.cancelApprovedAt.toISOString() : null,
        refundAmountApproved: b.refundAmountApproved,
        refundAvailable: refundNeedsReview ? 0 : Math.max(0, received - refundApproved),
        refundPending: refundNeedsReview ? 0 : refunds.reduce((sum, r) => sum + r.remaining, 0),
        refundNeedsReview,
        refunds: refundNeedsReview ? [] : refunds,
        refundCompletedAt: b.refundCompletedAt ? b.refundCompletedAt.toISOString() : null,
        source: b.source,
        venue: b.venue,
        items: b.items.map((i) => ({
          date: i.date.toISOString(),
          startMin: i.startMin,
          endMin: i.endMin,
          court: i.court,
        })),
        group: b.group,
      };
    });

    return NextResponse.json(
      {
        bookings,
        venues,
        courtsByVenue,
        shiftsByVenue,
        userRole: actor.role,
        userId: actor.id,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const id = await requirePaymentUser();
    const actor = await db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, role: true, status: true, name: true },
    });

    if (actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.");
    }

    const raw = await readPaymentBody(request, 4096);
    let body: unknown;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "JSON không hợp lệ.");
    }

    const parsed = venueOpActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new PaymentError(400, parsed.error.issues[0]?.message || "Thao tác không hợp lệ.");
    }

    const data = parsed.data;

    // 1. Thao tác ca trực
    if (data.action === "START_SHIFT") {
      return NextResponse.json(await startStaffShift(db, actor, data.venueId, data.note));
    }
    if (data.action === "END_SHIFT") {
      return NextResponse.json(await endStaffShift(db, actor, data.venueId, data.note));
    }

    // 2. Thao tác tạo đơn tại quầy
    if (data.action === "COUNTER_BOOKING") {
      return NextResponse.json(await createCounterBooking(db, actor, data));
    }

    // 3. Thao tác thu tiền mặt: LUÔN đi qua confirmCashPayment để kiểm tra ca trực & quyền nhân viên
    if (data.action === "CASH_PAID") {
      const targetBooking = await db.booking.findUnique({
        where: { id: data.id },
        include: { payments: { where: { status: "PAID" } } },
      });
      if (!targetBooking) {
        throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
      }
      const paymentDetails = calculateBookingPaymentDetails(targetBooking);
      const amountToCollect = data.expectedAmount ?? paymentDetails.remaining;

      return NextResponse.json(
        await confirmCashPayment(db, actor, data.id, amountToCollect, data.reason)
      );
    }

    // 4. Thao tác hoàn tất và bàn giao sân
    if (data.action === "COMPLETE") {
      return NextResponse.json(await completeBookingSession(db, actor, data.id, data.reason));
    }

    // 5. Thao tác yêu cầu hủy đơn
    if (data.action === "CANCEL_REQUEST") {
      return NextResponse.json(await requestBookingCancellation(db, actor, data.id, data.reason));
    }

    // 6. Thao tác phê duyệt hủy và hoàn tiền
    if (data.action === "APPROVE_CANCEL") {
      return NextResponse.json(
        await approveBookingCancellation(db, actor, data.id, data.refundAmount, data.reason)
      );
    }

    // 7. Thao tác ghi nhận hoàn tiền thủ công
    if (data.action === "RECORD_REFUND") {
      return NextResponse.json(
        await recordManualRefund(db, actor, data.id, data.amount, data.reason, data.refundId, data.reference)
      );
    }

    // 8. Các thao tác khác: CONFIRM, CHECK_IN, CANCEL
    return NextResponse.json(
      await performAdminAction(db, actor.id, {
        action: data.action,
        id: data.id,
        reason: data.reason,
      })
    );
  } catch (error) {
    return paymentErrorResponse(error);
  }
}
