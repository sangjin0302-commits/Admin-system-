import type { AuditActionType, AuditEntityType, Prisma, PrismaClient } from "@generated/prisma-client/client";

type AuditDb = Prisma.TransactionClient | PrismaClient;

export type AuditActor = {
  userId: string;
  email?: string;
  role?: string;
};

export async function createAuditLog(
  db: AuditDb,
  input: {
    actor?: AuditActor | null;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId: string;
    summary: string;
    metadata?: Record<string, unknown>;
  }
) {
  return db.auditLog.create({
    data: {
      actorUserId: input.actor?.userId ?? null,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
    }
  });
}
