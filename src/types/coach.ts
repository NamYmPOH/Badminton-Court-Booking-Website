export type CoachStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export type CoachVenueStatus = "PENDING" | "ACTIVE" | "REJECTED";

export type CoachBookingStatus = "HELD" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface CoachCertificate {
  id: string;
  coachId: string;
  title: string;
  fileKey: string;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
}

export interface CoachVenueInfo {
  id: string;
  coachId: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  status: CoachVenueStatus;
  createdAt: string;
}

export interface CoachAvailabilitySlot {
  id: string;
  coachId: string;
  venueId: string;
  venueName?: string;
  startsAt: string; // ISO date string
  endsAt: string;   // ISO date string
  createdAt: string;
}

export interface CoachProfile {
  id: string;
  userId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  specialties: string[];
  experienceYears: number;
  hourlyRate: number; // VND / giờ
  status: CoachStatus;
  reviewReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  venues?: CoachVenueInfo[];
  certificates?: CoachCertificate[];
}

export interface CoachBookingDetail {
  id: string;
  coachId: string;
  coachName: string;
  bookingItemId: string;
  startsAt: string;
  endsAt: string;
  fee: number;
  hourlyRateSnapshot: number;
  commissionRateSnapshot: number;
  commissionAmount: number;
  status: CoachBookingStatus;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}
