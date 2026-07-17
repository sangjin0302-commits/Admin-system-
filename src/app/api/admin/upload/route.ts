import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";
import { invalidateSiteSettingsCache } from "@/lib/services/site-settings";
import { logger } from "@/lib/utils/logger";

const ALLOWED_KEYS = ["image.logo", "image.aboutPhoto", "image.ogImage", "image.assocBadge"] as const;
type ImageKey = (typeof ALLOWED_KEYS)[number];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 이미지가 노출되는 모든 공개 페이지. 저장·삭제 즉시 갱신되게 revalidate.
 * (내부 in-memory 캐시는 invalidateSiteSettingsCache로 별도 무효화)
 */
const REVALIDATE_PATHS = ["/", "/about", "/links"] as const;

function revalidatePublicPages() {
  for (const p of REVALIDATE_PATHS) {
    try {
      revalidatePath(p);
    } catch (err) {
      logger.warn("[upload] revalidatePath 실패", { path: p, err: String(err) });
    }
  }
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "INVALID_FORM" }, { status: 400 });
  }

  const key = formData.get("key") as string | null;
  const file = formData.get("file") as File | null;

  if (!key || !ALLOWED_KEYS.includes(key as ImageKey)) {
    return NextResponse.json({ ok: false, error: "INVALID_KEY" }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "NOT_IMAGE" }, { status: 400 });
  }

  // 로컬 dev 등 토큰 미설정 환경에서 500 사일런트 실패 방지.
  // put()이 토큰을 자동으로 찾지 못하면 인자로 넘겨줘야 명확한 실패.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    logger.error("[upload] BLOB_READ_WRITE_TOKEN 미설정 — Vercel Blob 저장 불가", { key });
    return NextResponse.json(
      {
        ok: false,
        error: "BLOB_TOKEN_MISSING",
        message:
          "Vercel Blob 토큰이 설정되지 않았습니다. Vercel 프로젝트 Settings → Environment Variables에서 BLOB_READ_WRITE_TOKEN을 Development 환경에도 추가하거나, 프로덕션에서 시도하세요.",
      },
      { status: 500 }
    );
  }

  // Delete previous blob if exists
  const existing = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (existing?.value) {
    try {
      await del(existing.value);
    } catch (err) {
      logger.warn("[upload] 이전 blob 삭제 실패 (무시)", { key, err: String(err) });
    }
  }

  // Upload to Vercel Blob — 여기가 진짜 실패 지점. 반드시 catch.
  let blobUrl: string;
  try {
    const blob = await put(`site/${key}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    blobUrl = blob.url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[upload] Vercel Blob put 실패", { key, err: msg });
    return NextResponse.json(
      {
        ok: false,
        error: "BLOB_UPLOAD_FAILED",
        message: `이미지 저장소 업로드 실패: ${msg}`,
      },
      { status: 502 }
    );
  }

  // Save URL to SiteSetting
  try {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: blobUrl },
      update: { value: blobUrl },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[upload] DB 저장 실패 — blob은 남음", { key, blobUrl, err: msg });
    return NextResponse.json(
      {
        ok: false,
        error: "DB_SAVE_FAILED",
        message: `DB 저장 실패: ${msg}`,
        blobUrl,
      },
      { status: 500 }
    );
  }
  invalidateSiteSettingsCache();
  revalidatePublicPages();

  return NextResponse.json({ ok: true, url: blobUrl });
}

export async function DELETE(request: Request) {
  const { key } = await request.json().catch(() => ({ key: null }));
  if (!key || !ALLOWED_KEYS.includes(key as ImageKey)) {
    return NextResponse.json({ ok: false, error: "INVALID_KEY" }, { status: 400 });
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (existing?.value) {
    try {
      await del(existing.value);
    } catch (err) {
      logger.warn("[upload] blob 삭제 실패 (무시)", { key, err: String(err) });
    }
  }

  try {
    await prisma.siteSetting.delete({ where: { key } });
  } catch (err) {
    // 이미 없을 수 있음. P2025는 정상.
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("P2025") && !msg.includes("Record to delete does not exist")) {
      logger.warn("[upload] DB delete 실패", { key, err: msg });
    }
  }
  invalidateSiteSettingsCache();
  revalidatePublicPages();

  return NextResponse.json({ ok: true });
}
