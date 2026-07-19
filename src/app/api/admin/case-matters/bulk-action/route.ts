/**
 * 사건 배치 액션 — 여러 사건을 한 번에 상태 이동·담당자 지정·삭제.
 *
 * POST /api/admin/case-matters/bulk-action
 * Body: { ids: string[], action: "status"|"assign"|"delete", value?: string }
 * Response: { updated: number, failed: string[] }
 *
 * 문의 쪽(/api/admin/inquiries/bulk-action)과 같은 계약을 쓴다.
 *
 * Feature flag: `inquiry_bulk_actions` (문의와 동일 플래그를 공유 — 운영자
 * 입장에서 "일괄 관리"는 하나의 기능이고, 문의만 켜고 사건만 끄는 조합은 없다.)
 */

import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { CaseMatterStatus } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IDS = 50;
/** 삭제는 복구가 불가능하므로 한 번에 처리할 수 있는 건수를 더 좁게 잡는다. */
const MAX_DELETE_IDS = 20;
const ALLOWED_STATUSES = new Set<string>(Object.values(CaseMatterStatus));

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.case-matters.bulk-action");
  if (!(await isFeatureEnabled("inquiry_bulk_actions"))) {
    return api.error(403, "배치 액션 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as {
      ids?: string[];
      action?: string;
      value?: string;
    };
    const ids = Array.isArray(body.ids) ? body.ids.filter((s) => typeof s === "string") : [];
    if (ids.length === 0) return api.error(400, "ids 필수", { code: "INVALID_INPUT" });
    if (ids.length > MAX_IDS) return api.error(400, `최대 ${MAX_IDS}건`, { code: "TOO_MANY" });

    const failed: string[] = [];
    let updated = 0;

    switch (body.action) {
      case "status": {
        const value = body.value?.trim();
        if (!value || !ALLOWED_STATUSES.has(value)) {
          return api.error(400, "유효한 status(value) 필수", { code: "INVALID_STATUS" });
        }
        const result = await prisma.caseMatter.updateMany({
          where: { id: { in: ids } },
          data: { status: value as CaseMatterStatus },
        });
        updated = result.count;
        break;
      }
      case "assign": {
        const value = body.value?.trim();
        if (!value) return api.error(400, "담당자(value) 필수", { code: "INVALID_VALUE" });
        const result = await prisma.caseMatter.updateMany({
          where: { id: { in: ids } },
          data: { assignedTo: value },
        });
        updated = result.count;
        break;
      }
      case "delete": {
        // 되돌릴 수 없다. 당사자·서류·과제·이벤트가 Cascade 로 함께 사라진다.
        if (ids.length > MAX_DELETE_IDS) {
          return api.error(400, `삭제는 한 번에 최대 ${MAX_DELETE_IDS}건`, { code: "TOO_MANY" });
        }
        const result = await prisma.caseMatter.deleteMany({ where: { id: { in: ids } } });
        updated = result.count;
        if (updated < ids.length) {
          const survivors = await prisma.caseMatter.findMany({
            where: { id: { in: ids } },
            select: { id: true },
          });
          failed.push(...survivors.map((s) => s.id));
        }
        break;
      }
      default:
        return api.error(400, "action: status|assign|delete", { code: "INVALID_ACTION" });
    }

    return api.ok({ updated, failed });
  } catch (err) {
    api.logError(err);
    return api.error(500, "배치 실패", { code: "BULK_FAILED" });
  }
}
