import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getCrmConfig,
  saveCrmConfig,
  getCrmHistory,
  testCrmConnection,
  syncClientToCrm,
  syncCaseToCrm,
  pullCrmUpdates,
} from "@/lib/services/crm-integration-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.crm.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [cfg, history] = await Promise.all([getCrmConfig(), getCrmHistory()]);
    const safeCfg = {
      ...cfg,
      hubspot: { apiKey: cfg.hubspot.apiKey ? `${cfg.hubspot.apiKey.slice(0, 6)}…` : "" },
      salesforce: {
        instanceUrl: cfg.salesforce.instanceUrl,
        token: cfg.salesforce.token ? `${cfg.salesforce.token.slice(0, 6)}…` : "",
      },
    };
    return api.ok({ ok: true, config: safeCfg, history });
  } catch (err) {
    api.logError(err);
    return api.error(500, "CRM 조회 실패", { code: "CRM_GET_FAILED" });
  }
}

const SaveSchema = z.object({
  action: z.literal("save"),
  provider: z.enum(["hubspot", "salesforce"]).optional(),
  enabled: z.boolean().optional(),
  hubspot: z.object({ apiKey: z.string().optional() }).optional(),
  salesforce: z.object({ instanceUrl: z.string().optional(), token: z.string().optional() }).optional(),
});
const TestSchema = z.object({ action: z.literal("test") });
const SyncSchema = z.object({
  action: z.literal("sync"),
  entity: z.enum(["inquiry", "case"]),
  id: z.string().min(1),
});
const PullSchema = z.object({ action: z.literal("pull") });
const FullSchema = z.object({ action: z.literal("full_sync") });
const Body = z.discriminatedUnion("action", [SaveSchema, TestSchema, SyncSchema, PullSchema, FullSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.crm.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = Body.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    const b = validation.data;
    if (b.action === "save") {
      const current = await getCrmConfig();
      await saveCrmConfig({
        provider: b.provider ?? current.provider,
        enabled: b.enabled ?? current.enabled,
        hubspot: b.hubspot ? { apiKey: b.hubspot.apiKey ?? current.hubspot.apiKey } : current.hubspot,
        salesforce: b.salesforce
          ? {
              instanceUrl: b.salesforce.instanceUrl ?? current.salesforce.instanceUrl,
              token: b.salesforce.token ?? current.salesforce.token,
            }
          : current.salesforce,
      });
      return api.ok({ ok: true });
    }
    if (b.action === "test") {
      const r = await testCrmConnection();
      return api.ok(r);
    }
    if (b.action === "sync") {
      const r = b.entity === "case" ? await syncCaseToCrm(b.id) : await syncClientToCrm(b.id);
      return api.ok(r);
    }
    if (b.action === "pull") {
      const r = await pullCrmUpdates();
      return api.ok(r);
    }
    // full_sync: 최근 문의·사건 배치
    const { prisma } = await import("@/lib/prisma/client");
    const inquiries = await prisma.inquiry.findMany({ take: 100, orderBy: { updatedAt: "desc" }, select: { id: true } });
    const cases = await prisma.caseMatter.findMany({ take: 100, orderBy: { updatedAt: "desc" }, select: { id: true } });
    let count = 0;
    for (const i of inquiries) {
      const r = await syncClientToCrm(i.id);
      if (r.ok) count += 1;
    }
    for (const c of cases) {
      const r = await syncCaseToCrm(c.id);
      if (r.ok) count += 1;
    }
    return api.ok({ ok: true, count });
  } catch (err) {
    api.logError(err);
    return api.error(500, "CRM 처리 실패", { code: "CRM_POST_FAILED" });
  }
}
