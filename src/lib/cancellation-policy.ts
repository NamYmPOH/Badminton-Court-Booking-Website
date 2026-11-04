// SmashBook — Chính sách Hủy lịch, Hoàn tiền và Đổi lịch (§6.2, §9.5)
// Quy định rõ ranh giới theo múi giờ Việt Nam UTC+7:
// >= 24 giờ: hoàn 100%
// Từ 6 giờ đến dưới 24 giờ: hoàn 50%
// Dưới 6 giờ hoặc không đến: hoàn 0%

export const CANCELLATION_POLICY_VERSION = "2026-v1";
export const RESCHEDULE_MIN_HOURS_BEFORE = 6; // Hạn tối thiểu để yêu cầu đổi lịch là 6 giờ

export interface CancellationTimeInfo {
  firstSlotStartsAt: Date;
  firstSlotDateStr: string;
  firstSlotTimeStr: string;
  diffMs: number;
  diffHours: number;
  isPastOrStarted: boolean;
}

export interface CancellationPolicyResult {
  policyVersion: string;
  firstSlotStartsAt: Date;
  requestedAt: Date;
  diffHours: number;
  refundRate: number; // 100, 50, hoặc 0
  availableToRefund: number; // Tiền thực thu hợp lệ còn có thể duyệt hoàn
  expectedRefundAmount: number; // Số tiền dự kiến hoàn
  nonRefundableAmount: number; // Khoản không được hoàn
  calculation: {
    firstSlotStartsAt: string;
    requestedAt: string;
    hoursRemaining: number;
    refundRate: number;
    availableBefore: number;
    expectedRefund: number;
    nonRefundable: number;
    summary: string;
  };
}

/**
 * Trích xuất timestamp chính xác theo múi giờ Việt Nam (UTC+7) cho một slot đặt sân.
 * Giữ nguyên mốc giờ thực tế của sân bất kể server chạy ở múi giờ nào.
 */
export function calculateSlotTimestamp(date: Date | string, startMin: number): number {
  const dateStr =
    typeof date === "string"
      ? date.slice(0, 10)
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);
  // Định dạng ISO với offset +07:00 đảm bảo cố định theo giờ Việt Nam
  return new Date(`${dateStr}T00:00:00+07:00`).getTime() + startMin * 60000;
}

/**
 * Xác định giờ bắt đầu chơi đầu tiên của toàn bộ đơn đặt sân.
 */
export function getFirstSlotStartsAt(items: Array<{ date: Date | string; startMin: number }>): Date | null {
  if (!items || items.length === 0) return null;
  const timestamps = items.map((i) => calculateSlotTimestamp(i.date, i.startMin));
  const minTs = Math.min(...timestamps);
  return new Date(minTs);
}

/**
 * Phân tích thời gian còn lại từ thời điểm yêu cầu (now trên server) đến giờ chơi đầu tiên.
 */
export function analyzeCancellationTime(
  items: Array<{ date: Date | string; startMin: number }>,
  now = new Date()
): CancellationTimeInfo | null {
  const firstSlotStartsAt = getFirstSlotStartsAt(items);
  if (!firstSlotStartsAt) return null;

  const diffMs = firstSlotStartsAt.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;
  const isPastOrStarted = diffMs <= 0;

  // Format ngày và giờ Việt Nam để hiển thị minh bạch cho khách và admin
  const firstSlotDateStr = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(firstSlotStartsAt);

  const hours = Math.floor(
    (new Date(firstSlotStartsAt.getTime() + 7 * 3600000).getUTCHours())
  );
  const minutes = Math.floor(
    (new Date(firstSlotStartsAt.getTime() + 7 * 3600000).getUTCMinutes())
  );
  const firstSlotTimeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return {
    firstSlotStartsAt,
    firstSlotDateStr,
    firstSlotTimeStr,
    diffMs,
    diffHours,
    isPastOrStarted,
  };
}

/**
 * Xác định tỷ lệ hoàn tiền theo ranh giới chính xác:
 * - >= 24 giờ: 100% (đúng 24.0 giờ là 100%)
 * - 6 giờ đến dưới 24 giờ: 50% (đúng 6.0 giờ là 50%)
 * - Dưới 6 giờ hoặc đã bắt đầu/qua giờ: 0%
 */
export function determineRefundRate(diffHours: number, isPastOrStarted: boolean): number {
  if (isPastOrStarted || diffHours < 6) {
    return 0;
  }
  if (diffHours >= 24) {
    return 100;
  }
  // diffHours trong khoảng [6, 24)
  return 50;
}

/**
 * Tính toán đầy đủ kết quả chính sách hủy lịch và phân bổ số tiền hoàn bảo toàn số nguyên VND.
 * Không dựa máy móc vào booking.total; dựa trên số tiền thực thu còn được hoàn (availableToRefund).
 */
export function evaluateCancellationPolicy(
  items: Array<{ date: Date | string; startMin: number }>,
  availableToRefund: number,
  now = new Date()
): CancellationPolicyResult {
  const timeInfo = analyzeCancellationTime(items, now);
  const requestedAt = now;
  const firstSlotStartsAt = timeInfo ? timeInfo.firstSlotStartsAt : now;
  const diffHours = timeInfo ? timeInfo.diffHours : 0;
  const isPastOrStarted = timeInfo ? timeInfo.isPastOrStarted : true;

  const refundRate = determineRefundRate(diffHours, isPastOrStarted);

  // Tính số tiền hoàn làm tròn số nguyên VND, bảo đảm không vượt quá tiền còn được hoàn
  let expectedRefundAmount = 0;
  if (refundRate === 100) {
    expectedRefundAmount = Math.max(0, availableToRefund);
  } else if (refundRate === 50) {
    // Làm tròn xuống để bảo toàn tài chính không hoàn vượt, phần lẻ quy về nonRefundable
    expectedRefundAmount = Math.floor(Math.max(0, availableToRefund) * 0.5);
  } else {
    expectedRefundAmount = 0;
  }

  const nonRefundableAmount = Math.max(0, availableToRefund - expectedRefundAmount);

  const roundedHours = Math.round(diffHours * 10) / 10;
  const summary =
    diffHours >= 24
      ? `Còn ${roundedHours} giờ trước giờ chơi (≥ 24h): Hoàn 100% tiền thực thu hợp lệ.`
      : diffHours >= 6
      ? `Còn ${roundedHours} giờ trước giờ chơi (6h – dưới 24h): Hoàn 50% tiền thực thu hợp lệ.`
      : diffHours > 0
      ? `Còn ${roundedHours} giờ trước giờ chơi (dưới 6h): Hoàn 0% theo chính sách.`
      : "Đơn đã đến hoặc qua giờ chơi: Hoàn 0%.";

  return {
    policyVersion: CANCELLATION_POLICY_VERSION,
    firstSlotStartsAt,
    requestedAt,
    diffHours: roundedHours,
    refundRate,
    availableToRefund,
    expectedRefundAmount,
    nonRefundableAmount,
    calculation: {
      firstSlotStartsAt: firstSlotStartsAt.toISOString(),
      requestedAt: requestedAt.toISOString(),
      hoursRemaining: roundedHours,
      refundRate,
      availableBefore: availableToRefund,
      expectedRefund: expectedRefundAmount,
      nonRefundable: nonRefundableAmount,
      summary,
    },
  };
}

/**
 * Kiểm tra điều kiện khách yêu cầu đổi lịch:
 * - Chỉ được yêu cầu khi còn ít nhất 6 giờ trước giờ chơi đầu tiên.
 */
export function checkRescheduleEligibility(
  items: Array<{ date: Date | string; startMin: number }>,
  now = new Date()
): { eligible: boolean; diffHours: number; reason?: string } {
  const timeInfo = analyzeCancellationTime(items, now);
  if (!timeInfo) {
    return { eligible: false, diffHours: 0, reason: "Đơn không có thông tin khung giờ hợp lệ." };
  }

  if (timeInfo.isPastOrStarted || timeInfo.diffHours < RESCHEDULE_MIN_HOURS_BEFORE) {
    const roundedHours = Math.round(timeInfo.diffHours * 10) / 10;
    return {
      eligible: false,
      diffHours: roundedHours,
      reason: `Chỉ được đổi lịch trước giờ chơi ít nhất 6 giờ (hiện tại còn ${roundedHours} giờ).`,
    };
  }

  return {
    eligible: true,
    diffHours: Math.round(timeInfo.diffHours * 10) / 10,
  };
}
