import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  flushSentryBatch,
  getSentryConfig,
  getSentryQueueSummary,
  sendTestEvent,
} from "@/lib/services/sentry-integration-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.sentry-monitor.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const summary = getSentryQueueSummary();
    const cfg = getSentryConfig();
    const featureEnabled = await isFeatureEnabled("sentry_monitoring");
    const dashboardUrl =
      cfg.org && cfg.project
        ? `https://sentry.io/organizations/${cfg.org}/projects/${cfg.project}/`
        : null;
    return api.ok({
      ok: true,
      status: {
        configured: summary.configured,
        queued: summary.queued,
        maxBatch: summary.maxBatch,
        environment: summary.environment,
        org: cfg.org,
        project: cfg.project,
        featureEnabled,
        dashboardUrl,
      },
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "Sentry 상태 조회 실패", {
      code: "SENTRY_STATUS_FAILED",
    });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.sentry-monitor.action");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    if (body.action === "test") {
      const result = await sendTestEvent();
      return api.ok({ ok: true, result });
    }
    if (body.action === "flush") {
      const result = await flushSentryBatch();
      return api.ok({ ok: true, result });
    }
    return api.error(400, "알 수 없는 action", { code: "SENTRY_ACTION_UNKNOWN" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "Sentry 작업 실패", { code: "SENTRY_ACTION_FAILED" });
  }
}
