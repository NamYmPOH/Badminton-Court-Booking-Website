export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "NO_SHOW"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus =
  | "PARTIALLY_PAID"
  | "UNPAID"
  | "PENDING"
  | "FAILED"
  | "PAID"
  | "REFUND_PENDING"
  | "REFUNDED";

export interface BookingItem {
  id: string;
  courtId: string;
  courtName: string;
  date: string;       // YYYY-MM-DD
  startMin: number;   // phút từ 00:00
  endMin: number;
  price: number;
  status: "HELD" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "EXPIRED";
}

export interface BookingRescheduleRecord {
  id: string;
  actorName: string;
  priceDifference: number;
  reason?: string | null;
  createdAt: string;
}

export interface BookingTransferRecord {
  id: string;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  note?: string | null;
  transferredAt: string;
}

export interface BookingIncidentRecord {
  id: string;
  incidentType: string;
  requestType: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "MANUAL_REVIEW";
  refundRate?: number | null;
  refundAmount?: number | null;
  adminNote?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
}

export interface Booking {
  groupToken?: string | null;
  id: string;
  code: string;       // SB-YYMMDD-XXXX
  venueId: string;
  venueName: string;
  venueAddress: string;
  venueSlug: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "VNPAY" | "AT_VENUE" | "BANK_TRANSFER";
  subtotal: number;
  discount: number;
  total: number;
  cancelRequestedAt?: string | null;
  cancelApprovedAt?: string | null;
  cancelReviewDueAt?: string | null;
  cancelReason?: string | null;
  cancelExpectedRate?: number | null;
  cancelExpectedAmount?: number | null;
  cancelNonRefundable?: number | null;
  cancelPolicyVersion?: string | null;
  cancelCalculation?: {
    firstSlotStartsAt?: string;
    requestedAt?: string;
    hoursRemaining?: number;
    refundRate?: number;
    availableBefore?: number;
    expectedRefund?: number;
    nonRefundable?: number;
    summary?: string;
  } | null;
  cancelFirstSlotStartsAt?: string | null;
  refundAmountApproved?: number | null;
  refundCompletedAt?: string | null;
  transfereeName?: string | null;
  transfereePhone?: string | null;
  transfereeNote?: string | null;
  transferredAt?: string | null;
  contactName: string;
  contactPhone: string;
  note?: string;
  expiresAt: string;
  createdAt: string;
  items: BookingItem[];
  rescheduleHistory?: BookingRescheduleRecord[];
  transferHistory?: BookingTransferRecord[];
  incidentRequests?: BookingIncidentRecord[];
}

export interface Voucher {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minAmount: number;
  description: string;
}
