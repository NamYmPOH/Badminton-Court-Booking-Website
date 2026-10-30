import type { Prisma } from "@prisma/client";
import { PaymentError } from "./sepay";

export type Operator = { id: string; role: string; status: string };
export function operatorVenueScope(actor: Operator): Prisma.VenueWhereInput {
  if (actor.status !== "ACTIVE") {
    throw new PaymentError(403, "Tài khoản của bạn đang bị khóa hoặc không hoạt động.");
  }
  if (actor.role === "ADMIN") {
    return {};
  }
  if (actor.role === "OWNER") {
    return {
      OR: [
        { ownerId: actor.id },
        {
          status: "ACTIVE",
          staff: {
            some: {
              userId: actor.id,
              isActive: true,
            },
          },
        },
      ],
    };
  }
  if (actor.role === "STAFF") {
    return {
      status: "ACTIVE",
      staff: {
        some: {
          userId: actor.id,
          isActive: true,
        },
      },
    };
  }
  throw new PaymentError(403, "Bạn không có quyền quản lý sân.");
}
