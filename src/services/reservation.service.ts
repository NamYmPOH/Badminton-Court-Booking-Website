import { randomInt } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { type BookingRequest, priceBooking } from "../lib/booking-request";
import { buildVietQrPayload, createVietQrUrl, PaymentError, type SepayConfig } from "../lib/sepay";
import { serializable } from "./sepay.service";
import { canPayBooking } from "../lib/booking-payment";

export const bookingDetails = {
  venue: true,
  group: { select: { inviteToken: true } },
  items: {
    include: {
      court: true,
      coachBooking: {
        include: {
          coach: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  },
  priceLines: true,
} satisfies Prisma.BookingInclude;

type StoredBooking = Prisma.BookingGetPayload<{ include: typeof bookingDetails }>;

export function publicBooking(booking: StoredBooking, config?: SepayConfig) {
  const expired = booking.status === "PENDING_PAYMENT" && (!booking.expiresAt || booking.expiresAt <= new Date());
  const payable = !booking.group && canPayBooking(booking);

  const coachItem = booking.items?.find((i) => i.coachBooking);
  const coach = coachItem?.coachBooking
    ? {
        id: coachItem.coachBooking.id,
        coachId: coachItem.coachBooking.coachId,
        coachName: coachItem.coachBooking.coach.user.name,
        coachPhone: coachItem.coachBooking.coach.user.phone,
        fee: coachItem.coachBooking.fee,
        hourlyRateSnapshot: coachItem.coachBooking.hourlyRateSnapshot,
        status: coachItem.coachBooking.status,
      }
    : null;

  const priceLines = booking.priceLines
    ? booking.priceLines.map((p) => ({
        id: p.id,
        type: p.type,
        amount: p.amount,
        label: p.label,
      }))
    : [];

  return {
    id: booking.id,
    code: booking.code,
    venueId: booking.venueId,
    venueName: booking.venue?.name || "",
    venueAddress: booking.venue?.address || "",
    venueSlug: booking.venue?.slug || "",
    status: expired ? "EXPIRED" : booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod === "CASH" ? "AT_VENUE" : "BANK_TRANSFER",
    canChoosePayment: payable,
    groupToken: booking.group?.inviteToken || null,
    subtotal: booking.subtotal,
    discount: booking.discount,
    total: booking.total,
    contactName: booking.customerName,
    contactPhone: booking.customerPhone,
    note: booking.note,
    expiresAt: booking.expiresAt?.toISOString() || "",
    createdAt: booking.createdAt ? (booking.createdAt instanceof Date ? booking.createdAt.toISOString() : String(booking.createdAt)) : "",
    items: (booking.items || []).map((item) => ({
      ...item,
      date: item.date instanceof Date ? item.date.toISOString().slice(0, 10) : String(item.date).slice(0, 10),
      courtName: item.court?.name || "",
      court: undefined,
      coachBooking: undefined,
    })),
    priceLines,
    coach,
    qrUrl: payable && config
      ? createVietQrUrl(
          booking.total,
          config.SEPAY_BANK_GATEWAY.toLowerCase().includes("vietinbank") ? `SEVQR ${booking.code}` : booking.code,
          config
        )
      : null,
    qrCleanUrl: payable && config
      ? createVietQrUrl(
          booking.total,
          config.SEPAY_BANK_GATEWAY.toLowerCase().includes("vietinbank") ? `SEVQR ${booking.code}` : booking.code,
          config,
          "qr_only"
        )
      : null,
    qrPayload: payable && config
      ? buildVietQrPayload(
          config.BANK_BIN,
          config.BANK_ACCOUNT_NO,
          booking.total,
          config.SEPAY_BANK_GATEWAY.toLowerCase().includes("vietinbank") ? `SEVQR ${booking.code}` : booking.code
        )
      : null,
    paymentReference: config && config.SEPAY_BANK_GATEWAY.toLowerCase().includes("vietinbank")
      ? `SEVQR ${booking.code}`
      : booking.code,
    bank: payable && config ? { name: config.SEPAY_BANK_GATEWAY, accountNo: config.BANK_ACCOUNT_NO, accountName: config.BANK_ACCOUNT_NAME } : null,
  };
}

export async function createReservation(db: PrismaClient, userId: string, input: BookingRequest) {
  return serializable(db, async (tx) => {
    const previous = await tx.booking.findUnique({ where: { requestId: input.requestId }, include: bookingDetails });
    if (previous) {
      if (previous.userId !== userId) throw new PaymentError(409, "Yêu cầu đặt sân không hợp lệ.");
      return previous;
    }

    const venue = await tx.venue.findUnique({ where: { id: input.venueId }, include: { courts: true, pricing: true } });
    if (!venue || venue.status !== "ACTIVE") throw new PaymentError(409, "Cơ sở này chưa mở đặt sân trực tuyến.");

    const now = new Date();
    const { slots, total, date } = priceBooking(input, venue, now);
    const courtId = slots[0].courtId;
    const startMin = slots[0].startMin;
    const endMin = slots[slots.length - 1].endMin;

    const blocked = await tx.courtBlock.findFirst({ where: { courtId, date, startMin: { lt: endMin }, endMin: { gt: startMin } } });
    const conflict = await tx.bookingItem.findFirst({
      where: {
        courtId,
        date,
        startMin: { lt: endMin },
        endMin: { gt: startMin },
        status: { in: ["HELD", "CONFIRMED"] },
        booking: {
          OR: [
            { status: { in: ["CONFIRMED", "CHECKED_IN", "COMPLETED", "NO_SHOW"] } },
            { status: "PENDING_PAYMENT", expiresAt: { gt: now } },
          ],
        },
      },
    });

    if (blocked || conflict) throw new PaymentError(409, "Khung giờ vừa được đặt hoặc đã khóa. Vui lòng chọn giờ khác.");

    const pendingCount = await tx.booking.count({ where: { userId, status: "PENDING_PAYMENT", expiresAt: { gt: now } } });
    if (pendingCount >= 3) throw new PaymentError(429, "Bạn đang có 3 đơn chờ thanh toán. Vui lòng hoàn tất đơn đang có.");

    const startTime = new Date(`${input.date}T${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}:00+07:00`);
    const endTime = new Date(`${input.date}T${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}:00+07:00`);
    const durationMin = endMin - startMin;

    let coachFee = 0;
    const coachCommissionRate = 0.10;
    let coachCommissionAmount = 0;
    let coachProfile: { id: string; hourlyRate: number; status: string; user: { name: string } } | null = null;

    if (input.coachId) {
      coachProfile = await tx.coachProfile.findFirst({
        where: { id: input.coachId, status: "ACTIVE", user: { status: "ACTIVE" } },
        select: { id: true, hourlyRate: true, status: true, user: { select: { name: true } } },
      });
      if (!coachProfile) throw new PaymentError(404, "Huấn luyện viên không khả dụng hoặc chưa được kích hoạt.");

      const venueLink = await tx.coachVenue.findUnique({
        where: { coachId_venueId: { coachId: coachProfile.id, venueId: venue.id } },
      });
      if (!venueLink || venueLink.status !== "ACTIVE") {
        throw new PaymentError(409, "Huấn luyện viên chưa đăng ký hoạt động tại cơ sở này.");
      }

      coachFee = Math.round((coachProfile.hourlyRate * durationMin) / 60);
      coachCommissionAmount = Math.round(coachFee * coachCommissionRate);

      // Kiểm tra HLV có ca rảnh bao phủ khung giờ này
      const coachSlot = await tx.coachAvailability.findFirst({
        where: {
          coachId: coachProfile.id,
          venueId: venue.id,
          startsAt: { lte: startTime },
          endsAt: { gte: endTime },
        },
      });
      if (!coachSlot) {
        throw new PaymentError(409, "Huấn luyện viên không có lịch rảnh trong toàn bộ khung giờ bạn chọn.");
      }

      // Kiểm tra trùng lịch HLV trên TOÀN BỘ cơ sở
      const coachConflict = await tx.coachBooking.findFirst({
        where: {
          coachId: coachProfile.id,
          startsAt: { lt: endTime },
          endsAt: { gt: startTime },
          OR: [
            { status: "CONFIRMED" },
            { status: "HELD", expiresAt: { gt: now } },
          ],
        },
      });
      if (coachConflict) {
        throw new PaymentError(409, "Huấn luyện viên đã có lịch dạy vào khung giờ này. Vui lòng chọn giờ khác.");
      }
    }

    const courtTotal = total;
    let voucherDiscountAmount = 0;
    let appliedVoucherId: string | null = null;
    let appliedPartnerOffer: { id: string; partnerId: string; title: string } | null = null;

    if (input.voucherCode) {
      const normalizedCode = input.voucherCode.trim().toUpperCase();
      const voucher = await tx.voucher.findUnique({
        where: { code: normalizedCode },
        include: {
          partnerOffer: {
            include: { partner: true },
          },
        },
      });

      if (!voucher || !voucher.isActive) {
        throw new PaymentError(404, "Mã ưu đãi không hợp lệ hoặc đã bị khóa.");
      }

      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        throw new PaymentError(409, "Mã ưu đãi đã hết lượt sử dụng.");
      }

      if (voucher.validFrom > now || voucher.validTo <= now) {
        throw new PaymentError(400, "Mã ưu đãi đã hết hạn hoặc chưa đến ngày bắt đầu.");
      }

      if (voucher.venueId && voucher.venueId !== venue.id) {
        throw new PaymentError(400, "Mã ưu đãi không áp dụng tại cơ sở này.");
      }

      if (courtTotal < voucher.minAmount) {
        throw new PaymentError(
          400,
          `Đơn thuê sân tối thiểu ${voucher.minAmount.toLocaleString("vi-VN")}đ để sử dụng mã này.`
        );
      }

      if (voucher.partnerOffer) {
        const po = voucher.partnerOffer;
        if (po.status !== "ACTIVE" || po.partner.status !== "ACTIVE") {
          throw new PaymentError(400, "Chương trình ưu đãi đối tác hiện không hoạt động.");
        }

        if (po.termsSnapshot && typeof po.termsSnapshot === "object") {
          const terms = po.termsSnapshot as { applicableVenueIds?: string[] };
          if (
            Array.isArray(terms.applicableVenueIds) &&
            terms.applicableVenueIds.length > 0 &&
            !terms.applicableVenueIds.includes(venue.id)
          ) {
            throw new PaymentError(400, "Mã ưu đãi không áp dụng tại cơ sở này.");
          }
        }

        const activeUsages = await tx.offerUsage.findMany({
          where: {
            offerId: po.id,
            OR: [
              { state: "CONSUMED" },
              {
                state: "RESERVED",
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
            ],
          },
          select: { state: true, discountAmount: true },
        });

        const consumedBudgetFromLedger = activeUsages
          .filter((u) => u.state === "CONSUMED")
          .reduce((sum, u) => sum + u.discountAmount, 0);
        const reservedBudget = activeUsages
          .filter((u) => u.state !== "CONSUMED")
          .reduce((sum, u) => sum + u.discountAmount, 0);

        const consumedCountFromLedger = activeUsages.filter((u) => u.state === "CONSUMED").length;
        const reservedCount = activeUsages.filter((u) => u.state !== "CONSUMED").length;

        const effectiveUsedBudget = Math.max(po.usedBudget ?? 0, consumedBudgetFromLedger);
        const totalCommittedBudget = effectiveUsedBudget + reservedBudget;

        const effectiveUsageCount = Math.max(po.currentUsage ?? 0, consumedCountFromLedger);
        const totalCommittedUsage = effectiveUsageCount + reservedCount;

        let discount = 0;
        if (voucher.type === "PERCENT") {
          discount = Math.floor((courtTotal * voucher.value) / 100);
          if (voucher.maxDiscount && voucher.maxDiscount > 0) {
            discount = Math.min(discount, voucher.maxDiscount);
          }
        } else {
          discount = Math.min(voucher.value, courtTotal);
        }
        discount = Math.min(discount, courtTotal);

        if (totalCommittedBudget + discount > po.budget) {
          throw new PaymentError(409, "Chương trình ưu đãi đã đạt hạn mức ngân sách tài trợ.");
        }

        if (po.maxUsage && totalCommittedUsage + 1 > po.maxUsage) {
          throw new PaymentError(409, "Chương trình ưu đãi đã hết lượt sử dụng.");
        }

        voucherDiscountAmount = discount;
        appliedVoucherId = voucher.id;
        appliedPartnerOffer = {
          id: po.id,
          partnerId: po.partnerId,
          title: po.title,
        };
      } else {
        let discount = 0;
        if (voucher.type === "PERCENT") {
          discount = Math.floor((courtTotal * voucher.value) / 100);
          if (voucher.maxDiscount && voucher.maxDiscount > 0) {
            discount = Math.min(discount, voucher.maxDiscount);
          }
        } else {
          discount = Math.min(voucher.value, courtTotal);
        }
        voucherDiscountAmount = Math.min(discount, courtTotal);
        appliedVoucherId = voucher.id;
      }
    }

    const finalSubtotal = courtTotal + coachFee;
    const finalDiscount = voucherDiscountAmount;
    const finalTotal = Math.max(0, courtTotal - finalDiscount + coachFee);

    // Giữ chỗ 5 phút theo quyết định chốt Mục 11
    const holdDurationMinutes = 5;
    const expiresAt = new Date(Math.min(now.getTime() + holdDurationMinutes * 60 * 1000, startTime.getTime()));

    return tx.booking.create({
      data: {
        requestId: input.requestId,
        code: `DATSAN${randomInt(1000000000, 10000000000)}`,
        userId,
        venueId: venue.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        note: input.note,
        subtotal: finalSubtotal,
        discount: finalDiscount,
        total: finalTotal,
        voucherId: appliedVoucherId,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        paymentMethod: "BANK_TRANSFER",
        expiresAt,
        items: {
          create: slots.map((slot, index) => ({
            courtId,
            date,
            startMin: slot.startMin,
            endMin: slot.endMin,
            price: slot.price,
            status: "HELD",
            ...(index === 0 && coachProfile
              ? {
                  coachBooking: {
                    create: {
                      coachId: coachProfile.id,
                      startsAt: startTime,
                      endsAt: endTime,
                      fee: coachFee,
                      hourlyRateSnapshot: coachProfile.hourlyRate,
                      commissionRateSnapshot: coachCommissionRate,
                      commissionAmount: coachCommissionAmount,
                      status: "HELD",
                      expiresAt,
                    },
                  },
                }
              : {}),
          })),
        },
        ...(appliedPartnerOffer
          ? {
              offerUsages: {
                create: {
                  offerId: appliedPartnerOffer.id,
                  userId,
                  discountAmount: finalDiscount,
                  state: "RESERVED",
                  expiresAt,
                },
              },
            }
          : {}),
        priceLines: {
          create: [
            {
              type: "COURT",
              amount: courtTotal,
              label: `Tiền thuê sân (${durationMin} phút)`,
              beneficiaryId: venue.ownerId,
            },
            ...(coachProfile
              ? [
                  {
                    type: "COACH" as const,
                    amount: coachFee,
                    label: `Phí HLV ${coachProfile.user.name} (${durationMin} phút)`,
                    beneficiaryId: coachProfile.id,
                  },
                ]
              : []),
            ...(finalDiscount > 0
              ? [
                  {
                    type: "DISCOUNT" as const,
                    amount: finalDiscount,
                    label: appliedPartnerOffer
                      ? `Ưu đãi đối tác: ${appliedPartnerOffer.title}`
                      : `Giảm giá khuyến mãi`,
                    beneficiaryId: appliedPartnerOffer ? appliedPartnerOffer.partnerId : null,
                  },
                ]
              : []),
          ],
        },
      },
      include: bookingDetails,
    });
  });
}

export async function choosePaymentMethod(db: PrismaClient, userId: string, code: string, method: "CASH" | "BANK_TRANSFER") {
  return serializable(db, async (tx) => {
    const booking = await tx.booking.findFirst({ where: { code, userId }, include: bookingDetails });
    if (!booking) throw new PaymentError(404, "Không tìm thấy đơn đặt sân.");
    if (booking.group) throw new PaymentError(409, "Hãy chọn phương thức trong trang nhóm.");
    if (!canPayBooking(booking)) throw new PaymentError(409, "Đơn đã thanh toán, hết hạn hoặc không còn được giữ. Vui lòng kiểm tra lại.");
    return tx.booking.update({ where: { id: booking.id }, data: { paymentMethod: method }, include: bookingDetails });
  });
}
