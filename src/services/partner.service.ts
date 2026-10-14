import type { PrismaClient } from "@prisma/client";
import { db } from "../lib/db";
import { PaymentError } from "../lib/sepay";
import {
  partnerProfileInputSchema,
  partnerOfferInputSchema,
  partnerMemberInputSchema,
  assertPartnerActive,
  assertPartnerMemberRole,
  calculateOfferDiscount,
  type PartnerProfileInput,
  type PartnerOfferInput,
} from "../lib/partner-policy";
import { serializable } from "./sepay.service";

export interface PublicOfferItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerLogo: string | null;
  voucherCode: string;
  title: string;
  description: string | null;
  voucherType: "PERCENT" | "FIXED";
  voucherValue: number;
  maxDiscount: number | null;
  minAmount: number;
  validFrom: string;
  validTo: string;
  sponsor: string;
  budget: number;
  usedBudget: number;
  remainingBudget: number;
}

// ───────────── Public Queries ─────────────

export async function getPublicOffers(
  database: PrismaClient = db,
  options: { venueId?: string; limit?: number } = {}
): Promise<PublicOfferItem[]> {
  const now = new Date();
  const limit = Math.min(50, Math.max(1, options.limit || 20));

  const offers = await database.partnerOffer.findMany({
    where: {
      status: "ACTIVE",
      partner: { status: "ACTIVE" },
      voucher: {
        isActive: true,
        validFrom: { lte: now },
        validTo: { gt: now },
      },
    },
    include: {
      partner: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
      voucher: true,
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // Lọc theo ngân sách và điều kiện cơ sở
  const availableOffers = offers.filter((offer) => {
    // 1. Kiểm tra ngân sách
    if (offer.usedBudget >= offer.budget) return false;
    // 2. Kiểm tra giới hạn lượt dùng
    if (offer.maxUsage && offer.currentUsage >= offer.maxUsage) return false;
    // 3. Kiểm tra cơ sở áp dụng nếu có điều kiện
    if (options.venueId && offer.termsSnapshot && typeof offer.termsSnapshot === "object") {
      const terms = offer.termsSnapshot as { applicableVenueIds?: string[] };
      if (
        Array.isArray(terms.applicableVenueIds) &&
        terms.applicableVenueIds.length > 0 &&
        !terms.applicableVenueIds.includes(options.venueId)
      ) {
        return false;
      }
    }
    return true;
  });

  return availableOffers.map((o) => ({
    id: o.id,
    partnerId: o.partnerId,
    partnerName: o.partner.name,
    partnerLogo: o.partner.logoUrl,
    voucherCode: o.voucher.code,
    title: o.title,
    description: o.description,
    voucherType: o.voucher.type,
    voucherValue: o.voucher.value,
    maxDiscount: o.voucher.maxDiscount,
    minAmount: o.voucher.minAmount,
    validFrom: o.voucher.validFrom.toISOString(),
    validTo: o.voucher.validTo.toISOString(),
    sponsor: o.sponsor,
    budget: o.budget,
    usedBudget: o.usedBudget,
    remainingBudget: Math.max(0, o.budget - o.usedBudget),
  }));
}

export async function validateAndQuoteOffer(
  database: PrismaClient = db,
  code: string,
  venueId: string,
  courtSubtotal: number
) {
  const normalizedCode = code.trim().toUpperCase();
  const now = new Date();

  const voucher = await database.voucher.findUnique({
    where: { code: normalizedCode },
    include: {
      partnerOffer: {
        include: {
          partner: true,
        },
      },
    },
  });

  if (!voucher || !voucher.isActive) {
    throw new PaymentError(404, "Mã ưu đãi không tồn tại hoặc đã bị khóa.");
  }

  if (voucher.validFrom > now || voucher.validTo <= now) {
    throw new PaymentError(400, "Mã ưu đãi đã hết hạn hoặc chưa đến ngày bắt đầu.");
  }

  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
    throw new PaymentError(409, "Mã ưu đãi đã hết lượt sử dụng.");
  }

  if (voucher.venueId && voucher.venueId !== venueId) {
    throw new PaymentError(400, "Mã ưu đãi không áp dụng cho cơ sở này.");
  }

  if (courtSubtotal < voucher.minAmount) {
    throw new PaymentError(
      400,
      `Đơn thuê sân tối thiểu ${voucher.minAmount.toLocaleString("vi-VN")}đ để dùng mã này.`
    );
  }

  let reservedBudget = 0;

  // Nếu là voucher của Đối tác
  if (voucher.partnerOffer) {
    const offer = voucher.partnerOffer;
    if (offer.status !== "ACTIVE" || offer.partner.status !== "ACTIVE") {
      throw new PaymentError(400, "Chương trình ưu đãi hiện không hoạt động.");
    }

    const activeUsages = await database.offerUsage.findMany({
      where: {
        offerId: offer.id,
        OR: [
          { state: "CONSUMED" },
          { state: "RESERVED", expiresAt: { gt: now } },
        ],
      },
      select: { discountAmount: true },
    });
    reservedBudget = activeUsages.reduce((sum, u) => sum + u.discountAmount, 0);
    const reservedCount = activeUsages.length;

    if (offer.usedBudget >= offer.budget || reservedBudget >= offer.budget) {
      throw new PaymentError(409, "Chương trình ưu đãi đã sử dụng hết ngân sách tài trợ.");
    }

    if (offer.maxUsage && (offer.currentUsage >= offer.maxUsage || reservedCount >= offer.maxUsage)) {
      throw new PaymentError(409, "Chương trình ưu đãi đã đạt giới hạn lượt sử dụng.");
    }

    // Kiểm tra venue terms
    if (offer.termsSnapshot && typeof offer.termsSnapshot === "object") {
      const terms = offer.termsSnapshot as { applicableVenueIds?: string[] };
      if (
        Array.isArray(terms.applicableVenueIds) &&
        terms.applicableVenueIds.length > 0 &&
        !terms.applicableVenueIds.includes(venueId)
      ) {
        throw new PaymentError(400, "Mã ưu đãi không áp dụng tại cơ sở này.");
      }
    }
  }

  const discountAmount = calculateOfferDiscount(voucher, courtSubtotal);

  if (voucher.partnerOffer) {
    const offer = voucher.partnerOffer;
    if (offer.usedBudget >= offer.budget || reservedBudget + discountAmount > offer.budget) {
      throw new PaymentError(409, "Chương trình ưu đãi đã đạt hạn mức ngân sách tài trợ.");
    }
  }

  return {
    valid: true,
    voucherId: voucher.id,
    code: voucher.code,
    discountAmount,
    partnerOfferId: voucher.partnerOffer?.id || null,
    partnerName: voucher.partnerOffer?.partner.name || null,
  };
}

// ───────────── Partner Portal Operations ─────────────

export async function registerPartner(
  database: PrismaClient = db,
  userId: string,
  rawInput: PartnerProfileInput
) {
  const input = partnerProfileInputSchema.parse(rawInput);

  return serializable(database, async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") {
      throw new PaymentError(403, "Tài khoản của bạn không hoạt động.");
    }

    const existingSlug = await tx.partner.findUnique({ where: { slug: input.slug } });
    if (existingSlug) {
      throw new PaymentError(409, "Slug thương hiệu này đã được sử dụng. Vui lòng chọn slug khác.");
    }

    const partner = await tx.partner.create({
      data: {
        name: input.name,
        slug: input.slug,
        logoUrl: input.logoUrl,
        description: input.description,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        status: "PENDING",
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: true,
      },
    });

    return partner;
  });
}

export async function getMyPartners(database: PrismaClient = db, userId: string) {
  const memberships = await database.partnerMember.findMany({
    where: { userId },
    include: {
      partner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return memberships.map((m) => ({
    memberId: m.id,
    role: m.role,
    partner: m.partner,
  }));
}

export async function addPartnerMember(
  database: PrismaClient = db,
  actorUserId: string,
  partnerId: string,
  targetEmailOrPhone: string,
  role: "OWNER" | "MANAGER" | "STAFF"
) {
  return serializable(database, async (tx) => {
    // 1. Kiểm tra actor có quyền quản trị
    const actorMember = await tx.partnerMember.findUnique({
      where: {
        partnerId_userId: {
          partnerId,
          userId: actorUserId,
        },
      },
    });
    assertPartnerMemberRole(actorMember, ["OWNER", "MANAGER"]);

    // 2. Tìm người dùng mục tiêu
    const targetUser = await tx.user.findFirst({
      where: {
        OR: [{ email: targetEmailOrPhone.trim() }, { phone: targetEmailOrPhone.trim() }],
      },
      select: { id: true, name: true, status: true },
    });
    if (!targetUser || targetUser.status !== "ACTIVE") {
      throw new PaymentError(404, "Không tìm thấy người dùng hoặc tài khoản đang bị khóa.");
    }

    return tx.partnerMember.upsert({
      where: {
        partnerId_userId: {
          partnerId,
          userId: targetUser.id,
        },
      },
      create: {
        partnerId,
        userId: targetUser.id,
        role,
      },
      update: {
        role,
      },
    });
  });
}

export async function createPartnerOffer(
  database: PrismaClient = db,
  actorUserId: string,
  rawInput: PartnerOfferInput
) {
  const input = partnerOfferInputSchema.parse(rawInput);

  return serializable(database, async (tx) => {
    const actorMember = await tx.partnerMember.findUnique({
      where: {
        partnerId_userId: {
          partnerId: input.partnerId,
          userId: actorUserId,
        },
      },
    });
    assertPartnerMemberRole(actorMember, ["OWNER", "MANAGER"]);

    const partner = await tx.partner.findUnique({ where: { id: input.partnerId } });
    assertPartnerActive(partner);

    // Kiểm tra mã voucher không trùng lặp trên toàn hệ thống
    const existingVoucher = await tx.voucher.findUnique({
      where: { code: input.voucher.code },
    });
    if (existingVoucher) {
      throw new PaymentError(409, "Mã voucher này đã tồn tại trên hệ thống. Vui lòng chọn mã khác.");
    }

    // 1. Tạo Voucher
    const voucher = await tx.voucher.create({
      data: {
        code: input.voucher.code,
        type: input.voucher.type,
        value: input.voucher.value,
        maxDiscount: input.voucher.maxDiscount,
        minAmount: input.voucher.minAmount,
        validFrom: new Date(input.voucher.validFrom),
        validTo: new Date(input.voucher.validTo),
        usageLimit: input.maxUsage || null,
        isActive: false, // Chưa kích hoạt cho đến khi Admin duyệt Offer
      },
    });

    // 2. Tạo PartnerOffer
    const offer = await tx.partnerOffer.create({
      data: {
        partnerId: input.partnerId,
        voucherId: voucher.id,
        title: input.title,
        description: input.description,
        sponsor: input.sponsor,
        budget: input.budget,
        usedBudget: 0,
        maxUsage: input.maxUsage || null,
        currentUsage: 0,
        status: "DRAFT",
        termsSnapshot: input.terms ? (input.terms as unknown as object) : undefined,
      },
      include: {
        voucher: true,
        partner: true,
      },
    });

    return offer;
  });
}

export async function submitPartnerOfferForReview(
  database: PrismaClient = db,
  actorUserId: string,
  offerId: string
) {
  return serializable(database, async (tx) => {
    const offer = await tx.partnerOffer.findUnique({ where: { id: offerId } });
    if (!offer) throw new PaymentError(404, "Không tìm thấy chương trình ưu đãi.");

    const actorMember = await tx.partnerMember.findUnique({
      where: {
        partnerId_userId: {
          partnerId: offer.partnerId,
          userId: actorUserId,
        },
      },
    });
    assertPartnerMemberRole(actorMember, ["OWNER", "MANAGER"]);

    if (offer.status !== "DRAFT" && offer.status !== "REJECTED") {
      throw new PaymentError(409, "Chương trình ưu đãi không ở trạng thái Bản nháp.");
    }

    return tx.partnerOffer.update({
      where: { id: offerId },
      data: { status: "PENDING_REVIEW" },
    });
  });
}

export async function getMyPartnerOffers(
  database: PrismaClient = db,
  actorUserId: string,
  partnerId: string
) {
  const actorMember = await database.partnerMember.findUnique({
    where: {
      partnerId_userId: {
        partnerId,
        userId: actorUserId,
      },
    },
  });
  if (!actorMember) {
    throw new PaymentError(403, "Bạn không thuộc thương hiệu đối tác này.");
  }

  const offers = await database.partnerOffer.findMany({
    where: { partnerId },
    include: {
      voucher: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    sponsor: o.sponsor,
    budget: o.budget,
    usedBudget: o.usedBudget,
    maxUsage: o.maxUsage,
    currentUsage: o.currentUsage,
    status: o.status,
    voucherCode: o.voucher.code,
    voucherType: o.voucher.type,
    voucherValue: o.voucher.value,
    validFrom: o.voucher.validFrom.toISOString(),
    validTo: o.voucher.validTo.toISOString(),
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getPartnerReport(
  database: PrismaClient = db,
  actorUserId: string,
  partnerId: string
) {
  const actorMember = await database.partnerMember.findUnique({
    where: {
      partnerId_userId: {
        partnerId,
        userId: actorUserId,
      },
    },
  });
  if (!actorMember) {
    throw new PaymentError(403, "Bạn không có quyền xem báo cáo của đối tác này.");
  }

  const [partner, offers, usages] = await Promise.all([
    database.partner.findUnique({ where: { id: partnerId } }),
    database.partnerOffer.findMany({
      where: { partnerId },
      include: { voucher: true },
    }),
    database.offerUsage.findMany({
      where: {
        offer: { partnerId },
      },
      include: {
        booking: {
          select: {
            code: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        offer: {
          select: {
            title: true,
            voucher: { select: { code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  if (!partner) throw new PaymentError(404, "Không tìm thấy đối tác.");

  const totalBudget = offers.reduce((sum, o) => sum + o.budget, 0);
  const totalUsedBudget = offers.reduce((sum, o) => sum + o.usedBudget, 0);
  const totalUsages = offers.reduce((sum, o) => sum + o.currentUsage, 0);

  return {
    partner: {
      id: partner.id,
      name: partner.name,
      status: partner.status,
    },
    metrics: {
      totalBudget,
      totalUsedBudget,
      remainingBudget: Math.max(0, totalBudget - totalUsedBudget),
      totalUsages,
      activeOffersCount: offers.filter((o) => o.status === "ACTIVE").length,
    },
    recentUsages: usages.map((u) => ({
      id: u.id,
      bookingCode: u.booking.code,
      bookingStatus: u.booking.status,
      voucherCode: u.offer.voucher.code,
      offerTitle: u.offer.title,
      discountAmount: u.discountAmount,
      state: u.state,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}
