import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

/**
 * 통합 검색 — 사건 + 문의 + 사례를 한 번에.
 * SQLite/Postgres 호환 위해 contains(대소문자) 단순 사용.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ ok: true, q, cases: [], inquiries: [], caseStudies: [] });

  const [cases, inquiries, caseStudies] = await Promise.all([
    prisma.caseMatter
      .findMany({
        where: { OR: [{ title: { contains: q } }, { caseNo: { contains: q } }, { summary: { contains: q } }] },
        select: { id: true, caseNo: true, title: true, status: true },
        take: 20,
        orderBy: { updatedAt: "desc" }
      })
      .catch(() => []),
    prisma.inquiry
      .findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { contactName: { contains: q } },
            { email: { contains: q } },
            { publicTrackingCode: { contains: q } }
          ]
        },
        select: { id: true, title: true, contactName: true, status: true, publicTrackingCode: true },
        take: 20,
        orderBy: { createdAt: "desc" }
      })
      .catch(() => []),
    prisma.caseStudy
      .findMany({
        where: { OR: [{ title: { contains: q } }, { summary: { contains: q } }] },
        select: { id: true, title: true, category: true, published: true },
        take: 20
      })
      .catch(() => [])
  ]);

  return NextResponse.json({ ok: true, q, cases, inquiries, caseStudies });
}
