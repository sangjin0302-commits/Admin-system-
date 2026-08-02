/**
 * 블로그 데이터 정리 — 기존에 잘못 저장된 글을 재수입 없이 교정.
 *  1) 제목 정규화: URL 인코딩(`+`, `%XX`) 제목을 사람이 읽는 형태로 디코드
 *  2) 중복 제거: 같은 네이버 글(logNo)이 여러 건이면 최신 1건만 남기고 삭제
 *
 *   POST /api/admin/blog-cleanup  → { ok, titlesFixed, duplicatesRemoved }
 */

import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeTitle(s: string): string {
  let t = s ?? "";
  if (/%[0-9A-Fa-f]{2}/.test(t) || t.includes("+")) {
    try {
      t = decodeURIComponent(t.replace(/\+/g, " "));
    } catch {
      t = t.replace(/\+/g, " ");
    }
  }
  return t.trim();
}

function logNoOf(url: string | null): string | null {
  return url?.match(/(\d{6,})/)?.[1] ?? null;
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const posts = await prisma.blogPost.findMany({
    select: { id: true, title: true, originalUrl: true, createdAt: true, publishedAt: true }
  });

  // 1) 제목 정규화
  let titlesFixed = 0;
  for (const p of posts) {
    const fixed = normalizeTitle(p.title);
    if (fixed && fixed !== p.title) {
      await prisma.blogPost.update({ where: { id: p.id }, data: { title: fixed } }).catch(() => null);
      titlesFixed++;
    }
  }

  // 2) 중복 제거 — logNo 기준 그룹, 최신(publishedAt/createdAt) 1건만 유지
  const byLogNo = new Map<string, typeof posts>();
  for (const p of posts) {
    const key = logNoOf(p.originalUrl);
    if (!key) continue;
    const arr = byLogNo.get(key) ?? [];
    arr.push(p);
    byLogNo.set(key, arr);
  }
  let duplicatesRemoved = 0;
  const toDelete: string[] = [];
  for (const group of byLogNo.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => {
      const ad = (a.publishedAt ?? a.createdAt).getTime();
      const bd = (b.publishedAt ?? b.createdAt).getTime();
      return bd - ad; // 최신 우선
    });
    for (const dup of sorted.slice(1)) toDelete.push(dup.id);
  }
  if (toDelete.length > 0) {
    const res = await prisma.blogPost.deleteMany({ where: { id: { in: toDelete } } }).catch(() => null);
    duplicatesRemoved = res?.count ?? 0;
  }

  return NextResponse.json({ ok: true, titlesFixed, duplicatesRemoved, scanned: posts.length });
}
