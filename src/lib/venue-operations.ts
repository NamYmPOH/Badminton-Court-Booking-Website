import type { Prisma } from "@prisma/client";
import { PaymentError } from "./sepay";

export type Operator = { id: string; role: string; status: string };
export function operatorVenueScope(actor: Operator): Prisma.VenueWhereInput {
  if (actor.status !== "ACTIVE") throw new PaymentError(403, "Tài khoản không hoạt động.");
  if (actor.role === "ADMIN") return {};
  if (actor.role === "OWNER") return { ownerId: actor.id };
  if (actor.role === "STAFF") return { staff: { some: { userId: actor.id } } };
  throw new PaymentError(403, "Bạn không có quyền quản lý sân.");
}
