import { NextResponse } from "next/server";
import { Prisma } from "@generated/prisma-client/client";

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

  try {
    const updated = await prisma.feeItem.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("admin/fees/[id] PATCH failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  try {
    await prisma.feeItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ ok: true });
    }
    console.error("admin/fees/[id] DELETE failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
