import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getBackupMirrorConfig,
  saveBackupMirrorConfig,
  getBackupMirrorHistory,
  runFullSync,
  mirrorRecord,
} from "@/lib/services/backup-mirror-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.backup-mirror.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [cfg, history] = await Promise.all([getBackupMirrorConfig(), getBackupMirrorHistory()]);
    // mask airtable API key
    const safeCfg = {
      ...cfg,
      airtable: { ...cfg.airtable, apiKey: cfg.airtable.apiKey ? `${cfg.airtable.apiKey.slice(0, 6)}…` : "" },
    };
    return api.ok({ ok: true, config: safeCfg, history });
  } catch (err) {
    api.logError(err);
    return api.error(500, "미러 백업 조회 실패", { code: "BACKUP_MIRROR_GET_FAILED" });
  }
}

const SaveSchema = z.object({
  action: z.literal("save"),
  provider: z.enum(["airtable", "sheets"]).optional(),
  enabled: z.boolean().optional(),
  airtable: z
    .object({
      apiKey: z.string().optional(),
      baseId: z.string().optional(),
      tableName: z.string().optional(),
    })
    .optional(),
  sheets: z
    .object({
      spreadsheetId: z.string().optional(),
      sheetName: z.string().optional(),
    })
    .optional(),
});
const FullSyncSchema = z.object({ action: z.literal("full_sync") });
const TestSchema = z.object({
  action: z.literal("test"),
});
const Body = z.discriminatedUnion("action", [SaveSchema, FullSyncSchema, TestSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.backup-mirror.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = Body.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    const b = validation.data;
    if (b.action === "save") {
      const current = await getBackupMirrorConfig();
      await saveBackupMirrorConfig({
        provider: b.provider ?? current.provider,
        enabled: b.enabled ?? current.enabled,
        airtable: b.airtable
          ? {
              apiKey: b.airtable.apiKey ?? current.airtable.apiKey,
              baseId: b.airtable.baseId ?? current.airtable.baseId,
              tableName: b.airtable.tableName ?? current.airtable.tableName,
            }
          : current.airtable,
        sheets: b.sheets
          ? {
              spreadsheetId: b.sheets.spreadsheetId ?? current.sheets.spreadsheetId,
              sheetName: b.sheets.sheetName ?? current.sheets.sheetName,
            }
          : current.sheets,
      });
      return api.ok({ ok: true });
    }
    if (b.action === "full_sync") {
      const r = await runFullSync();
      return api.ok(r);
    }
    // test: 임의 record 미러
    const r = await mirrorRecord("test", { at: new Date().toISOString(), sample: true });
    return api.ok({ ok: r.ok, error: r.error });
  } catch (err) {
    api.logError(err);
    return api.error(500, "미러 백업 처리 실패", { code: "BACKUP_MIRROR_POST_FAILED" });
  }
}
