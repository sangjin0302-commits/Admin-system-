import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  listApplications,
  updateApplicationStatus,
  isValidStatus,
} from "@/lib/services/career-application-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.careers.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const items = await listApplications();
    return api.ok({ ok: true, items });
  } catch (err) {
    api.logError(err);
    return api.error(500, "지원자 목록 조회 실패", { code: "CAREERS_LIST_FAILED" });
  }
}

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  note: z.string().optional(),
});

export async function PATCH(req: Request) {
  const api = createAdminRequestContext("admin.careers.update");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = PatchSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }
  if (!isValidStatus(validation.data.status)) {
    return api.error(400, "잘못된 상태 값", { code: "INVALID_STATUS" });
  }
  try {
    const updated = await updateApplicationStatus(
      validation.data.id,
      validation.data.status,
      validation.data.note,
    );
    if (!updated) return api.error(404, "지원자를 찾을 수 없습니다", { code: "NOT_FOUND" });
    return api.ok({ ok: true, item: updated });
  } catch (err) {
    api.logError(err);
    return api.error(500, "지원자 상태 업데이트 실패", { code: "CAREERS_UPDATE_FAILED" });
  }
}
