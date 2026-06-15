import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

const VALID = ["CAREER", "LICENSE", "EDUCATION", "AWARD", "ACTIVITY"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!id || !body) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.type === "string" && VALID.includes(body.type)) data.type = body.type;
  if (typeof body.year === "string") data.year = body.year.trim();
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.detail === "string") data.detail = body.detail.trim();
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const updated = await prisma.credential.update({ where: { id }, data });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  await prisma.credential.delete({ where: { id } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
