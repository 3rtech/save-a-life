import { db } from "./db";

export async function createAuditLog(params: {
  adminId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  return db.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as never,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
