import { z } from "zod";
import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  listRequests,
  requestDocument,
  updateRequestStatus,
  GOV24_DOC_TYPES,
} from "@/lib/services/gov24-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DOC_CODES = GOV24_DOC_TYPES.map((d) => d.code) as [string, ...string[]];

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.integrations.gov24.get");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;
  try {
    const requests = await listRequests();
    return api.ok({ ok: true, requests, docTypes: GOV24_DOC_TYPES });
  } catch (err) {
    api.logError(err);
    return api.error(500, "정부24 조회 실패", { code: "GOV24_GET_FAILED" });
  }
}

const CreateSchema = z.object({
  action: z.literal("create"),
  type: z.enum(DOC_CODES),
  ownerConsent: z.boolean(),
  caseId: z.string().optional(),
  requesterName: z.string().optional(),
  requesterEmail: z.string().optional(),
  note: z.string().optional(),
});
const StatusSchema = z.object({
  action: z.literal("status"),
  id: z.string().min(1),
  status: z.enum(["REQUESTED", "IN_PROGRESS", "READY", "DELIVERED", "FAILED"]),
  externalRef: z.string().optional(),
});
const PostSchema = z.discriminatedUnion("action", [CreateSchema, StatusSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.integrations.gov24.post");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;
  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PostSchema.safeParse(parsed.body);
  if (!validation.success) return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });

  try {
    if (validation.data.action === "create") {
      const { action: _a, type, ownerConsent, ...meta } = validation.data;
      const res = await requestDocument(type as (typeof GOV24_DOC_TYPES)[number]["code"], ownerConsent, meta);
      return api.ok({ ok: true, ...res });
    }
    const updated = await updateRequestStatus(validation.data.id, validation.data.status, validation.data.externalRef);
    return api.ok({ ok: true, request: updated });
  } catch (err) {
    api.logError(err);
    return api.error(500, "정부24 처리 실패", { code: "GOV24_POST_FAILED" });
  }
}
