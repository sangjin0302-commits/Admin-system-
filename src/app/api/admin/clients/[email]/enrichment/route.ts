import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getStoredEnrichment,
  overrideEnrichment,
  refreshEnrichment,
} from "@/lib/services/profile-enrichment-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeEmail(raw: string): string {
  return decodeURIComponent(raw).trim().toLowerCase();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ email: string }> }
) {
  const api = createAdminRequestContext("admin.clients.enrichment.get");
  if (!(await isFeatureEnabled("profile_enrichment"))) {
    return api.error(403, "기능이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { email: rawEmail } = await context.params;
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) {
    return api.error(400, "유효한 이메일이 필요합니다.", { code: "INVALID_EMAIL" });
  }
  const stored = await getStoredEnrichment(email);
  return api.ok({ ok: true, email, enrichment: stored });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ email: string }> }
) {
  const api = createAdminRequestContext("admin.clients.enrichment.post");
  if (!(await isFeatureEnabled("profile_enrichment"))) {
    return api.error(403, "기능이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  const { email: rawEmail } = await context.params;
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) {
    return api.error(400, "유효한 이메일이 필요합니다.", { code: "INVALID_EMAIL" });
  }
  const bodyResult = await safeReadJsonBody(request);
  const body = bodyResult.ok ? (bodyResult.body as { action?: string; phone?: string; patch?: Record<string, unknown> }) : {};
  const action = body.action ?? "refresh";
  try {
    if (action === "refresh") {
      const fresh = await refreshEnrichment(email, email, body.phone);
      return api.ok({ ok: true, enrichment: fresh });
    }
    if (action === "override") {
      const patch = body.patch ?? {};
      const updated = await overrideEnrichment(email, {
        company: typeof patch.company === "string" ? patch.company : undefined,
        industry: typeof patch.industry === "string" ? patch.industry : undefined,
        seniority: typeof patch.seniority === "string" ? patch.seniority : undefined,
        notes: typeof patch.notes === "string" ? patch.notes : undefined,
        socialLinks:
          patch.socialLinks && typeof patch.socialLinks === "object"
            ? (patch.socialLinks as { linkedin?: string; hint?: string })
            : undefined,
        confidence: typeof patch.confidence === "number" ? patch.confidence : undefined,
      });
      return api.ok({ ok: true, enrichment: updated });
    }
    return api.error(400, "알 수 없는 액션", { code: "UNKNOWN_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "프로필 강화 실패", { code: "ENRICHMENT_FAILED" });
  }
}
