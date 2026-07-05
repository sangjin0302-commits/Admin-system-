import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  getHometaxConfig,
  setHometaxConfig,
  listRecentInvoices,
  queueTaxInvoice,
  issueTaxInvoice,
} from "@/lib/services/hometax-integration-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.hometax.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  try {
    const [config, invoices] = await Promise.all([getHometaxConfig(), listRecentInvoices()]);
    return api.ok({ ok: true, config, invoices });
  } catch (err) {
    api.logError(err);
    return api.error(500, "홈택스 조회 실패", { code: "HOMETAX_GET_FAILED" });
  }
}

const ConfigSchema = z.object({
  action: z.literal("config"),
  bizNo: z.string().optional(),
  companyName: z.string().optional(),
  note: z.string().optional(),
});
const QueueSchema = z.object({
  action: z.literal("queue"),
  caseId: z.string().optional(),
  buyerBizNo: z.string().min(1),
  buyerName: z.string().optional(),
  amount: z.number().int().nonnegative(),
  itemName: z.string().min(1),
});
const IssueSchema = z.object({
  action: z.literal("issue"),
  invoiceId: z.string().min(1),
});
const PostSchema = z.discriminatedUnion("action", [ConfigSchema, QueueSchema, IssueSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.hometax.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PostSchema.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    if (validation.data.action === "config") {
      const { action: _a, ...cfg } = validation.data;
      await setHometaxConfig({ ...cfg, certUploadedAt: new Date().toISOString() });
      return api.ok({ ok: true });
    }
    if (validation.data.action === "queue") {
      const { action: _a, ...rest } = validation.data;
      const inv = await queueTaxInvoice(rest);
      return api.ok({ ok: true, invoice: inv });
    }
    const res = await issueTaxInvoice(validation.data.invoiceId);
    return api.ok({ ...res });
  } catch (err) {
    api.logError(err);
    return api.error(500, "홈택스 실행 실패", { code: "HOMETAX_POST_FAILED" });
  }
}
