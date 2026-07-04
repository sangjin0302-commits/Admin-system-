import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { generateCaseStory } from "@/lib/services/case-story-generator";
import { logger } from "@/lib/utils/logger";

// Admin auth is enforced by middleware (Basic Auth on /api/admin/*).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const caseMatterId = body && typeof body.caseMatterId === "string" ? body.caseMatterId : "";
  if (!caseMatterId) {
    return NextResponse.json({ ok: false, error: "caseMatterId required" }, { status: 400 });
  }

  try {
    const story = await generateCaseStory(caseMatterId);
    return NextResponse.json({ ok: true, story });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.warn("[api/admin/case-stories/generate] failed", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

// GET: list CLOSED cases for the picker UI.
export async function GET() {
  const cases = await prisma.caseMatter.findMany({
    where: { status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      category: true,
      closedAt: true,
      summary: true,
    },
  });
  return NextResponse.json({ ok: true, cases });
}
