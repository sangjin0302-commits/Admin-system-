import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  listSubscriptions,
  upsertSubscription,
  deleteSubscription,
  getZapierHistory,
  testSubscription,
  ZAPIER_EVENTS,
  type ZapierEvent,
} from "@/lib/services/zapier-webhook-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EventEnum = z.enum(ZAPIER_EVENTS as unknown as [ZapierEvent, ...ZapierEvent[]]);

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.zapier.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [subs, history] = await Promise.all([listSubscriptions(), getZapierHistory()]);
    return api.ok({ ok: true, subscriptions: subs, history, events: ZAPIER_EVENTS });
  } catch (err) {
    api.logError(err);
    return api.error(500, "Zapier 조회 실패", { code: "ZAPIER_GET_FAILED" });
  }
}

const UpsertSchema = z.object({
  action: z.literal("upsert"),
  id: z.string().min(1),
  url: z.string().url(),
  events: z.array(EventEnum).min(1),
  secret: z.string().min(1),
  active: z.boolean(),
});
const DeleteSchema = z.object({ action: z.literal("delete"), id: z.string().min(1) });
const TestSchema = z.object({ action: z.literal("test"), id: z.string().min(1) });
const Body = z.discriminatedUnion("action", [UpsertSchema, DeleteSchema, TestSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.zapier.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = Body.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    const b = validation.data;
    if (b.action === "upsert") {
      const record = await upsertSubscription({
        id: b.id,
        url: b.url,
        events: b.events,
        secret: b.secret,
        active: b.active,
      });
      return api.ok({ ok: true, subscription: record });
    }
    if (b.action === "delete") {
      await deleteSubscription(b.id);
      return api.ok({ ok: true });
    }
    const log = await testSubscription(b.id);
    return api.ok({ ok: log?.ok ?? false, log });
  } catch (err) {
    api.logError(err);
    return api.error(500, "Zapier 처리 실패", { code: "ZAPIER_POST_FAILED" });
  }
}
