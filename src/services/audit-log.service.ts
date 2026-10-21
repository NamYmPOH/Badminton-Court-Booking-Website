import { Prisma, type PrismaClient } from "@prisma/client";

export interface LogAuditInput {
  actorId: string;
  actorName?: string;
  action: string;
  entityType?: string;
  entityId: string;
  reason?: string;
  details?: Record<string, unknown>;
}

/**
 * Ghi nhận nhật ký kiểm toán cho các thao tác hệ thống quan trọng.
 * Tuyệt đối không lưu mật khẩu, secret hay chuỗi kết nối.
 */
export async function logAuditEvent(
  tx: Prisma.TransactionClient | PrismaClient,
  input: LogAuditInput
) {
  const sanitizedDetails = { ...input.details };
  delete sanitizedDetails.password;
  delete sanitizedDetails.secret;
  delete sanitizedDetails.token;
  delete sanitizedDetails.connectionString;

  if (input.entityType && !sanitizedDetails.entityType) {
    sanitizedDetails.entityType = input.entityType;
  }

  return tx.adminAudit.create({
    data: {
      actorId: input.actorId,
      actorName: input.actorName || "Hệ thống SmashBook",
      action: input.action,
      entityId: input.entityId,
      reason: input.reason || `Thực hiện ${input.action} trên ${input.entityId}`,
      details: sanitizedDetails as unknown as Prisma.InputJsonValue,
    },
  });
}
