/**
 * Cloudflare Images 서비스 — 이미지 업로드 · 자동 리사이즈.
 *
 * 환경변수:
 *   CLOUDFLARE_IMAGES_ACCOUNT_ID
 *   CLOUDFLARE_IMAGES_API_TOKEN
 *
 * 미설정 시: 원본 URL 그대로 반환 (fallback).
 * 저장: SiteSetting `cloudflare.images.recent` = JSON [{id, url, uploadedAt, meta}] (최근 50개)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const RECENT_KEY = "cloudflare.images.recent";
const MAX_RECENT = 50;

export type CloudflareImageResizeOptions = {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: "auto" | "webp" | "avif" | "jpeg" | "png";
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad";
};

export type CloudflareUploadResult = {
  ok: boolean;
  id?: string;
  url?: string;
  error?: string;
};

export type RecentUpload = {
  id: string;
  url: string;
  uploadedAt: string;
  meta?: Record<string, string>;
};

export function isConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID && process.env.CLOUDFLARE_IMAGES_API_TOKEN);
}

/**
 * 이미지 업로드 — 미설정 시 { ok: false } 반환.
 * 호출부에서 fallback 처리.
 */
export async function uploadImage(
  buffer: Buffer | Uint8Array,
  metadata: Record<string, string> = {}
): Promise<CloudflareUploadResult> {
  const accountId = process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
  if (!accountId || !token) {
    return { ok: false, error: "Cloudflare Images 미설정" };
  }

  try {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    form.append("file", blob, metadata.filename ?? "upload.bin");
    if (Object.keys(metadata).length > 0) {
      form.append("metadata", JSON.stringify(metadata));
    }

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      result?: { id?: string; variants?: string[] };
      errors?: Array<{ message?: string }>;
    };

    if (!res.ok || !json.success || !json.result?.id) {
      const msg = json.errors?.[0]?.message ?? `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }

    const url = json.result.variants?.[0] ?? "";
    await recordRecent({ id: json.result.id, url, uploadedAt: new Date().toISOString(), meta: metadata });
    return { ok: true, id: json.result.id, url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn("[cloudflare-images] 업로드 실패", err);
    return { ok: false, error: msg };
  }
}

/**
 * 원본 URL을 리사이즈 변형 URL로 변환.
 * Cloudflare Images URL(imagedelivery.net) 이면 flexible variant 삽입.
 * 미설정/일반 URL이면 원본 반환.
 */
export function getResizedUrl(originalUrl: string, opts: CloudflareImageResizeOptions = {}): string {
  if (!originalUrl) return originalUrl;
  if (!originalUrl.includes("imagedelivery.net")) return originalUrl;

  const parts: string[] = [];
  if (opts.width) parts.push(`w=${opts.width}`);
  if (opts.height) parts.push(`h=${opts.height}`);
  if (opts.quality) parts.push(`q=${opts.quality}`);
  if (opts.format && opts.format !== "auto") parts.push(`f=${opts.format}`);
  if (opts.fit) parts.push(`fit=${opts.fit}`);
  if (parts.length === 0) return originalUrl;

  // imagedelivery.net/<hash>/<image-id>/<variant> — variant 자리에 flexible parameters 삽입
  const flexible = parts.join(",");
  return originalUrl.replace(/\/[^/]+$/, `/${flexible}`);
}

async function readRecent(): Promise<RecentUpload[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: RECENT_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value);
    return Array.isArray(arr) ? (arr as RecentUpload[]) : [];
  } catch {
    return [];
  }
}

async function recordRecent(entry: RecentUpload): Promise<void> {
  const list = await readRecent();
  list.unshift(entry);
  const trimmed = list.slice(0, MAX_RECENT);
  await prisma.siteSetting.upsert({
    where: { key: RECENT_KEY },
    create: { key: RECENT_KEY, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  }).catch((err) => logger.warn("[cloudflare-images] 최근 저장 실패", err));
}

export async function getRecentUploads(): Promise<RecentUpload[]> {
  return readRecent();
}

/**
 * 마이그레이션 시뮬레이션 — 실제 마이그레이션은 원본 저장소 접근 필요.
 * 이 함수는 최근 업로드 목록 개수만 반환 (실제 이전 로직은 호출부에서 구현).
 */
export async function bulkMigrateStatus(): Promise<{ migrated: number; pending: number }> {
  const recent = await readRecent();
  return { migrated: recent.length, pending: 0 };
}
