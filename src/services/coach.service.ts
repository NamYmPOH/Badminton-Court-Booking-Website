import type { PrismaClient } from "@prisma/client";
import { db } from "../lib/db";
import { PaymentError } from "../lib/sepay";
import {
  coachProfileInputSchema,
  coachCertificateInputSchema,
  coachAvailabilityInputSchema,
  coachVenueApprovalSchema,
  assertCoachActive,
  assertCoachOwner,
  type CoachProfileInput,
  type CoachCertificateInput,
  type CoachAvailabilityInput,
  type CoachVenueApproval,
} from "../lib/coach-policy";
import { operatorVenueScope } from "../lib/venue-operations";
import { refundLedger, reserveRefund } from "./refund.service";
import { serializable } from "./sepay.service";
import { completeBookingSettlement } from "./settlement.service";

export interface CoachFilterParams {
  page?: number;
  limit?: number;
  q?: string;
  specialty?: string;
  minRate?: number;
  maxRate?: number;
  venueId?: string;
  district?: string;
}

export interface PublicCoachListItem {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  bio: string | null;
  specialties: string[];
  experienceYears: number;
  hourlyRate: number;
  venues: Array<{
    id: string;
    name: string;
    address: string;
    district: string;
    province: string;
  }>;
}

// ───────────── Public Queries ─────────────

export async function getPublicCoaches(
  database: PrismaClient = db,
  params: CoachFilterParams = {}
): Promise<{ coaches: PublicCoachListItem[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 12));
  const skip = (page - 1) * limit;

  // Build where filters
  const where: Record<string, unknown> = {
    status: "ACTIVE",
    user: {
      status: "ACTIVE",
    },
  };

  if (params.q && params.q.trim()) {
    const search = params.q.trim();
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { bio: { contains: search, mode: "insensitive" } },
      { specialties: { has: search } },
    ];
  }

  if (params.specialty && params.specialty.trim()) {
    where.specialties = { has: params.specialty.trim() };
  }

  if (params.minRate !== undefined || params.maxRate !== undefined) {
    where.hourlyRate = {
      ...(params.minRate !== undefined ? { gte: params.minRate } : {}),
      ...(params.maxRate !== undefined ? { lte: params.maxRate } : {}),
    };
  }

  if (params.venueId) {
    where.venues = {
      some: {
        venueId: params.venueId,
        status: "ACTIVE",
      },
    };
  } else if (params.district) {
    where.venues = {
      some: {
        venue: {
          district: { contains: params.district, mode: "insensitive" },
        },
        status: "ACTIVE",
      },
    };
  }

  const [total, rows] = await Promise.all([
    database.coachProfile.count({ where }),
    database.coachProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        bio: true,
        specialties: true,
        experienceYears: true,
        hourlyRate: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        venues: {
          where: { status: "ACTIVE" },
          select: {
            venue: {
              select: {
                id: true,
                name: true,
                address: true,
                district: true,
                province: true,
              },
            },
          },
        },
      },
      orderBy: [{ hourlyRate: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  const coaches: PublicCoachListItem[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.user.name,
    image: r.user.image,
    bio: r.bio,
    specialties: r.specialties,
    experienceYears: r.experienceYears,
    hourlyRate: r.hourlyRate,
    venues: r.venues.map((v) => ({
      id: v.venue.id,
      name: v.venue.name,
      address: v.venue.address,
      district: v.venue.district,
      province: v.venue.province,
    })),
  }));

  return { coaches, total, page, limit };
}

export async function getPublicCoachById(database: PrismaClient = db, coachId: string) {
  const coach = await database.coachProfile.findFirst({
    where: {
      id: coachId,
      status: "ACTIVE",
      user: { status: "ACTIVE" },
    },
    select: {
      id: true,
      userId: true,
      bio: true,
      specialties: true,
      experienceYears: true,
      hourlyRate: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      certificates: {
        where: { verifiedAt: { not: null } },
        select: {
          id: true,
          title: true,
          verifiedAt: true,
        },
      },
      venues: {
        where: { status: "ACTIVE" },
        select: {
          venue: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              district: true,
              province: true,
              openMin: true,
              closeMin: true,
            },
          },
        },
      },
    },
  });

  if (!coach) {
    throw new PaymentError(404, "Không tìm thấy huấn luyện viên hoặc hồ sơ chưa được kích hoạt.");
  }

  return {
    id: coach.id,
    userId: coach.userId,
    name: coach.user.name,
    image: coach.user.image,
    bio: coach.bio,
    specialties: coach.specialties,
    experienceYears: coach.experienceYears,
    hourlyRate: coach.hourlyRate,
    createdAt: coach.createdAt.toISOString(),
    certificates: coach.certificates.map((c) => ({
      id: c.id,
      title: c.title,
      verifiedAt: c.verifiedAt?.toISOString() || null,
    })),
    venues: coach.venues.map((v) => v.venue),
  };
}

interface Interval {
  startsAt: Date;
  endsAt: Date;
}

function subtractBookingsFromSlot(
  slot: Interval,
  bookings: Interval[],
  minDurationMs = 30 * 60 * 1000
): Interval[] {
  let freeIntervals: { start: number; end: number }[] = [
    { start: slot.startsAt.getTime(), end: slot.endsAt.getTime() },
  ];

  for (const b of bookings) {
    const bStart = b.startsAt.getTime();
    const bEnd = b.endsAt.getTime();

    const nextFree: { start: number; end: number }[] = [];
    for (const f of freeIntervals) {
      if (bEnd <= f.start || bStart >= f.end) {
        nextFree.push(f);
      } else {
        if (f.start < bStart) {
          nextFree.push({ start: f.start, end: bStart });
        }
        if (f.end > bEnd) {
          nextFree.push({ start: bEnd, end: f.end });
        }
      }
    }
    freeIntervals = nextFree;
  }

  return freeIntervals
    .filter((f) => f.end - f.start >= minDurationMs)
    .map((f) => ({
      startsAt: new Date(f.start),
      endsAt: new Date(f.end),
    }));
}

export async function getPublicCoachAvailabilities(
  database: PrismaClient = db,
  coachId: string,
  venueId: string,
  date: string // YYYY-MM-DD
) {
  const dayStart = new Date(`${date}T00:00:00+07:00`);
  const dayEnd = new Date(`${date}T23:59:59.999+07:00`);
  const now = new Date();

  const [availabilities, bookings] = await Promise.all([
    database.coachAvailability.findMany({
      where: {
        coachId,
        venueId,
        startsAt: { gte: dayStart, lte: dayEnd },
        endsAt: { gt: now },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
    }),
    database.coachBooking.findMany({
      where: {
        coachId,
        startsAt: { gte: dayStart, lte: dayEnd },
        OR: [
          { status: "CONFIRMED" },
          { status: "HELD", expiresAt: { gt: now } },
        ],
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    }),
  ]);

  const freeSlots: { id: string; startsAt: string; endsAt: string }[] = [];
  for (const slot of availabilities) {
    const relevantBookings = bookings.filter(
      (b) => b.startsAt.getTime() < slot.endsAt.getTime() && b.endsAt.getTime() > slot.startsAt.getTime()
    );
    const subSlots = subtractBookingsFromSlot(slot, relevantBookings);
    for (let i = 0; i < subSlots.length; i++) {
      freeSlots.push({
        id: subSlots.length === 1 ? slot.id : `${slot.id}-${i}`,
        startsAt: subSlots[i].startsAt.toISOString(),
        endsAt: subSlots[i].endsAt.toISOString(),
      });
    }
  }

  return freeSlots;
}

// ───────────── Coach Portal Operations ─────────────

export async function getMyCoachProfile(database: PrismaClient = db, userId: string) {
  const profile = await database.coachProfile.findUnique({
    where: { userId },
    include: {
      certificates: {
        orderBy: { createdAt: "desc" },
      },
      venues: {
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              district: true,
              province: true,
            },
          },
        },
      },
    },
  });

  if (!profile) return null;

  return {
    ...profile,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    reviewedAt: profile.reviewedAt?.toISOString() || null,
    certificates: profile.certificates.map((c) => ({
      ...c,
      verifiedAt: c.verifiedAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    })),
    venues: profile.venues.map((v) => ({
      id: v.id,
      venueId: v.venueId,
      status: v.status,
      reviewReason: v.reviewReason,
      reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null,
      reviewedById: v.reviewedById,
      name: v.venue.name,
      address: v.venue.address,
      district: v.venue.district,
      province: v.venue.province,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

export async function upsertMyCoachProfile(
  database: PrismaClient = db,
  userId: string,
  rawInput: CoachProfileInput
) {
  const input = coachProfileInputSchema.parse(rawInput);

  return serializable(database, async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn không hoạt động.");
    }

    const existing = await tx.coachProfile.findUnique({ where: { userId } });

    if (!existing) {
      return tx.coachProfile.create({
        data: {
          userId,
          bio: input.bio,
          specialties: input.specialties,
          experienceYears: input.experienceYears,
          hourlyRate: input.hourlyRate,
          status: "PENDING",
        },
      });
    }

    // Nếu hồ sơ trước đó bị REJECTED, cập nhật lại sẽ chuyển thành PENDING để Admin duyệt lại
    const nextStatus = existing.status === "REJECTED" ? "PENDING" : existing.status;

    return tx.coachProfile.update({
      where: { id: existing.id },
      data: {
        bio: input.bio,
        specialties: input.specialties,
        experienceYears: input.experienceYears,
        hourlyRate: input.hourlyRate,
        status: nextStatus,
        reviewReason: nextStatus === "PENDING" ? null : existing.reviewReason,
      },
    });
  });
}

export async function addCoachCertificate(
  database: PrismaClient = db,
  userId: string,
  rawInput: CoachCertificateInput
) {
  const input = coachCertificateInputSchema.parse(rawInput);

  const profile = await database.coachProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new PaymentError(404, "Vui lòng tạo hồ sơ huấn luyện viên trước khi thêm chứng chỉ.");
  }

  return database.coachCertificate.create({
    data: {
      coachId: profile.id,
      title: input.title,
      fileKey: input.fileKey,
    },
  });
}

export async function deleteCoachCertificate(
  database: PrismaClient = db,
  userId: string,
  certificateId: string
) {
  const profile = await database.coachProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new PaymentError(404, "Không tìm thấy hồ sơ huấn luyện viên.");
  }

  const cert = await database.coachCertificate.findUnique({ where: { id: certificateId } });
  if (!cert || cert.coachId !== profile.id) {
    throw new PaymentError(404, "Không tìm thấy chứng chỉ hoặc bạn không có quyền xóa.");
  }

  return database.coachCertificate.delete({ where: { id: certificateId } });
}

export async function registerCoachVenue(
  database: PrismaClient = db,
  userId: string,
  venueId: string
) {
  const profile = await database.coachProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new PaymentError(404, "Vui lòng tạo hồ sơ huấn luyện viên trước khi đăng ký cơ sở.");
  }

  const venue = await database.venue.findUnique({
    where: { id: venueId },
    select: { id: true, status: true },
  });
  if (!venue || venue.status !== "ACTIVE") {
    throw new PaymentError(404, "Cơ sở không tồn tại hoặc chưa hoạt động.");
  }

  const existing = await database.coachVenue.findUnique({
    where: {
      coachId_venueId: {
        coachId: profile.id,
        venueId,
      },
    },
  });

  if (!existing) {
    return database.coachVenue.create({
      data: {
        coachId: profile.id,
        venueId,
        status: "PENDING", // Đăng ký mới mặc định chờ cơ sở duyệt
      },
    });
  }

  if (existing.status === "ACTIVE") {
    return existing;
  }

  // Nếu trước đó bị REJECTED hoặc SUSPENDED, gửi lại yêu cầu chuyển thành PENDING để duyệt lại
  return database.coachVenue.update({
    where: { id: existing.id },
    data: {
      status: "PENDING",
      reviewReason: null,
      reviewedAt: null,
      reviewedById: null,
    },
  });
}

export async function reviewCoachVenue(
  database: PrismaClient = db,
  actorId: string,
  rawInput: CoachVenueApproval
) {
  const input = coachVenueApprovalSchema.parse(rawInput);

  return serializable(database, async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: { id: true, name: true, role: true, status: true },
    });
    if (!actor || actor.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản không hoạt động.");
    }

    // Kiểm tra quyền hạn tại cơ sở (Admin toàn quyền; Owner/Staff phải thuộc venueId này)
    if (actor.role !== "ADMIN") {
      const allowed = await tx.venue.findFirst({
        where: { id: input.venueId, ...operatorVenueScope(actor) },
        select: { id: true },
      });
      if (!allowed) {
        throw new PaymentError(403, "Bạn không có quyền quản lý cơ sở này.");
      }
    }

    const coachVenue = await tx.coachVenue.findUnique({
      where: {
        coachId_venueId: {
          coachId: input.coachId,
          venueId: input.venueId,
        },
      },
      include: {
        coach: { include: { user: { select: { name: true } } } },
        venue: { select: { name: true } },
      },
    });
    if (!coachVenue) {
      throw new PaymentError(404, "Không tìm thấy liên kết giữa huấn luyện viên và cơ sở.");
    }

    const now = new Date();
    const updated = await tx.coachVenue.update({
      where: { id: coachVenue.id },
      data: {
        status: input.status,
        reviewReason: input.reason,
        reviewedAt: now,
        reviewedById: actorId,
      },
    });

    if (tx.adminAudit) {
      await tx.adminAudit.create({
        data: {
          actorId,
          actorName: actor.name || "Quản trị viên",
          action: "COACH_VENUE_STATUS",
          entityId: `${input.coachId}:${input.venueId}`,
          reason: input.reason,
          details: {
            coachName: coachVenue.coach.user.name,
            venueName: coachVenue.venue.name,
            before: coachVenue.status,
            after: input.status,
          },
        },
      });
    }

    return updated;
  });
}

export async function createCoachAvailability(
  database: PrismaClient = db,
  userId: string,
  rawInput: CoachAvailabilityInput
) {
  const input = coachAvailabilityInputSchema.parse(rawInput);
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const now = new Date();

  if (startsAt.getTime() <= now.getTime()) {
    throw new PaymentError(400, "Thời gian bắt đầu ca dạy phải ở tương lai.");
  }

  return serializable(database, async (tx) => {
    const profile = await tx.coachProfile.findUnique({ where: { userId } });
    if (!profile) throw new PaymentError(404, "Không tìm thấy hồ sơ huấn luyện viên.");
    assertCoachActive(profile);

    // Kiểm tra cơ sở đã được đăng ký và chấp thuận
    const venueLink = await tx.coachVenue.findUnique({
      where: {
        coachId_venueId: {
          coachId: profile.id,
          venueId: input.venueId,
        },
      },
    });
    if (!venueLink || venueLink.status !== "ACTIVE") {
      throw new PaymentError(403, "Bạn chưa đăng ký hoặc chưa được duyệt hoạt động tại cơ sở này.");
    }

    // Kiểm tra trùng lịch với các ca rảnh đã có của chính HLV trên TOÀN BỘ cơ sở
    const existingSlot = await tx.coachAvailability.findFirst({
      where: {
        coachId: profile.id,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (existingSlot) {
      throw new PaymentError(409, "Bạn đã có lịch dạy trùng hoặc chồng chéo vào thời gian này.");
    }

    return tx.coachAvailability.create({
      data: {
        coachId: profile.id,
        venueId: input.venueId,
        startsAt,
        endsAt,
      },
    });
  });
}

export async function deleteCoachAvailability(
  database: PrismaClient = db,
  userId: string,
  availabilityId: string
) {
  return serializable(database, async (tx) => {
    const profile = await tx.coachProfile.findUnique({ where: { userId } });
    if (!profile) throw new PaymentError(404, "Không tìm thấy hồ sơ huấn luyện viên.");

    const slot = await tx.coachAvailability.findUnique({ where: { id: availabilityId } });
    if (!slot || slot.coachId !== profile.id) {
      throw new PaymentError(404, "Không tìm thấy ca rảnh hoặc bạn không có quyền xóa.");
    }

    // Không cho phép xóa khoảng thời gian đang có đơn đặt có hiệu lực (HELD hoặc CONFIRMED)
    const now = new Date();
    const hasBooking = await tx.coachBooking.findFirst({
      where: {
        coachId: profile.id,
        startsAt: { lt: slot.endsAt },
        endsAt: { gt: slot.startsAt },
        OR: [
          { status: "CONFIRMED" },
          { status: "HELD", expiresAt: { gt: now } },
        ],
      },
    });

    if (hasBooking) {
      throw new PaymentError(409, "Không thể xóa ca dạy này vì đã có học viên đặt lịch.");
    }

    return tx.coachAvailability.delete({ where: { id: availabilityId } });
  });
}

export async function getMyCoachAvailabilities(
  database: PrismaClient = db,
  userId: string,
  fromDate?: string,
  toDate?: string
) {
  const profile = await database.coachProfile.findUnique({ where: { userId } });
  if (!profile) throw new PaymentError(404, "Không tìm thấy hồ sơ huấn luyện viên.");

  const where: Record<string, unknown> = { coachId: profile.id };
  if (fromDate || toDate) {
    where.startsAt = {
      ...(fromDate ? { gte: new Date(fromDate) } : {}),
      ...(toDate ? { lte: new Date(toDate) } : {}),
    };
  }

  const slots = await database.coachAvailability.findMany({
    where,
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return slots.map((s) => ({
    id: s.id,
    venueId: s.venueId,
    venueName: s.venue.name,
    venueAddress: s.venue.address,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getMyCoachBookings(
  database: PrismaClient = db,
  userId: string,
  options: { status?: string; fromDate?: string; toDate?: string } = {}
) {
  const profile = await database.coachProfile.findUnique({ where: { userId } });
  if (!profile) throw new PaymentError(404, "Không tìm thấy hồ sơ huấn luyện viên.");

  const where: Record<string, unknown> = { coachId: profile.id };
  if (options.status && options.status !== "ALL") {
    where.status = options.status;
  }
  if (options.fromDate || options.toDate) {
    where.startsAt = {
      ...(options.fromDate ? { gte: new Date(options.fromDate) } : {}),
      ...(options.toDate ? { lte: new Date(options.toDate) } : {}),
    };
  }

  const bookings = await database.coachBooking.findMany({
    where,
    include: {
      bookingItem: {
        include: {
          court: {
            include: {
              venue: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
          booking: {
            select: {
              id: true,
              code: true,
              customerName: true,
              customerPhone: true,
              paymentStatus: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });

  return bookings.map((b) => ({
    id: b.id,
    bookingCode: b.bookingItem.booking.code,
    bookingStatus: b.bookingItem.booking.status,
    customerName: b.bookingItem.booking.customerName,
    customerPhone: b.bookingItem.booking.customerPhone,
    courtName: b.bookingItem.court.name,
    venueName: b.bookingItem.court.venue.name,
    venueAddress: b.bookingItem.court.venue.address,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    fee: b.fee,
    hourlyRateSnapshot: b.hourlyRateSnapshot,
    commissionRateSnapshot: b.commissionRateSnapshot,
    commissionAmount: b.commissionAmount,
    status: b.status,
    cancelledAt: b.cancelledAt?.toISOString() || null,
    cancelReason: b.cancelReason,
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function cancelCoachBookingByCoach(
  database: PrismaClient = db,
  userId: string,
  coachBookingId: string,
  reason: string
) {
  return serializable(database, async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: userId }, select: { status: true } });
    if (!actor || actor.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
    const profile = await tx.coachProfile.findUnique({ where: { userId } });
    if (!profile) throw new PaymentError(404, "Không tìm thấy hồ sơ huấn luyện viên.");
    const coachBooking = await tx.coachBooking.findUnique({
      where: { id: coachBookingId },
      include: { bookingItem: { include: { booking: true } } },
    });
    if (!coachBooking || coachBooking.coachId !== profile.id) {
      throw new PaymentError(404, "Không tìm thấy buổi dạy hoặc bạn không có quyền thao tác.");
    }
    if (coachBooking.status === "CANCELLED") {
      return { success: true, refundedFee: coachBooking.fee, alreadyCancelled: true };
    }
    const booking = coachBooking.bookingItem.booking;
    const now = new Date();
    if (!["HELD", "CONFIRMED"].includes(coachBooking.status)
      || !["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status)
      || coachBooking.startsAt <= now
      || (booking.status === "PENDING_PAYMENT" && (!booking.expiresAt || booking.expiresAt <= now))) {
      throw new PaymentError(409, "Buổi dạy hoặc đơn sân đã kết thúc, hết hạn hoặc đang sử dụng.");
    }
    const cleanReason = reason?.trim();
    if (!cleanReason || cleanReason.length < 5 || cleanReason.length > 500) throw new PaymentError(400, "Lý do hủy cần 5–500 ký tự.");
    const ledger = await refundLedger(tx, booking.id);
    if (booking.paymentStatus === "PAID" && ledger.available < booking.total) {
      throw new PaymentError(409, "Tiền thực thu không khớp đơn đã thanh toán. Cần đối soát trước khi hủy HLV.");
    }
    const refundedFee = coachBooking.fee;
    if (!Number.isSafeInteger(refundedFee) || refundedFee < 0 || refundedFee > booking.total || refundedFee > booking.subtotal) {
      throw new PaymentError(409, "Phí HLV không khớp tổng đơn, cần đối soát.");
    }
    const nextTotal = booking.total - refundedFee;
    const refundAmount = Math.max(0, ledger.available - nextTotal);
    if (refundAmount > refundedFee) throw new PaymentError(409, "Đơn có tiền thu dư cần đối soát trước khi hủy HLV.");
    const after = await reserveRefund(tx, booking.id, refundAmount, `Hủy HLV ${coachBooking.id}: ${cleanReason}`);
    await tx.coachBooking.update({ where: { id: coachBooking.id }, data: {
      status: "CANCELLED", cancelledAt: now, cancelReason: cleanReason, expiresAt: null,
    } });
    await tx.booking.update({ where: { id: booking.id }, data: {
      subtotal: booking.subtotal - refundedFee, total: nextTotal,
      refundAmountApproved: after.approved,
      refundCompletedAt: after.pending > 0 ? null : booking.refundCompletedAt,
      refundCompletedById: after.pending > 0 ? null : booking.refundCompletedById,
    } });
    const priceLine = await tx.bookingPriceLine.findFirst({
      where: { bookingId: booking.id, type: "COACH", beneficiaryId: coachBooking.coachId, amount: refundedFee },
      orderBy: { id: "asc" },
    });
    if (!priceLine && refundedFee > 0) throw new PaymentError(409, "Không tìm thấy dòng phí HLV tương ứng. Cần đối soát trước khi hủy.");
    if (priceLine) await tx.bookingPriceLine.deleteMany({ where: { id: priceLine.id } });

    const group = await tx.bookingGroup.findUnique({ where: { bookingId: booking.id }, include: { shares: { orderBy: { position: "asc" } } } });
    if (group) {
      // Phần đã thu phải khớp đúng chứng từ của người trả, kể cả một người trả thay nhiều phần.
      const paidShares = group.shares.filter((s) => s.paymentId);
      const unpaidShares = group.shares.filter((s) => !s.paymentId);
      if (paidShares.some((s) => !ledger.receipts.some((p) => p.id === s.paymentId))
        || ledger.receipts.some((p) => paidShares.filter((s) => s.paymentId === p.id).reduce((sum, s) => sum + s.amount, 0)
          !== p.amount - (p.groupRefund?.amount || 0))) {
        throw new PaymentError(409, "Phần đã trả không khớp chứng từ thu và khoản hoàn trước đó.");
      }
      let retained = 0;
      for (const payment of after.receipts) {
        const shares = paidShares.filter((s) => s.paymentId === payment.id);
        const net = payment.amount - (payment.groupRefund?.amount || 0);
        if (net > 0 && !shares.length) throw new PaymentError(409, "Chứng từ thu không khớp thành viên nhóm.");
        let rest = net;
        let weight = shares.reduce((sum, s) => sum + s.amount, 0);
        for (let i = 0; i < shares.length; i++) {
          const share = shares[i];
          const amount = i === shares.length - 1 ? rest : weight > 0 ? Number(BigInt(rest) * BigInt(share.amount) / BigInt(weight)) : 0;
          await tx.groupShare.update({ where: { id: share.id }, data: { amount, currentIntentId: null } });
          rest -= amount; weight -= share.amount;
        }
        retained += net;
      }
      const due = nextTotal - retained;
      if (due < 0 || (due > 0 && !unpaidShares.length)) throw new PaymentError(409, "Bảng chia tiền nhóm không khớp số tiền còn phải trả.");
      for (let i = 0; i < unpaidShares.length; i++) {
        const amount = Math.floor(due / unpaidShares.length) + (i < due % unpaidShares.length ? 1 : 0);
        await tx.groupShare.update({ where: { id: unpaidShares[i].id }, data: { amount, currentIntentId: null, cashRequested: false } });
      }
      await tx.groupPaymentIntent.updateMany({ where: { groupId: group.id, status: "OPEN" }, data: { status: "CLOSED" } });
    }
    if (after.available >= nextTotal) {
      await completeBookingSettlement(tx, { bookingId: booking.id, voucherId: booking.voucherId,
        groupId: group?.id, actorId: userId, actorName: "Huấn luyện viên", excludeCoachBookingId: coachBooking.id });
    }
    await tx.adminAudit.create({ data: { actorId: userId, actorName: "Huấn luyện viên", action: "COACH_CANCEL", entityId: booking.id,
      reason: cleanReason, details: { coachBookingId, removedFee: refundedFee, refundAmount, nextTotal } } });
    if (booking.userId) await tx.notification.create({ data: { userId: booking.userId, type: "BOOKING_CANCELLED",
      title: "Huấn luyện viên đã hủy buổi dạy",
      body: `Phí HLV ${refundedFee.toLocaleString("vi-VN")}đ đã được bỏ khỏi đơn ${booking.code}. Số tiền chờ hoàn: ${refundAmount.toLocaleString("vi-VN")}đ. Sân vẫn được giữ nguyên.`,
    } });
    return { success: true, refundedFee, refundAmount };
  });
}
