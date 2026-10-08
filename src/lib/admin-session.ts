import { db } from "./db";
import { requirePaymentUser } from "./payment-session";
import { assertAdmin } from "./admin-policy";

export async function requireAdmin() {
  const id = await requirePaymentUser();
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, status: true },
  });
  assertAdmin(user);
  return user!;
}
