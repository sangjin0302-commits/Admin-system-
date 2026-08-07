import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { listAdminCaseStudies } from "@/lib/services/case-studies";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas";
import { invalidatePath } from "@/lib/services/edge-cache-service";

const VALID_CATEGORIES = PRACTICE_AREA_KEYS;

export async function GET() {
  const items = await listAdminCaseStudies();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const category = typeof body.category === "string" && VALID_CATEGORIES.includes(body.category)
    ? body.category
    : null;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const outcome = typeof body.outcome === "string" ? body.outcome.trim() : "";
  const duration = typeof body.duration === "string" ? body.duration.trim() : "";

  if (!category || !title || !summary) {
    return NextResponse.json({ ok: false, error: "분야/제목/요약은 필수입니다." }, { status: 400 });
  }

  try {
    const created = await prisma.caseStudy.create({
      data: {
        category,
        title,
        summary,
        outcome: outcome || "사안별로 진행되었습니다.",
        duration: duration || "사안별",
        published: body.published !== false,
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0
      }
    });

    // 목록 + 신규 상세(ISR) 즉시 무효화. 상세 slug = db-<id>.
    for (const p of ["/cases", "/en/cases", `/cases/db-${created.id}`, `/en/cases/db-${created.id}`]) {
      void invalidatePath(p, "case-study create");
    }
    return NextResponse.json({ ok: true, item: created });
  } catch (error) {
    console.error("admin/case-studies POST failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
