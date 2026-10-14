export type PriceLineType = "COURT" | "COACH" | "DISCOUNT";

export type SettlementStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "DISPUTED";

export interface BookingPriceLine {
  id: string;
  bookingId: string;
  type: PriceLineType;
  amount: number; // VND
  label: string;
  beneficiaryId?: string | null;
  createdAt: string;
}

export interface CoachSettlementSummary {
  id: string;
  coachId: string;
  coachName: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  grossCollected: number; // Tổng tiền thực thu từ khách
  refunds: number;        // Hoàn lại khách
  commission: number;     // Hoa hồng sàn
  netAmount: number;      // Số tiền chi trả cho HLV = grossCollected - refunds - commission
  status: SettlementStatus;
  reference?: string | null;
  note?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
