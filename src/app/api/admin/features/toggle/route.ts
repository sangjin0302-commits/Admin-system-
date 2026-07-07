import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getAllFlags,
  isFeatureEnabled,
  setFeatureEnabled,
} from "@/lib/services/feature-flags-service";
import { invalidateCommandIndex } from "@/lib/services/command-index-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 명령 팔레트의 원터치 플래그 토글 — 현재 상태를 뒤집습니다. */
export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.features.toggle");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const body = parsed.body as { key?: unknown };
  const key = typeof body.key === "string" ? body.key : "";
  if (!key) return api.error(400, "key가 필요합니다.", { code: "INVALID_INPUT" });

  try {
    const current = await isFeatureEnabled(key);
    await setFeatureEnabled(key, !current);
    invalidateCommandIndex();
    const flags = await getAllFlags();
    return api.ok({ ok: true, key, enabled: !current, flags });
  } catch (err) {
    api.logError(err);
    return api.error(500, "토글 실패", { code: "TOGGLE_FAILED" });
  }
}
