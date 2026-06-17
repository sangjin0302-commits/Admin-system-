import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas";

const VALID = [...PRACTICE_AREA_KEYS, "ETC"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!id || !body) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.category === "string" && VALID.includes(body.category)) data.category = body.category;
  if (typeof body.service === "string") data.service = body.service.trim();
  if (typeof body.amount === "string") data.amount = body.amount.trim();
  if (typeof body.note === "string") data.note = body.note.trim();
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const updated = await prisma.feeItem.update({ where: { id }, data });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  await prisma.feeItem.delete({ where: { id } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
