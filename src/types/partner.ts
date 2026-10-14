export type PartnerStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export type PartnerMemberRole = "OWNER" | "MANAGER" | "STAFF";

export type OfferStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "PAUSED" | "REJECTED" | "EXPIRED";

export type OfferSponsor = "PARTNER" | "VENUE" | "SYSTEM";

export type OfferUsageState = "RESERVED" | "CONSUMED" | "RELEASED";

export interface PartnerMember {
  id: string;
  partnerId: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  role: PartnerMemberRole;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  status: PartnerStatus;
  createdAt: string;
  updatedAt: string;
  members?: PartnerMember[];
}

export interface PartnerOfferTerms {
  minTotal?: number;
  maxDiscount?: number;
  applicableVenueIds?: string[];
  daysOfWeek?: number[]; // 1=T2..7=CN
}

export interface PartnerOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  voucherId: string;
  voucherCode: string;
  title: string;
  description?: string | null;
  sponsor: OfferSponsor;
  budget: number;
  usedBudget: number;
  maxUsage?: number | null;
  currentUsage: number;
  status: OfferStatus;
  version: number;
  terms?: PartnerOfferTerms | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferUsage {
  id: string;
  offerId: string;
  bookingId: string;
  userId: string;
  discountAmount: number;
  state: OfferUsageState;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
