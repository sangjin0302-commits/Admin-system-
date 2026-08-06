import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { runBlogDedup, runBlogReclassify } from "@/lib/services/blog-maintenance-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 블로그 데이터 정비(중복 정리 · 재분류). 파괴적이라 SUPER 전용.
 * POST { task: "dedup" | "reclassify", apply?: boolean }
 *  - apply 미지정/false: dry-run(무엇을 바꿀지 리포트만)
 *  - apply: true: 실제 삭제/수정
 */
export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER"]);
  if (!guard.ok) return guard.response;

  const body = (await req.json().catch(() => null)) as { task?: unknown; apply?: unknown } | null;
  const task = body?.task;
  const apply = body?.apply === true;
  if (task !== "dedup" && task !== "reclassify") {
    return NextResponse.json({ ok: false, error: "task must be 'dedup' or 'reclassify'" }, { status: 400 });
  }

  try {
    const report = task === "dedup" ? await runBlogDedup(apply) : await runBlogReclassify(apply);
    logger.info("[admin/blog/maintenance]", { task, apply, report: { ...report, sample: undefined } });
    return NextResponse.json({ ok: true, task, apply, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MAINTENANCE_FAILED";
    logger.error("[admin/blog/maintenance] failed", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
