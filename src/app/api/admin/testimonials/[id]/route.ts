import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas";

const VALID_CATEGORIES = PRACTICE_AREA_KEYS;

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

  // 이미 삭제된 id 로 들어오면(목록이 오래됐거나 일괄 정렬 루프 중) Prisma 가
  // P2025 를 던져 처리되지 않은 500 이 나갔다. 없으면 404 로 알린다.
  const updated = await prisma.testimonial
    .update({ where: { id }, data })
    .catch(() => null);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  await prisma.testimonial.delete({ where: { id } }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
