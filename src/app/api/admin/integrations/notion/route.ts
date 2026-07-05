import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getNotionConfig,
  saveNotionConfig,
  getNotionHistory,
  testNotionConnection,
  syncCaseToNotion,
  syncInquiryToNotion,
  pollNotionUpdates,
} from "@/lib/services/notion-integration-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.notion.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [cfg, history] = await Promise.all([getNotionConfig(), getNotionHistory()]);
    // 응답에서 토큰 마스킹
    const safeCfg = { ...cfg, apiToken: cfg.apiToken ? `${cfg.apiToken.slice(0, 6)}…` : "" };
    return api.ok({ ok: true, config: safeCfg, history });
  } catch (err) {
    api.logError(err);
    return api.error(500, "Notion 조회 실패", { code: "NOTION_GET_FAILED" });
  }
}

const SaveSchema = z.object({
  action: z.literal("save"),
  apiToken: z.string().optional(),
  databaseId: z.string().optional(),
  enabled: z.boolean().optional(),
});
const TestSchema = z.object({ action: z.literal("test") });
const SyncSchema = z.object({
  action: z.literal("sync"),
  entity: z.enum(["inquiry", "case"]),
  id: z.string().min(1),
});
const PollSchema = z.object({ action: z.literal("poll") });
const Body = z.discriminatedUnion("action", [SaveSchema, TestSchema, SyncSchema, PollSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.notion.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = Body.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    const b = validation.data;
    if (b.action === "save") {
      await saveNotionConfig({
        apiToken: b.apiToken,
        databaseId: b.databaseId,
        enabled: b.enabled,
      });
      return api.ok({ ok: true });
    }
    if (b.action === "test") {
      const r = await testNotionConnection();
      return api.ok({ ok: r.ok, error: r.error });
    }
    if (b.action === "poll") {
      const r = await pollNotionUpdates();
      return api.ok({ ok: r.ok, changed: r.changed, error: r.error });
    }
    const r = b.entity === "case" ? await syncCaseToNotion(b.id) : await syncInquiryToNotion(b.id);
    return api.ok({ ok: r.ok, pageId: r.pageId, error: r.error });
  } catch (err) {
    api.logError(err);
    return api.error(500, "Notion 처리 실패", { code: "NOTION_POST_FAILED" });
  }
}
