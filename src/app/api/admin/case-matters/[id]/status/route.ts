import { ZodError } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseMatterConcurrentUpdateError,
  CaseMatterConversionError,
  CaseMatterStatusGuardError,
  updateCaseMatterStatus
} from "@/lib/services/case-matter-service";
import { updateCaseMatterStatusSchema } from "@/lib/validation/case-matter";
import { logger } from "@/lib/utils/logger";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.case-matters.status.patch");
  const { id: rawId } = await context.params;
  const caseMatterId = normalizeAdminEntityId(rawId);

  if (!caseMatterId) {
    return api.error(400, "Invalid case matter id format.", { code: "INVALID_CASE_MATTER_ID" });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const payload = updateCaseMatterStatusSchema.parse(bodyResult.body);
    const caseMatter = await updateCaseMatterStatus({
      caseMatterId,
      ...payload
    });

    // 의뢰인 자동 알림 (best-effort, await 안 함 — 응답 지연 방지)
    {
      const { notifyClientCaseStatusChanged } = await import("@/lib/services/case-status-notify");
      notifyClientCaseStatusChanged(caseMatterId, payload.status).catch((err) =>
        logger.warn("[case-status-notify] background error", err)
      );
    }

    // 워크플로 엔진 훅 (best-effort, background)
    {
      const { runWorkflow } = await import("@/lib/services/workflow-engine");
      runWorkflow("case", undefined, payload.status, {
        id: caseMatter.id,
        title: caseMatter.title,
        caseNo: caseMatter.caseNo,
        inquiryId: caseMatter.inquiryId,
        inquiry: (caseMatter as { inquiry?: unknown }).inquiry
      }).catch((err) => logger.warn("[workflow-engine] case hook error", err));
    }

    // 통합 훅 (Notion / Zapier / CRM / Backup) — best-effort
    {
      Promise.all([
        import("@/lib/services/notion-integration-service").then((m) => m.fireAndForgetSyncCase(caseMatter.id)),
        import("@/lib/services/zapier-webhook-service").then((m) => {
          m.fireAndForgetNotify("case_status_changed", { id: caseMatter.id, status: payload.status, caseNo: caseMatter.caseNo });
          if (payload.status === "CLOSED") {
            m.fireAndForgetNotify("case_closed", { id: caseMatter.id, caseNo: caseMatter.caseNo });
          }
        }),
        import("@/lib/services/crm-integration-service").then((m) => m.fireAndForgetCaseToCrm(caseMatter.id)),
        import("@/lib/services/backup-mirror-service").then((m) =>
          m.fireAndForgetMirror("case", { id: caseMatter.id, status: payload.status, title: caseMatter.title })
        ),
      ]).catch((err) => logger.warn("[integrations] case status hooks failed", err));
    }

    return api.ok({
      ok: true,
      caseMatter
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Check request fields."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof CaseMatterStatusGuardError) {
      return api.error(409, error.message, {
        code: "STATUS_TRANSITION_BLOCKED",
        blockers: error.blockers
      });
    }

    if (error instanceof CaseMatterConcurrentUpdateError) {
      return api.error(409, error.message, {
        code: "CONCURRENT_UPDATE_CONFLICT",
        headers: {
          "X-Current-Updated-At": error.currentUpdatedAt
        }
      });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to update case matter status.", {
      code: "PATCH_CASE_MATTER_STATUS_FAILED"
    });
  }
}

