import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePaymentUser } from "@/lib/payment-session";
import { PaymentError, paymentErrorResponse } from "@/lib/sepay";
import { evaluateCancellationPolicy, analyzeCancellationTime } from "@/lib/cancellation-policy";
import { refundLedger } from "@/services/refund.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const userId = await requirePaymentUser();
    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn đã bị khóa hoặc không hoạt động.");
    }

    const booking = await db.booking.findFirst({
      where: { code: params.code },
      include: {
        venue: { select: { id: true, name: true, ownerId: true } },
        items: {
          select: {
            id: true,
            courtId: true,
            date: true,
            startMin: true,
            endMin: true,
            price: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    }

    // Phân quyền: chủ đơn, nhân viên hoặc admin
    const isBooker = booking.userId === actor.id;
    const isOwnerOrAdmin = actor.role === "ADMIN" || booking.venue.ownerId === actor.id;
    if (!isBooker && !isOwnerOrAdmin) {
      const staff = await db.venueStaff.findFirst({
        where: { userId: actor.id, venueId: booking.venue.id, isActive: true },
      });
      if (!staff) {
        throw new PaymentError(403, "Bạn không có quyền xem thông tin đơn này.");
      }
    }

    const now = new Date();
    const timeInfo = analyzeCancellationTime(booking.items, now);

    // Tính tiền thực thu còn có thể hoàn qua sổ hoàn tiền
    const ledger = await refundLedger(db, booking.id);
    const policy = evaluateCancellationPolicy(booking.items, ledger.available, now);

    const canCancel =
      ["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) &&
      !booking.cancelRequestedAt &&
      (!timeInfo?.isPastOrStarted || isOwnerOrAdmin);

    return NextResponse.json({
      success: true,
      bookingCode: booking.code,
      venueName: booking.venue.name,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      canCancel,
      firstSlotStartsAt: timeInfo?.firstSlotStartsAt.toISOString() || null,
      firstSlotDateStr: timeInfo?.firstSlotDateStr || "",
      firstSlotTimeStr: timeInfo?.firstSlotTimeStr || "",
      hoursRemaining: timeInfo ? Math.round(timeInfo.diffHours * 10) / 10 : 0,
      isPastOrStarted: timeInfo?.isPastOrStarted || false,
      totalReceived: ledger.received,
      previouslyApproved: ledger.approved,
      availableToRefund: ledger.available,
      refundRate: policy.refundRate,
      expectedRefundAmount: policy.expectedRefundAmount,
      nonRefundableAmount: policy.nonRefundableAmount,
      policyVersion: policy.policyVersion,
      calculationSummary: policy.calculation.summary,
      isZeroRefund: policy.refundRate === 0 && ledger.available > 0,
      warning:
        policy.refundRate === 0 && ledger.available > 0
          ? "CẢNH BÁO: Đơn hủy dưới 6 giờ trước giờ chơi sẽ có mức hoàn dự kiến là 0% theo quy định."
          : null,
    });
  } catch (error) {
    return paymentErrorResponse(error);
  }
}

