/**
 * AAA5 (XX2): 문의 배치 액션.
 *
 * POST /api/admin/inquiries/bulk-action
 * Body: { ids: string[], action: "assign"|"status"|"delete", value?: string }
 * Response: { updated: number, failed: string[] }
 *
 * 다중 문의 일괄 상태변경·담당자할당·삭제.
 *
 * Feature flag: `inquiry_bulk_actions`
 */

import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { InquiryStatus } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IDS = 50;
const ALLOWED_STATUSES = new Set<string>(Object.values(InquiryStatus));

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.inquiries.bulk-action");
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
      case "assign": {
        const value = body.value?.trim();
        if (!value) return api.error(400, "담당자(value) 필수", { code: "INVALID_VALUE" });
        const result = await prisma.inquiry.updateMany({
          where: { id: { in: ids } },
          data: { assignee: value },
        });
        updated = result.count;
        break;
      }
      case "status": {
        const value = body.value?.trim();
        if (!value || !ALLOWED_STATUSES.has(value)) {
          return api.error(400, "유효한 status(value) 필수", { code: "INVALID_STATUS" });
        }
        const result = await prisma.inquiry.updateMany({
          where: { id: { in: ids } },
          data: { status: value as InquiryStatus },
        });
        updated = result.count;
        break;
      }
      case "mark_read": {
        const result = await prisma.inquiry.updateMany({
          where: { id: { in: ids }, firstResponseAt: null },
          data: { firstResponseAt: new Date() },
        });
        updated = result.count;
        break;
      }
      default:
        return api.error(400, "action: assign|status|mark_read", { code: "INVALID_ACTION" });
    }

    return api.ok({ updated, failed });
  } catch (err) {
    api.logError(err);
    return api.error(500, "배치 실패", { code: "BULK_FAILED" });
  }
}
