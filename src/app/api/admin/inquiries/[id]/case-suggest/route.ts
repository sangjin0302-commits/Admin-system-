/**
 * GET /api/admin/inquiries/{id}/case-suggest
 *
 * 문의 → 사건 전환 자동 제안 여부 판단.
 * Feature flag: `auto_case_suggest`
 */

import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { shouldSuggestCaseCreation } from "@/lib/services/auto-case-suggest-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isFeatureEnabled("auto_case_suggest"))) {
    return NextResponse.json({ suggest: false, reason: "Feature disabled" });
  }

  const { id } = await params;
  const result = await shouldSuggestCaseCreation(id);
  return NextResponse.json(result);
}
