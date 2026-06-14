import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

const VALID_CATEGORIES = ["VISA_STAY", "ADMIN_APPEAL", "CONTRACT_INVESTIGATION", "LICENSE_PERMIT"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!id || !body) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.category === "string" && VALID_CATEGORIES.includes(body.category)) data.category = body.category;
  if (typeof body.quote === "string") data.quote = body.quote.trim();
  if (typeof body.author === "string") data.author = body.author.trim();
  if (typeof body.context === "string") data.context = body.context.trim();
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const updated = await prisma.testimonial.update({ where: { id }, data });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  await prisma.testimonial.delete({ where: { id } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
