/**
 * CMS 이미지 업로드 — multipart/form-data.
 *
 * 필드:
 *   - key: CONTENT_KEYS 중 type="image" 키
 *   - file: 5MB 이하 이미지
 *
 * Vercel Blob에 업로드 후 URL을 SiteSetting에 저장하고 { url } 반환.
 */

import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  isValidContentKey,
  getContentType
} from "@/lib/services/site-content-keys";
import { invalidateSiteContentCache } from "@/lib/services/site-content-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.content.upload");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const enabled = await isFeatureEnabled("cms_image_upload").catch(() => true);
  if (!enabled) {
    return api.error(403, "이미지 업로드 기능이 비활성 상태입니다", { code: "FEATURE_DISABLED" });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return api.error(400, "잘못된 폼 데이터", { code: "INVALID_FORM" });
  }

  const key = formData.get("key");
  const file = formData.get("file");

  if (typeof key !== "string" || !isValidContentKey(key) || getContentType(key) !== "image") {
    return api.error(400, "알 수 없는 이미지 키", { code: "INVALID_KEY" });
  }
  if (!(file instanceof File) || file.size === 0) {
    return api.error(400, "파일이 없습니다", { code: "NO_FILE" });
  }
  if (file.size > MAX_SIZE) {
    return api.error(400, "파일이 너무 큽니다 (최대 5MB)", { code: "FILE_TOO_LARGE" });
  }
  if (!file.type.startsWith("image/")) {
    return api.error(400, "이미지 파일만 업로드 가능합니다", { code: "NOT_IMAGE" });
  }

  try {
    // Delete previous blob if present
    const existing = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
    if (existing?.value) {
      try {
        await del(existing.value);
      } catch {
        // old blob may not exist
      }
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const blob = await put(`site-content/${key}/${safeName}`, file, {
      access: "public",
      addRandomSuffix: true
    });

    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: blob.url },
      update: { value: blob.url }
    });
    invalidateSiteContentCache();

    return api.ok({ ok: true, url: blob.url });
  } catch (err) {
    api.logError(err);
    return api.error(500, "업로드 실패", { code: "UPLOAD_FAILED" });
  }
}
