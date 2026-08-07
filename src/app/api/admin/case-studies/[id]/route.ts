import { NextResponse } from "next/server";
import { Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas";
import { invalidatePath } from "@/lib/services/edge-cache-service";

const CASE_PATHS = ["/cases", "/en/cases"];

const VALID_CATEGORIES = PRACTICE_AREA_KEYS;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!id || !body) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.category === "string" && VALID_CATEGORIES.includes(body.category)) data.category = body.category;
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.summary === "string") data.summary = body.summary.trim();
  if (typeof body.outcome === "string") data.outcome = body.outcome.trim();
  if (typeof body.duration === "string") data.duration = body.duration.trim();
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  try {
    const updated = await prisma.caseStudy.update({ where: { id }, data });
    for (const p of CASE_PATHS) void invalidatePath(p, "case-study update");
    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("admin/case-studies/[id] PATCH failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  try {
    await prisma.caseStudy.delete({ where: { id } });
    for (const p of CASE_PATHS) void invalidatePath(p, "case-study delete");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ ok: true });
    }
    console.error("admin/case-studies/[id] DELETE failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
