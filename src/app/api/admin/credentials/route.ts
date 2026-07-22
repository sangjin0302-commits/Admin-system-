import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { listAdminCredentials } from "@/lib/services/credentials";

const VALID = ["CAREER", "LICENSE", "EDUCATION", "AWARD", "ACTIVITY"];

export async function GET() {
  const items = await listAdminCredentials();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const type = typeof body.type === "string" && VALID.includes(body.type) ? body.type : "CAREER";
  const year = typeof body.year === "string" ? body.year.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const detail = typeof body.detail === "string" ? body.detail.trim() : "";

  if (!year || !title) {
    return NextResponse.json({ ok: false, error: "연도/제목은 필수입니다." }, { status: 400 });
  }

  try {
    const created = await prisma.credential.create({
      data: { type, year, title, detail, sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0 }
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (error) {
    console.error("admin/credentials POST failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
