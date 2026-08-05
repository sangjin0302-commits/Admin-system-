import { NextResponse } from "next/server";
import { Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { requireRole } from "@/lib/services/admin-rbac-service";

const VALID = ["CAREER", "LICENSE", "EDUCATION", "AWARD", "ACTIVITY"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(request, ["SUPER"]);
  if (!guard.ok) return guard.response;

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

  try {
    const updated = await prisma.credential.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("admin/credentials/[id] PATCH failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireRole(_request, ["SUPER"]);
  if (!guard.ok) return guard.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  try {
    await prisma.credential.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ ok: true });
    }
    console.error("admin/credentials/[id] DELETE failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
