/**
 * Enhanced Audit Service
 *
 * Writes admin-scoped audit events to the CaseEvent table with "admin." prefix.
 * For events without a real case, uses a sentinel caseId.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

/** Sentinel caseId for admin events not tied to a specific case. */
const ADMIN_SENTINEL_CASE_ID = "admin-system";

export interface AuditEntry {
  action: string;
  actorEmail: string;
  resource: string;
  resourceId: string;
  details?: string;
}

/**
 * Write an audit event to CaseEvent with eventType prefixed "admin.".
 */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  const eventType = entry.action.startsWith("admin.")
    ? entry.action
    : `admin.${entry.action}`;

  try {
    await prisma.caseEvent.create({
      data: {
        caseId: entry.resourceId || ADMIN_SENTINEL_CASE_ID,
        eventType,
        actorId: entry.actorEmail,
        actorName: entry.actorEmail,
        message: `${entry.resource}: ${entry.details ?? entry.action}`,
        payloadJson: JSON.stringify({
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details,
        }),
      },
    });
  } catch (error) {
    logger.error("[audit-service] failed to write audit event", error);
  }
}

/** Helper: log a create action. */
export function auditCreate(
  actorEmail: string,
  resource: string,
  resourceId: string,
  details?: string
) {
  return logAuditEvent({
    action: "admin.create",
    actorEmail,
    resource,
    resourceId,
    details: details ?? `Created ${resource}`,
  });
}

/** Helper: log an update action. */
export function auditUpdate(
  actorEmail: string,
  resource: string,
  resourceId: string,
  details?: string
) {
  return logAuditEvent({
    action: "admin.update",
    actorEmail,
    resource,
    resourceId,
    details: details ?? `Updated ${resource}`,
  });
}

/** Helper: log a delete action. */
export function auditDelete(
  actorEmail: string,
  resource: string,
  resourceId: string,
  details?: string
) {
  return logAuditEvent({
    action: "admin.delete",
    actorEmail,
    resource,
    resourceId,
    details: details ?? `Deleted ${resource}`,
  });
}
