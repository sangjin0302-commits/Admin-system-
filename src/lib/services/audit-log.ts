/**
 * 감사 로그 — CaseEvent 모델을 활용해 의뢰인/관리자 활동을 기록.
 * caseId가 없는 활동 (포털 로그인 등)은 별도 console.log로만 남김.
 */

import { prisma } from "@/lib/prisma/client";

export type AuditEvent =
  | "portal.login"
  | "portal.signup"
  | "portal.upload"
  | "portal.case_view"
  | "admin.pdf_download"
  | "admin.csv_export"
  | "admin.case_status_change"
  | "admin.category_change"
  | "admin.client_message";

export async function logAudit(opts: {
  event: AuditEvent;
  caseId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  message: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (opts.caseId) {
    try {
      await prisma.caseEvent.create({
        data: {
          caseId: opts.caseId,
          eventType: opts.event,
          actorId: opts.actorId ?? null,
          actorName: opts.actorName ?? null,
          message: opts.message,
          payloadJson: opts.payload ? JSON.stringify(opts.payload) : null
        }
      });
      return;
    } catch (error) {
      console.error("[audit-log] failed to write CaseEvent", error);
    }
  }
  // caseId 없으면 stdout 로그만
  console.log(`[audit] ${opts.event} actor=${opts.actorName ?? opts.actorId ?? "-"} :: ${opts.message}`);
}
