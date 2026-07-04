import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getAllFlags,
  getFeatureRegistry,
  setFeatureEnabled,
} from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.features.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const [flags, registry] = await Promise.all([getAllFlags(), Promise.resolve(getFeatureRegistry())]);
    return api.ok({ ok: true, flags, registry });
  } catch (err) {
    api.logError(err);
    return api.error(500, "기능 플래그 조회 실패", { code: "FEATURE_LIST_FAILED" });
  }
}

const PatchSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
});

export async function PATCH(req: Request) {
  const api = createAdminRequestContext("admin.features.update");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });

  const validation = PatchSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    await setFeatureEnabled(validation.data.key, validation.data.enabled);
    const flags = await getAllFlags();
    return api.ok({ ok: true, flags });
  } catch (err) {
    api.logError(err);
    return api.error(500, "기능 플래그 저장 실패", { code: "FEATURE_UPDATE_FAILED" });
  }
}
