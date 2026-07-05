import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  updateCampaignSpendCell,
  generateReport,
} from "@/lib/services/ad-optimizer-service";
import { normalizeDateRange } from "@/lib/services/utm-tracking-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.ad-optimizer.report");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const range = normalizeDateRange(url.searchParams.get("range") ?? undefined);
  try {
    const report = await generateReport(range);
    return api.ok({ ok: true, report });
  } catch (err) {
    api.logError(err);
    return api.error(500, "리포트 생성 실패", { code: "AD_REPORT_FAILED" });
  }
}

const SpendSchema = z.object({
  campaign: z.string().min(1),
  weekStart: z.string().min(1),
  amount: z.number().min(0),
});

export async function PATCH(req: Request) {
  const api = createAdminRequestContext("admin.ad-optimizer.spend");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = SpendSchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    const entries = await updateCampaignSpendCell(
      validation.data.campaign,
      validation.data.weekStart,
      validation.data.amount,
    );
    return api.ok({ ok: true, entries });
  } catch (err) {
    api.logError(err);
    return api.error(500, "저장 실패", { code: "AD_SPEND_SAVE_FAILED" });
  }
}
