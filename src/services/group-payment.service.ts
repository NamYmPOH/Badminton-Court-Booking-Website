import { randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import { serializable } from "../lib/transaction";
import { canPayBooking } from "../lib/booking-payment";
import {
  createVietQrUrl,
  PaymentError,
  type SepayConfig,
  type SepayEvent,
} from "../lib/sepay";
import {
  groupTotals,
  slotTime,
  splitAmounts,
  ticketValue,
  validTicket,
  type GroupAction,
} from "../lib/group-payment";
import { operatorVenueScope } from "../lib/venue-operations";

const include = {
  booking: { include: { items: { include: { court: true } }, venue: true } },
  shares: {
    orderBy: { position: "asc" as const },
    include: { user: { select: { name: true } } },
  },
  intents: true,
} satisfies Prisma.BookingGroupInclude;
type Group = Prisma.BookingGroupGetPayload<{ include: typeof include }>;
type Tx = Prisma.TransactionClient;
type Bank = Pick<
  SepayConfig,
  | "BANK_BIN"
  | "BANK_ACCOUNT_NO"
  | "BANK_ACCOUNT_NAME"
  | "SEPAY_BANK_GATEWAY"
  | "SEPAY_SUB_ACCOUNT"
>;
const token = () => randomBytes(24).toString("hex");

async function activeUser(tx: Tx, id: string) {
  const user = await tx.user.findUnique({ where: { id } });
  if (!user || user.status !== "ACTIVE")
    throw new PaymentError(403, "Tài khoản không hoạt động.");
  return user;
}
async function operator(tx: Tx, userId: string, venueId: string) {
  const user = await activeUser(tx, userId);
  const venue = await tx.venue.findFirst({
    where: { id: venueId, ...operatorVenueScope(user) },
    select: { id: true },
  });
  if (!venue)
    throw new PaymentError(403, "Bạn không được phân quyền tại sân này.");
  return user;
}
async function load(tx: Tx, inviteToken: string) {
  const group = await tx.bookingGroup.findUnique({
    where: { inviteToken },
    include,
  });
  if (!group) throw new PaymentError(404, "Không tìm thấy nhóm.");
  return group;
}
function live(group: Group, online = true) {
  const b = group.booking;
  if (
    group.closedAt ||
    !["PENDING_PAYMENT", "CONFIRMED"].includes(b.status) ||
    b.paymentStatus === "PAID"
  )
    return false;
  if (b.status === "PENDING_PAYMENT") return canPayBooking(b);
  return (
    b.items.length > 0 &&
    b.items.every((i) => i.status === "CONFIRMED") &&
    (!online || b.items.every((i) => slotTime(i) > Date.now()))
  );
}
function assertLive(group: Group, online = true) {
  if (!live(group, online))
    throw new PaymentError(
      409,
      "Đơn đã hết hạn, đã trả đủ hoặc không còn cho phép thanh toán.",
    );
}
function selected(group: Group, ids: string[]) {
  const shares = group.shares.filter((s) => ids.includes(s.id));
  if (
    !ids.length ||
    shares.length !== ids.length ||
    shares.some((s) => s.paymentId)
  )
    throw new PaymentError(
      409,
      "Phần tiền đã được trả hoặc không thuộc nhóm. Hãy tải lại.",
    );
  return shares;
}
async function audit(
  tx: Tx,
  actorId: string,
  group: Group,
  action: string,
  reason: string,
  details: Prisma.InputJsonObject,
) {
  const actor = await activeUser(tx, actorId);
  await tx.adminAudit.create({
    data: {
      actorId,
      actorName: actor.name,
      action: `GROUP_${action}`,
      entityId: group.bookingId,
      reason,
      details,
    },
  });
}

async function newIntent(
  tx: Tx,
  group: Group,
  payerId: string,
  shareIds: string[],
  config?: SepayConfig,
) {
  if (!config)
    throw new PaymentError(
      503,
      "Thanh toán online chưa sẵn sàng. Bạn có thể yêu cầu trả tại sân.",
    );
  const shares = selected(group, shareIds);
  // Any takeover closes the entire old intent; the caller must cover all its unpaid shares.
  const oldIds = Array.from(
    new Set(
      shares.map((s) => s.currentIntentId).filter((s): s is string => !!s),
    ),
  );
  const affected = group.shares.filter(
    (s) =>
      !s.paymentId && s.currentIntentId && oldIds.includes(s.currentIntentId),
  );
  if (affected.some((s) => !shareIds.includes(s.id)))
    throw new PaymentError(
      409,
      "Các phần này nằm trong một mã trả thay. Hãy chọn toàn bộ phần trong mã đó.",
    );
  await tx.groupPaymentIntent.updateMany({
    where: { id: { in: oldIds }, status: "OPEN" },
    data: { status: "SUPERSEDED" },
  });
  const bank: Bank = {
    BANK_BIN: config.BANK_BIN,
    BANK_ACCOUNT_NO: config.BANK_ACCOUNT_NO,
    BANK_ACCOUNT_NAME: config.BANK_ACCOUNT_NAME,
    SEPAY_BANK_GATEWAY: config.SEPAY_BANK_GATEWAY,
    SEPAY_SUB_ACCOUNT: config.SEPAY_SUB_ACCOUNT,
  };
  const intent = await tx.groupPaymentIntent.create({
    data: {
      groupId: group.id,
      code: `GP${randomBytes(12).toString("hex").toUpperCase()}`,
      payerId,
      amount: shares.reduce((n, s) => n + s.amount, 0),
      shareIds,
      bank,
    },
  });
  await tx.groupShare.updateMany({
    where: { id: { in: shareIds }, paymentId: null },
    data: { currentIntentId: intent.id, cashRequested: false },
  });
  return intent;
}

export async function sync(tx: Tx, groupId: string) {
  const g = await tx.bookingGroup.findUniqueOrThrow({
    where: { id: groupId },
    include,
  });
  const totals = groupTotals(g.shares);
  if (totals.total !== g.booking.total)
    throw new PaymentError(409, "Bảng chia không khớp tổng đơn.");
  const paid = totals.remaining === 0;
  const confirm = paid || totals.canConfirm;
  await tx.booking.update({
    where: { id: g.bookingId },
    data: {
      paymentStatus: paid
        ? "PAID"
        : totals.received > 0
          ? "PARTIALLY_PAID"
          : "PENDING",
      ...(confirm ? { status: "CONFIRMED", expiresAt: null } : {}),
    },
  });
  if (confirm) {
    await tx.bookingItem.updateMany({
      where: { bookingId: g.bookingId, status: "HELD" },
      data: { status: "CONFIRMED" },
    });
    if (tx.coachBooking) {
      await tx.coachBooking.updateMany({
        where: { bookingItem: { bookingId: g.bookingId }, status: "HELD" },
        data: { status: "CONFIRMED", expiresAt: null },
      });
    }
  }
  if (paid)
    await tx.groupPaymentIntent.updateMany({
      where: { groupId, status: "OPEN" },
      data: { status: "CLOSED" },
    });
}

export async function closeGroup(
  tx: Tx,
  groupId: string,
  expired: boolean,
  reason: string,
) {
  const g = await tx.bookingGroup.findUniqueOrThrow({
    where: { id: groupId },
    include,
  });
  if (g.closedAt) return;
  const now = new Date();
  const items = g.booking.items ?? [];
  const start = items.length > 0 ? Math.min(...items.map((i) => slotTime(i))) : now.getTime();
  const hours = (start - now.getTime()) / 3600000;
  const rate =
    expired || g.booking.status === "PENDING_PAYMENT" || hours > 24
      ? 1
      : hours >= 12
        ? 0.5
        : 0;
  const payments = await tx.payment.findMany({
    where: { bookingId: g.bookingId, status: "PAID" },
    orderBy: { id: "asc" },
  });
  const refundTotal = Math.floor(
    payments.reduce((n, p) => n + p.amount, 0) * rate,
  );
  let remaining = refundTotal;
  for (let i = 0; i < payments.length; i++) {
    const p = payments[i];
    const amount =
      i === payments.length - 1 ? remaining : Math.floor(p.amount * rate);
    remaining -= amount;
    if (amount > 0) {
      await tx.groupRefund.create({
        data: { paymentId: p.id, amount, reason },
      });
      await tx.payment.update({
        where: { id: p.id },
        data: { status: "REFUND_PENDING" },
      });
    }
  }
  await tx.groupPaymentIntent.updateMany({
    where: { groupId, status: "OPEN" },
    data: { status: "CLOSED" },
  });
  await tx.bookingGroup.update({
    where: { id: groupId },
    data: { closedAt: now },
  });
  await tx.bookingItem.updateMany({
    where: { bookingId: g.bookingId, status: { in: ["HELD", "CONFIRMED"] } },
    data: { status: expired ? "EXPIRED" : "CANCELLED" },
  });
  if (tx.coachBooking) {
    await tx.coachBooking.updateMany({
      where: { bookingItem: { bookingId: g.bookingId }, status: { in: ["HELD", "CONFIRMED"] } },
      data: { status: "CANCELLED", cancelledAt: expired ? null : now, cancelReason: reason },
    });
  }
  await tx.booking.update({
    where: { id: g.bookingId },
    data: {
      status: expired ? "EXPIRED" : "CANCELLED",
      expiresAt: null,
      cancelledAt: expired ? null : now,
      cancelReason: reason,
      paymentStatus:
        refundTotal > 0 ? "REFUND_PENDING" : g.booking.paymentStatus,
    },
  });
}

async function expire(tx: Tx, group: Group) {
  if (
    group.booking.status === "PENDING_PAYMENT" &&
    (!group.booking.expiresAt || group.booking.expiresAt <= new Date())
  ) {
    await closeGroup(
      tx,
      group.id,
      true,
      "Hết hạn giữ sân khi nhóm chưa hoàn tất thanh toán",
    );
    return load(tx, group.inviteToken);
  }
  return group;
}

export async function createGroup(
  db: PrismaClient,
  userId: string,
  input: { bookingCode: string; count: number; amounts?: number[] },
  config?: SepayConfig,
) {
  return serializable(db, async (tx) => {
    await activeUser(tx, userId);
    const b = await tx.booking.findFirst({
      where: { code: input.bookingCode, userId },
      include: { items: true, group: true, payments: true },
    });
    if (!b) throw new PaymentError(404, "Không tìm thấy đơn của bạn.");
    if (b.group) return { inviteToken: b.group.inviteToken };
    if (
      b.status !== "PENDING_PAYMENT" ||
      !canPayBooking(b) ||
      b.payments.length
    )
      throw new PaymentError(
        409,
        "Chỉ chia nhóm khi đơn đang giữ chỗ và chưa ghi nhận khoản thu.",
      );
    const amounts = splitAmounts(b.total, input.count, input.amounts);
    const g = await tx.bookingGroup.create({
      data: {
        bookingId: b.id,
        inviteToken: token(),
        shares: {
          create: amounts.map((amount, i) => ({
            amount,
            position: i + 1,
            label: i === 0 ? "Trưởng nhóm" : `Thành viên ${i + 1}`,
            userId: i === 0 ? userId : null,
            ticketNonce: token(),
          })),
        },
      },
      include,
    });
    // Touch the booking so a concurrent legacy settlement cannot commit unnoticed.
    await tx.booking.update({
      where: { id: b.id },
      data: { paymentMethod: "BANK_TRANSFER", updatedAt: new Date() },
    });
    if (config) await newIntent(tx, g, userId, [g.shares[0].id], config);
    return { inviteToken: g.inviteToken };
  });
}

export async function groupAction(
  db: PrismaClient,
  userId: string,
  inviteToken: string,
  input: GroupAction,
  config?: SepayConfig,
) {
  return serializable(db, async (tx) => {
    await activeUser(tx, userId);
    const g = await load(tx, inviteToken);
    const leader = g.booking.userId === userId;
    const own = g.shares.find((s) => s.userId === userId);
    const staffAction = [
      "APPROVE_CASH",
      "COLLECT_CASH",
      "CHECK_IN_TICKET",
      "REFUND_DONE",
    ].includes(input.action);
    if (staffAction || (input.action === "CANCEL" && !leader))
      await operator(tx, userId, g.booking.venueId);
    else if (!leader && !own && input.action !== "JOIN")
      throw new PaymentError(403, "Bạn chưa tham gia nhóm này.");

    if (input.action === "JOIN") {
      if (own) return { success: true };
      if (
        g.closedAt ||
        !["PENDING_PAYMENT", "CONFIRMED"].includes(g.booking.status) ||
        (g.booking.status === "PENDING_PAYMENT" &&
          (!g.booking.expiresAt || g.booking.expiresAt <= new Date()))
      )
        throw new PaymentError(409, "Nhóm không còn nhận thành viên.");
      const share = g.shares.find(
        (s) => !s.userId && (input.position === undefined || s.position === input.position),
      );
      if (!share)
        throw new PaymentError(409, "Vị trí này đã có người tham gia.");
      await tx.groupShare.update({ where: { id: share.id }, data: { userId } });
      if (!share.paymentId && !share.currentIntentId && config && live(g))
        await newIntent(tx, g, userId, [share.id], config);
    } else if (input.action === "METHOD") {
      assertLive(g);
      if (!own || own.paymentId)
        throw new PaymentError(409, "Phần của bạn đã được trả.");
      const current = g.intents.find(
        (i) => i.id === own.currentIntentId && i.status === "OPEN",
      );
      if (current && current.payerId !== userId)
        throw new PaymentError(
          409,
          "Trưởng nhóm đang trả thay phần này. Hãy liên hệ trưởng nhóm trước khi trả thêm.",
        );
      if (input.method === "CASH") {
        await tx.groupShare.update({
          where: { id: own.id },
          data: { cashRequested: true },
        });
        const venueStaff = await tx.venueStaff.findMany({
          where: { venueId: g.booking.venueId },
          select: { userId: true },
        });
        const recipientIds = Array.from(
          new Set([g.booking.venue.ownerId, ...venueStaff.map((s) => s.userId)]),
        );
        if (recipientIds.length > 0) {
          await tx.notification.createMany({
            data: recipientIds.map((targetId) => ({
              id: token(),
              userId: targetId,
              type: "SYSTEM" as const,
              title: `Yêu cầu thanh toán tiền mặt (${g.booking.code})`,
              body: `Khách ${own.user?.name || own.label} yêu cầu trả tiền mặt phần ${own.position} (${own.amount.toLocaleString("vi-VN")} đ) tại sân.`,
              data: {
                bookingCode: g.booking.code,
                inviteToken: g.inviteToken,
                shareId: own.id,
                amount: own.amount,
              },
            })),
          });
        }
      } else if (current)
        await tx.groupShare.update({
          where: { id: own.id },
          data: { cashRequested: false },
        });
      else await newIntent(tx, g, userId, [own.id], config);
    } else if (input.action === "COVER") {
      assertLive(g);
      if (!leader)
        throw new PaymentError(403, "Chỉ trưởng nhóm được tạo mã trả thay.");
      // Repeated requests reuse the same live intent instead of invalidating a QR in use.
      const same = g.intents.find(
        (i) =>
          i.status === "OPEN" &&
          i.payerId === userId &&
          i.shareIds.length === input.shareIds.length &&
          i.shareIds.every((id) => input.shareIds.includes(id)),
      );
      if (!same) await newIntent(tx, g, userId, input.shareIds, config);
    } else if (input.action === "REQUEST_CASH_ALL") {
      assertLive(g);
      if (!leader)
        throw new PaymentError(
          403,
          "Chỉ trưởng nhóm được xin trả phần còn lại tại sân.",
        );
      await tx.groupShare.updateMany({
        where: { groupId: g.id, paymentId: null },
        data: { cashRequested: true },
      });
    } else if (input.action === "APPROVE_CASH") {
      assertLive(g, false);
      const shares = selected(g, input.shareIds);
      if (shares.some((s) => !s.cashRequested))
        throw new PaymentError(
          409,
          "Chỉ duyệt các phần đã yêu cầu trả tiền mặt.",
        );
      await tx.groupShare.updateMany({
        where: { id: { in: input.shareIds } },
        data: { cashApprovedAt: new Date() },
      });
      await sync(tx, g.id);
      await audit(tx, userId, g, input.action, input.reason, {
        shareIds: input.shareIds,
      });
    } else if (input.action === "COLLECT_CASH") {
      assertLive(g, false);
      const shares = selected(g, input.shareIds);
      const payment = await tx.payment.create({
        data: {
          bookingId: g.bookingId,
          provider: "CASH",
          amount: shares.reduce((n, s) => n + s.amount, 0),
          status: "PAID",
          txnRef: `GROUP-CASH-${token()}`,
          paidAt: new Date(),
          rawPayload: { collectedBy: userId, shareIds: input.shareIds },
        },
      });
      await tx.groupShare.updateMany({
        where: { id: { in: input.shareIds }, paymentId: null },
        data: { paymentId: payment.id, cashRequested: true, cashApprovedAt: new Date() },
      });
      // The old bank intent remains recognizable, but cannot settle shares already collected.
      await sync(tx, g.id);
      await audit(tx, userId, g, input.action, input.reason, {
        paymentId: payment.id,
        amount: payment.amount,
        shareIds: input.shareIds,
      });
    } else if (input.action === "CHECK_IN_TICKET") {
      const share = g.shares.find((s) =>
        input.ticket.startsWith(`GT.${s.id}.`),
      );
      const now = Date.now();
      if (
        !share ||
        !share.userId ||
        !validTicket(input.ticket, share) ||
        share.checkedInAt ||
        g.closedAt ||
        g.booking.paymentStatus !== "PAID" ||
        !["CONFIRMED", "CHECKED_IN"].includes(g.booking.status) ||
        !g.booking.items.some(
          (i) => now >= slotTime(i) - 15 * 60000 && now < slotTime(i, i.endMin),
        )
      )
        throw new PaymentError(
          409,
          "Vé không hợp lệ, đã sử dụng hoặc ngoài khung giờ nhận sân.",
        );
      await tx.groupShare.update({
        where: { id: share.id },
        data: { checkedInAt: new Date(), checkedInBy: userId },
      });
      await tx.booking.update({
        where: { id: g.bookingId },
        data: { status: "CHECKED_IN" },
      });
      await audit(tx, userId, g, input.action, input.reason, {
        shareId: share.id,
      });
    } else if (input.action === "CANCEL") {
      if (
        g.closedAt ||
        !["PENDING_PAYMENT", "CONFIRMED"].includes(g.booking.status)
      )
        throw new PaymentError(409, "Không thể hủy đơn ở trạng thái hiện tại.");
      const expired =
        g.booking.status === "PENDING_PAYMENT" &&
        (!g.booking.expiresAt || g.booking.expiresAt <= new Date());
      await closeGroup(tx, g.id, expired, input.reason);
      await audit(tx, userId, g, input.action, input.reason, {});
    } else if (input.action === "REFUND_DONE") {
      const refund = await tx.groupRefund.findFirst({
        where: {
          id: input.refundId,
          status: "PENDING",
          payment: { bookingId: g.bookingId },
        },
      });
      if (!refund)
        throw new PaymentError(409, "Không còn yêu cầu hoàn tiền này.");
      await tx.groupRefund.update({
        where: { id: refund.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          reference: input.reference,
        },
      });
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: { status: "REFUNDED" },
      });
      if (
        !(await tx.groupRefund.count({
          where: { status: "PENDING", payment: { bookingId: g.bookingId } },
        }))
      )
        await tx.booking.update({
          where: { id: g.bookingId },
          data: { paymentStatus: "REFUNDED" },
        });
      await audit(tx, userId, g, input.action, input.reason, {
        refundId: refund.id,
        amount: refund.amount,
        reference: input.reference,
      });
    }
    return { success: true };
  });
}

export async function settleGroupTransfer(
  tx: Tx,
  code: string,
  event: SepayEvent,
) {
  const intent = await tx.groupPaymentIntent.findUnique({
    where: { code },
    include: { group: { include } },
  });
  if (!intent) return { result: "REVIEW_GROUP_CODE", bookingCode: null };
  const g = await expire(tx, intent.group);
  const bank = intent.bank as Bank;
  let result: string;
  if (
    event.accountNumber !== bank.BANK_ACCOUNT_NO ||
    event.gateway.toLowerCase() !== bank.SEPAY_BANK_GATEWAY.toLowerCase() ||
    (bank.SEPAY_SUB_ACCOUNT && bank.SEPAY_SUB_ACCOUNT !== event.subAccount)
  )
    result = "REVIEW_WRONG_ACCOUNT";
  else if (!live(g) || intent.status !== "OPEN") result = "REVIEW_GROUP_CLOSED";
  else if (event.transferAmount !== intent.amount)
    result = "REVIEW_AMOUNT_MISMATCH";
  else {
    const shares = g.shares.filter((s) => intent.shareIds.includes(s.id));
    if (
      shares.length !== intent.shareIds.length ||
      shares.some((s) => s.paymentId || s.currentIntentId !== intent.id) ||
      shares.reduce((n, s) => n + s.amount, 0) !== intent.amount
    )
      result = "REVIEW_GROUP_ALREADY_SETTLED";
    else {
      const p = await tx.payment.create({
        data: {
          bookingId: g.bookingId,
          provider: "BANK_TRANSFER",
          amount: intent.amount,
          status: "PAID",
          txnRef: `SEPAY-${event.id}`,
          providerTxnNo: String(event.id),
          paidAt: new Date(),
          rawPayload: {
            ...event,
            groupIntentId: intent.id,
            initiatedBy: intent.payerId,
          } as Prisma.InputJsonObject,
        },
      });
      await tx.groupShare.updateMany({
        where: { id: { in: intent.shareIds }, paymentId: null },
        data: { paymentId: p.id },
      });
      await tx.groupPaymentIntent.update({
        where: { id: intent.id },
        data: { status: "PAID" },
      });
      await sync(tx, g.id);
      result = "GROUP_PAID";
    }
  }
  return { result, bookingCode: g.booking.code };
}

export async function getGroupView(
  db: PrismaClient,
  userId: string,
  inviteToken: string,
) {
  const data = await serializable(db, async (tx) => {
    const actor = await activeUser(tx, userId);
    let g = await load(tx, inviteToken);
    let isOperator = false;
    if (["ADMIN", "OWNER", "STAFF"].includes(actor.role))
      isOperator = !!(await tx.venue.findFirst({
        where: { id: g.booking.venueId, ...operatorVenueScope(actor) },
        select: { id: true },
      }));
    const leader = g.booking.userId === userId;
    const own = g.shares.find((s) => s.userId === userId);
    // Invitation holders can only see join slots, public venue info and their proposed amounts.
    g = await expire(tx, g);
    const totals = groupTotals(g.shares);
    const privileged = leader || isOperator;
    const member = privileged || !!own;
    const refunds = member
      ? await tx.groupRefund.findMany({
          where: { payment: { bookingId: g.bookingId } },
          include: {
            payment: { select: { txnRef: true, provider: true, amount: true } },
          },
        })
      : [];
    const myPayments = new Set(
      g.shares.filter((s) => s.userId === userId).map((s) => s.paymentId),
    );
    const myIntentIds = new Set(
      g.intents.filter((i) => i.payerId === userId).map((i) => i.id),
    );
    const paidForIds = new Set(
      g.intents.filter((i) => myIntentIds.has(i.id)).flatMap((i) => i.shareIds),
    );
    g.shares
      .filter((s) => paidForIds.has(s.id))
      .forEach((s) => myPayments.add(s.paymentId));
    const canTicket =
      !!own &&
      !g.closedAt &&
      ["CONFIRMED", "CHECKED_IN"].includes(g.booking.status) &&
      g.booking.paymentStatus === "PAID";
    return {
      id: g.id,
      viewerId: userId,
      code: member ? g.booking.code : null,
      venueName: g.booking.venue.name,
      status: g.booking.status,
      paymentStatus: g.booking.paymentStatus,
      expiresAt: g.booking.expiresAt?.toISOString() || null,
      ...totals,
      received: member ? totals.received : 0,
      remaining: member ? totals.remaining : totals.total,
      canConfirm: member && totals.canConfirm,
      isLeader: leader,
      isOperator,
      isMember: !!own,
      ownShareId: own?.id || null,
      closed: !!g.closedAt,
      canPay: live(g),
      canCollect: live(g, false),
      canJoin: !g.closedAt && ["PENDING_PAYMENT", "CONFIRMED"].includes(g.booking.status) &&
        (g.booking.status !== "PENDING_PAYMENT" || !!g.booking.expiresAt && g.booking.expiresAt > new Date()),
      items: g.booking.items.map((i) => ({
        courtName: i.court.name,
        date: i.date.toISOString().slice(0, 10),
        startMin: i.startMin,
        endMin: i.endMin,
      })),
      shares: g.shares.map((s) => ({
        id: s.id,
        position: s.position,
        isLeader: s.userId === g.booking.userId,
        label: member ? s.user?.name || s.label : s.label,
        amount: s.amount,
        joined: !!s.userId,
        paid: member ? !!s.paymentId : false,
        cashRequested: member && s.cashRequested,
        cashApproved: member && !!s.cashApprovedAt,
        checkedIn: member && !!s.checkedInAt,
        coveredByLeader:
          member &&
          !!s.currentIntentId &&
          g.intents.some(
            (i) =>
              i.id === s.currentIntentId &&
              i.payerId !== s.userId &&
              i.status === "OPEN",
          ),
      })),
      intents: live(g)
        ? g.intents
            .filter(
              (i) =>
                i.payerId === userId &&
                i.status === "OPEN" &&
                g.shares
                  .filter((s) => i.shareIds.includes(s.id))
                  .every((s) => !s.paymentId && s.currentIntentId === i.id),
            )
            .map((i) => {
              const bank = i.bank as Bank;
              return {
                id: i.id,
                code: i.code,
                amount: i.amount,
                shareIds: i.shareIds,
                bank: {
                  name: bank.SEPAY_BANK_GATEWAY,
                  accountNo: bank.BANK_ACCOUNT_NO,
                  accountName: bank.BANK_ACCOUNT_NAME,
                },
                qrUrl: createVietQrUrl(i.amount, i.code, bank),
              };
            })
        : [],
      ticket: canTicket ? ticketValue(own!) : null,
      refunds: refunds
        .filter((r) => privileged || myPayments.has(r.paymentId))
        .map((r) => ({
          id: r.id,
          amount: r.amount,
          status: r.status,
          reference: r.reference,
          txnRef: privileged ? r.payment.txnRef : undefined,
        })),
    };
  });
  return {
    ...data,
    ticketQr: data.ticket
      ? await QRCode.toDataURL(data.ticket, { width: 280, margin: 2 })
      : null,
  };
}

export async function expireGroups(db: PrismaClient) {
  const groups = await db.bookingGroup.findMany({
    where: {
      closedAt: null,
      booking: { status: "PENDING_PAYMENT", expiresAt: { lte: new Date() } },
    },
    select: { id: true },
    take: 100,
  });
  for (const g of groups)
    await serializable(db, async (tx) => {
      const fresh = await tx.bookingGroup.findUniqueOrThrow({
        where: { id: g.id },
        include,
      });
      await expire(tx, fresh);
    });
  return groups.length;
}
