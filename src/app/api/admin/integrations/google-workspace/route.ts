import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getWorkspaceConfig,
  saveWorkspaceConfig,
  getWorkspaceHistory,
  createUser,
  suspendUser,
  reactivateUser,
  listUsers,
  testWorkspaceConnection,
} from "@/lib/services/google-workspace-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.google-workspace.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [cfg, history] = await Promise.all([getWorkspaceConfig(), getWorkspaceHistory()]);
    return api.ok({ ok: true, config: cfg, history });
  } catch (err) {
    api.logError(err);
    return api.error(500, "Google Workspace 조회 실패", { code: "GWS_GET_FAILED" });
  }
}

const SaveSchema = z.object({
  action: z.literal("save"),
  adminEmail: z.string().optional(),
  defaultDomain: z.string().optional(),
  enabled: z.boolean().optional(),
});
const TestSchema = z.object({ action: z.literal("test") });
const ListSchema = z.object({ action: z.literal("list") });
const CreateSchema = z.object({
  action: z.literal("create"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  primaryEmail: z.string().email(),
  password: z.string().optional(),
});
const SuspendSchema = z.object({ action: z.literal("suspend"), email: z.string().email() });
const ReactivateSchema = z.object({ action: z.literal("reactivate"), email: z.string().email() });
const Body = z.discriminatedUnion("action", [SaveSchema, TestSchema, ListSchema, CreateSchema, SuspendSchema, ReactivateSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.google-workspace.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = Body.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    const b = validation.data;
    if (b.action === "save") {
      await saveWorkspaceConfig({
        adminEmail: b.adminEmail,
        defaultDomain: b.defaultDomain,
        enabled: b.enabled,
      });
      return api.ok({ ok: true });
    }
    if (b.action === "test") {
      const r = await testWorkspaceConnection();
      return api.ok({ ok: r.ok, error: r.error });
    }
    if (b.action === "list") {
      const r = await listUsers();
      return api.ok(r);
    }
    if (b.action === "create") {
      const r = await createUser({
        firstName: b.firstName,
        lastName: b.lastName,
        primaryEmail: b.primaryEmail,
        password: b.password,
      });
      return api.ok(r);
    }
    if (b.action === "suspend") {
      const r = await suspendUser(b.email);
      return api.ok(r);
    }
    const r = await reactivateUser(b.email);
    return api.ok(r);
  } catch (err) {
    api.logError(err);
    return api.error(500, "Google Workspace 처리 실패", { code: "GWS_POST_FAILED" });
  }
}
