import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

/**
 * 사건 선택용 경량 목록 (id + 라벨). lawbot 분석 저장 등에서 사용.
 */
export async function GET() {
  try {
    const rows = await prisma.caseMatter.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { id: true, caseNo: true, title: true, status: true }
    });
    const items = rows.map((r) => ({
      id: r.id,
      label: `${r.caseNo ? r.caseNo + " · " : ""}${r.title}`
    }));
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
