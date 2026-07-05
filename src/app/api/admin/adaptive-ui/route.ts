import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  trackEvent,
  getPersonalizedShortcuts,
  getGlobalUsageStats,
  suggestReorg,
  applyReorg,
} from "@/lib/services/adaptive-ui-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.adaptive-ui.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? guard.user.email ?? "unknown";

  try {
    const [shortcuts, stats, suggestion] = await Promise.all([
      getPersonalizedShortcuts(userId),
      getGlobalUsageStats(),
      suggestReorg(),
    ]);
    return api.ok({ ok: true, shortcuts, stats, suggestion });
  } catch (err) {
    api.logError(err);
    return api.error(500, "적응형 UI 조회 실패", { code: "ADAPTIVE_UI_READ_FAILED" });
  }
}

const PostSchema = z.union([
  z.object({
    action: z.literal("track"),
    userId: z.string().min(1),
    type: z.enum(["page", "click"]),
    target: z.string().min(1),
  }),
  z.object({
    action: z.literal("apply_reorg"),
    order: z.array(z.string()),
  }),
]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.adaptive-ui.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PostSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    if (validation.data.action === "track") {
      await trackEvent(validation.data.userId, {
        type: validation.data.type,
        target: validation.data.target,
      });
      return api.ok({ ok: true });
    }
    if (validation.data.action === "apply_reorg") {
      await applyReorg(validation.data.order);
      return api.ok({ ok: true });
    }
    return api.error(400, "지원하지 않는 액션", { code: "INVALID_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "액션 실패", { code: "ADAPTIVE_UI_ACTION_FAILED" });
  }
}
