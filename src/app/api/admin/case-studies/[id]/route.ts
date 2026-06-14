import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

const VALID_CATEGORIES = ["VISA_STAY", "ADMIN_APPEAL", "CONTRACT_INVESTIGATION", "LICENSE_PERMIT"];

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

  const updated = await prisma.caseStudy.update({ where: { id }, data });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  await prisma.caseStudy.delete({ where: { id } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
