/**
 * 블로그 본문/카드뉴스용 범용 이미지 업로드 — multipart/form-data.
 *
 * 기존 업로드 엔드포인트는 특정 사이트설정 키(logo·aboutPhoto 등) 전용이라
 * 블로그 글에 자유롭게 이미지를 넣을 수 없었다. 이 엔드포인트는 Vercel Blob 에
 * 올리고 **URL 만 반환**(DB 저장 없음) → 에디터가 마크다운 이미지로 삽입한다.
 *
 * 필드: file (5MB 이하 이미지). 응답: { ok, url }.
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB (블로그 본문 고해상 이미지 여유)

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "잘못된 폼 데이터" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "파일이 없습니다" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "파일이 너무 큽니다 (최대 5MB)" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "이미지 파일만 업로드 가능합니다" }, { status: 400 });
  }

  try {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_") || "image";
    const blob = await put(`blog/${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    logger.error("[blog-upload-image] 실패", err);
    return NextResponse.json({ ok: false, error: "업로드 실패" }, { status: 500 });
  }
}
