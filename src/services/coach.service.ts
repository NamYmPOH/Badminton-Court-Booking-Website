import type { PrismaClient } from "@prisma/client";
import { db } from "../lib/db";
import { PaymentError } from "../lib/sepay";
import {
  coachProfileInputSchema,
  coachCertificateInputSchema,
  coachAvailabilityInputSchema,
  assertCoachActive,
  assertCoachOwner,
  type CoachProfileInput,
  type CoachCertificateInput,
  type CoachAvailabilityInput,
} from "../lib/coach-policy";
import { serializable } from "./sepay.service";

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

  return database.coachVenue.upsert({
    where: {
      coachId_venueId: {
        coachId: profile.id,
        venueId,
      },
    },
    create: {
      coachId: profile.id,
      venueId,
      status: "ACTIVE", // Mặc định chấp thuận liên kết cơ sở cho HLV
    },
    update: {
      status: "ACTIVE",
    },
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
    const profile = await tx.coachProfile.findUnique({ where: { userId } });
    if (!profile) throw new PaymentError(404, "Không tìm thấy hồ sơ huấn luyện viên.");

    const coachBooking = await tx.coachBooking.findUnique({
      where: { id: coachBookingId },
      include: {
        bookingItem: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!coachBooking || coachBooking.coachId !== profile.id) {
      throw new PaymentError(404, "Không tìm thấy buổi dạy hoặc bạn không có quyền thao tác.");
    }

    if (["CANCELLED", "COMPLETED"].includes(coachBooking.status)) {
      throw new PaymentError(409, "Buổi dạy đã hoàn thành hoặc đã bị hủy trước đó.");
    }

    const now = new Date();
    const cleanReason = reason?.trim() || "Huấn luyện viên bận việc đột xuất";

    // 1. Cập nhật CoachBooking thành CANCELLED
    await tx.coachBooking.update({
      where: { id: coachBooking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelReason: cleanReason,
      },
    });

    // 2. Xử lý hoàn tiền 100% phí HLV cho khách hàng (theo quyết định chốt mục 11.8)
    const booking = coachBooking.bookingItem.booking;
    const refundedFee = coachBooking.fee;

    if (booking.paymentStatus === "PAID") {
      // 1. Tạo bản ghi hoàn tiền (REFUND_PENDING) để Kế toán / Admin xử lý hoàn tiền 100%
      if (tx.payment) {
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            provider: "BANK_TRANSFER",
            amount: refundedFee,
            status: "REFUND_PENDING",
            txnRef: `REFUND-COACH-${coachBooking.id}`,
            paidAt: null,
            rawPayload: {
              type: "COACH_CANCEL_REFUND",
              coachBookingId: coachBooking.id,
              refundedFee,
              reason: cleanReason,
            },
          },
        });
      }

      // 2. Đặt trạng thái thanh toán của đơn thành REFUND_PENDING
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "REFUND_PENDING",
        },
      });

      // 3. Ghi nhận dòng giá chiết khấu/hoàn tiền 100% phí HLV
      await tx.bookingPriceLine.create({
        data: {
          bookingId: booking.id,
          type: "DISCOUNT",
          amount: refundedFee,
          label: `Hoàn 100% phí HLV (HLV hủy: ${cleanReason})`,
        },
      });

      // 4. Gửi thông báo cho khách hàng
      if (booking.userId) {
        await tx.notification.create({
          data: {
            userId: booking.userId,
            type: "BOOKING_CANCELLED",
            title: "Huấn luyện viên đã hủy buổi dạy",
            body: `HLV đã hủy buổi dạy cho đơn ${booking.code} (${cleanReason}). 100% phí HLV (${refundedFee.toLocaleString("vi-VN")}đ) đang được xử lý hoàn tiền. Sân của bạn vẫn được giữ nguyên.`,
          },
        });
      }
    } else {
      // Đơn chưa thanh toán: khấu trừ phí HLV ra khỏi tổng tiền cần thanh toán
      const nextSubtotal = Math.max(0, booking.subtotal - refundedFee);
      const nextTotal = Math.max(0, booking.total - refundedFee);

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          subtotal: nextSubtotal,
          total: nextTotal,
        },
      });

      // Xóa dòng giá HLV khỏi BookingPriceLine
      await tx.bookingPriceLine.deleteMany({
        where: {
          bookingId: booking.id,
          type: "COACH",
        },
      });
    }

    return { success: true, refundedFee };
  });
}

