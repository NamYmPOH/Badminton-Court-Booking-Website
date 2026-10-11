import { Prisma, type PrismaClient } from "@prisma/client";

export async function serializable<T>(
  db: PrismaClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      });
    } catch (error) {
      if (
        attempt >= 2 ||
        !["P2034", "P2002"].includes((error as { code?: string }).code || "")
      )
        throw error;
    }
  }
}
