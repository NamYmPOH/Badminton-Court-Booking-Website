import { refundLedger } from "./refund-ledger";
import { Prisma, type PrismaClient } from "@prisma/client";
import { PaymentError } from "../lib/sepay";

export interface CancellationPolicySnapshot {
  policyId: string;
  policyName: string;
  version: number;
  freeCancelHours: number;
  lateCancelHours: number;
  partialRefundPercent: number;
  nonRefundableHours: number;
  allowCoachRefund: boolean;
  capturedAt: string;
}

export interface RefundCalculationResult {
  refundableAmount: number;
  courtRefund: number;
  coachRefund: number;
  refundPercent: number;
  reason: string;
  isEligible: boolean;
}

/**
 * Lấy chính sách hủy hiệu lực của một Venue (hoặc tạo chính sách mặc định nếu chưa có)
 */
export async function getVenueCancellationPolicy(
  tx: Prisma.TransactionClient | PrismaClient,
  venueId: string
): Promise<CancellationPolicySnapshot> {
  const policy = await tx.cancellationPolicy.findFirst({
    where: { venueId, isDefault: true },
    orderBy: { version: "desc" },
  });

  if (policy) {
    return {
      policyId: policy.id,
      policyName: policy.name,
      version: policy.version,
      freeCancelHours: policy.freeCancelHours,
      lateCancelHours: policy.lateCancelHours,
      partialRefundPercent: policy.partialRefundPercent,
      nonRefundableHours: policy.nonRefundableHours,
      allowCoachRefund: policy.allowCoachRefund,
      capturedAt: new Date().toISOString(),
    };
  }

  // Fallback: Lấy cancelBeforeHours từ Venue nếu chưa có bảng chính sách chi tiết
  const venue = await tx.venue.findUnique({
    where: { id: venueId },
    select: { cancelBeforeHours: true },
  });

  const cancelHours = venue?.cancelBeforeHours ?? 4;

  return {
    policyId: "default-venue-policy",
    policyName: "Chính sách hủy tiêu chuẩn",
    version: 1,
    freeCancelHours: 24,
    lateCancelHours: cancelHours,
    partialRefundPercent: 50,
    nonRefundableHours: cancelHours,
    allowCoachRefund: true,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Tính toán số tiền hoàn lại theo chính sách snapshot của đơn và mốc thời gian hiện tại
 */
export function calculateCancellationRefund(
  booking: {
    total: number;
    subtotal: number;
    discount: number;
    cancellationSnapshot?: unknown;
    items: { date: Date | string; startMin: number; coachBooking?: { fee: number; status: string } | null }[];
    payments: { amount: number; status: string; txnRef?: string; groupRefund?: { amount: number; status: string } | null }[];
    refundRequests?: { amount: number; status: string }[];
  },
  now = new Date()
): RefundCalculationResult {
  // 1. Tính tổng tiền đã thực thu
  const ledger = refundLedger(booking.payments, booking.refundRequests || []);
  const totalPaid = ledger.received;
  if (totalPaid <= 0) {
    return {
      refundableAmount: 0,
      courtRefund: 0,
      coachRefund: 0,
      refundPercent: 0,
      reason: "Đơn chưa thanh toán hoặc chưa có giao dịch hợp lệ.",
      isEligible: false,
    };
  }

  // 2. Tính số tiền đã hoàn trước đó
  const maxRemainingRefundable = ledger.available;
  if (maxRemainingRefundable <= 0) {
    return {
      refundableAmount: 0,
      courtRefund: 0,
      coachRefund: 0,
      refundPercent: 0,
      reason: "Đơn đã được hoàn toàn bộ số tiền thực thu.",
      isEligible: false,
    };
  }

  // 3. Tìm giờ bắt đầu chơi sớm nhất
  if (!booking.items.length) {
    return {
      refundableAmount: 0,
      courtRefund: 0,
      coachRefund: 0,
      refundPercent: 0,
      reason: "Đơn không có sân đặt.",
      isEligible: false,
    };
  }

  const sortedItems = [...booking.items].sort((a, b) => {
    const dA = a.date instanceof Date ? a.date.toISOString().slice(0, 10) : String(a.date).slice(0, 10);
    const dB = b.date instanceof Date ? b.date.toISOString().slice(0, 10) : String(b.date).slice(0, 10);
    if (dA !== dB) return dA.localeCompare(dB);
    return a.startMin - b.startMin;
  });

  const firstItem = sortedItems[0];
  const firstDateStr =
    firstItem.date instanceof Date ? firstItem.date.toISOString().slice(0, 10) : String(firstItem.date).slice(0, 10);

  const hourStr = String(Math.floor(firstItem.startMin / 60)).padStart(2, "0");
  const minStr = String(firstItem.startMin % 60).padStart(2, "0");
  const gameStart = new Date(`${firstDateStr}T${hourStr}:${minStr}:00+07:00`);

  const hoursDiff = (gameStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  // 4. Đọc chính sách từ Snapshot (Bảo toàn quyền lợi của đơn cũ)
  const snapshot = booking.cancellationSnapshot as CancellationPolicySnapshot | undefined;
  const freeCancelHours = snapshot?.freeCancelHours ?? 24;
  const lateCancelHours = snapshot?.lateCancelHours ?? 4;
  const partialRefundPercent = snapshot?.partialRefundPercent ?? 50;
  const allowCoachRefund = snapshot?.allowCoachRefund ?? true;

  // Tách tiền sân và tiền HLV
  const coachFee = booking.items.reduce(
    (sum, it) => sum + (it.coachBooking && it.coachBooking.status !== "CANCELLED" ? it.coachBooking.fee : 0),
    0
  );
  const courtFeePaid = Math.max(0, totalPaid - coachFee);

  let refundPercent = 0;
  let courtRefund = 0;
  let coachRefund = 0;
  let reason = "";

  if (hoursDiff >= freeCancelHours) {
    // Hủy sớm: Hoàn 100%
    refundPercent = 100;
    courtRefund = courtFeePaid;
    coachRefund = allowCoachRefund ? coachFee : 0;
    reason = `Hủy trước ${freeCancelHours} giờ: Hoàn 100% giá trị hợp lệ.`;
  } else if (hoursDiff >= lateCancelHours) {
    // Hủy muộn: Hoàn một phần theo tỷ lệ
    refundPercent = partialRefundPercent;
    courtRefund = Math.round((courtFeePaid * partialRefundPercent) / 100);
    coachRefund = 0; // Hủy muộn không hoàn phí HLV để bù chi phí giữ ca
    reason = `Hủy trước ${lateCancelHours} giờ: Hoàn ${partialRefundPercent}% tiền sân (không hoàn phí HLV).`;
  } else {
    // Quá hạn: Không hoàn
    refundPercent = 0;
    courtRefund = 0;
    coachRefund = 0;
    reason = `Hủy dưới ${lateCancelHours} giờ trước trận đấu: Không áp dụng hoàn tiền theo chính sách.`;
  }

  const calculatedTotal = courtRefund + coachRefund;
  const finalRefund = Math.min(calculatedTotal, maxRemainingRefundable);

  return {
    refundableAmount: finalRefund,
    courtRefund: Math.min(courtRefund, finalRefund),
    coachRefund: Math.max(0, finalRefund - courtRefund),
    refundPercent,
    reason,
    isEligible: finalRefund > 0,
  };
}
