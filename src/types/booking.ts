export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus =
  | "UNPAID"
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

export interface Booking {
  id: string;
  code: string;       // SB-YYMMDD-XXXX
  venueId: string;
  venueName: string;
  venueAddress: string;
  venueSlug: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "VNPAY" | "AT_VENUE";
  subtotal: number;
  discount: number;
  total: number;
  contactName: string;
  contactPhone: string;
  note?: string;
  expiresAt: string;
  createdAt: string;
  items: BookingItem[];
}

export interface Voucher {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minAmount: number;
  description: string;
}
