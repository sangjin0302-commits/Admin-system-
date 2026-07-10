/**
 * 마케팅 지침 문서 관리 (LLL6).
 *
 * SiteSetting `marketing_guideline_doc` — 현재 지침 문서 (JSON: {version, content, updatedAt})
 * SiteSetting `marketing_guideline_doc_versions` — 과거 스냅샷 배열 (최대 20)
 *
 * 관리자에서 편집한 지침 텍스트는 LLL8 (guideline-prompt-service)에서 AI 프롬프트에 자동 주입됩니다.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const DOC_KEY = "marketing_guideline_doc";
const VERSIONS_KEY = "marketing_guideline_doc_versions";
const MAX_VERSIONS = 20;

export type GuidelineDoc = {
  version: string;
  content: string;
  updatedAt: string; // ISO
  updatedBy?: string | null;
};

export const DEFAULT_DOC: GuidelineDoc = {
  version: "v6.4",
  updatedAt: new Date(0).toISOString(),
  content: `# ETHOS 마케팅 지침 v6.4 (요약)

## 1. 전반 원칙
- 행정사법 §3 준수: 과대·과장·비교 광고 금지.
- "최고", "확실", "100%", "무조건", "1등", "보장" 등 절대적 표현 금지.
- 승소·통과율 수치는 근거 자료가 있을 때만, 조건(모수·기간) 명시.

## 2. CTA 규정
- 카테고리별 CTA 문구는 CTA 매핑(cta_copy_v64)에서 관리.
- 긴급 뱃지는 실제 법정 기한이 있는 소재(비자·행정심판)에만 사용.

## 3. 블로그 규정 (8장)
- 모든 블로그 하단에 법령 정보 제공 면책 문구 자동 삽입.
- 비용·만원 언급 시 반드시 (a) 범위, (b) 조건, (c) 개별 확인 3요소 포함.
- 판례·조문 인용 시 출처(법령명·조번·판례번호) 명시.

## 4. 톤·문체
- 존댓말, 실무 중심, 감정 과장 금지.
- 이모지·과도한 느낌표 지양 (친근 톤에서만 1개 허용).

## 5. 금지 표현 예시
- "반드시 승소" → "최선을 다해 지원"
- "100% 통과" → "요건 검토 후 안내"
- "국내 최고" → "실무 경험 바탕"
- "무료로 다 해드립니다" → "무료 검토 후 안내"

(관리자에서 이 문서를 편집하면 AI 초안 생성(reply-draft, tone-adjust 등)에 자동 반영됩니다.)`,
};

// ── 인메모리 캐시 (60초) — 프롬프트 주입 hot path 대응
type Cached = { at: number; doc: GuidelineDoc };
let _cache: Cached | null = null;
const CACHE_MS = 60_000;

export function invalidateGuidelineDocCache() {
  _cache = null;
}

function parseDoc(raw: string | null | undefined): GuidelineDoc | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === "object" &&
      typeof p.version === "string" &&
      typeof p.content === "string" &&
      typeof p.updatedAt === "string"
    ) {
      return {
        version: p.version,
        content: p.content,
        updatedAt: p.updatedAt,
        updatedBy: typeof p.updatedBy === "string" ? p.updatedBy : null,
      };
    }
  } catch (err) {
    logger.warn("[marketing-guideline-doc] parse failed", err);
  }
  return null;
}

/** 현재 지침 문서 조회. version 지정 시 과거 버전에서 검색. */
export async function getGuidelineDoc(version?: string): Promise<GuidelineDoc> {
  if (version) {
    const versions = await listVersions();
    const hit = versions.find((v) => v.version === version);
    if (hit) return hit;
    if (version === DEFAULT_DOC.version) return DEFAULT_DOC;
  }

  if (!version && _cache && Date.now() - _cache.at < CACHE_MS) return _cache.doc;

  const row = await prisma.siteSetting
    .findUnique({ where: { key: DOC_KEY } })
    .catch(() => null);
  const parsed = parseDoc(row?.value);
  const doc = parsed ?? DEFAULT_DOC;
  if (!version) _cache = { at: Date.now(), doc };
  return doc;
}

/** 과거 버전 스냅샷 목록 (최신순). */
export async function listVersions(): Promise<GuidelineDoc[]> {
  const row = await prisma.siteSetting
    .findUnique({ where: { key: VERSIONS_KEY } })
    .catch(() => null);
  if (!row?.value) return [];
  try {
    const p = JSON.parse(row.value);
    if (!Array.isArray(p)) return [];
    return p
      .map((x) => parseDoc(JSON.stringify(x)))
      .filter((x): x is GuidelineDoc => x !== null);
  } catch (err) {
    logger.warn("[marketing-guideline-doc] versions parse failed", err);
    return [];
  }
}

/** 지침 저장 + 이전 버전 스냅샷 자동 축적. */
export async function saveGuidelineDoc(
  content: string,
  version: string,
  updatedBy?: string,
): Promise<GuidelineDoc> {
  const trimmedContent = content.trim();
  const trimmedVersion = version.trim();
  if (!trimmedContent) throw new Error("지침 내용이 비어있습니다.");
  if (!trimmedVersion) throw new Error("버전 표기가 비어있습니다.");

  // 기존 문서를 versions에 스냅샷
  const prev = await getGuidelineDoc();
  const versions = await listVersions();
  const alreadySnapshotted = versions.some(
    (v) => v.version === prev.version && v.updatedAt === prev.updatedAt,
  );
  const isRealPrev = prev.updatedAt !== DEFAULT_DOC.updatedAt;
  const nextVersions = isRealPrev && !alreadySnapshotted ? [prev, ...versions] : versions;
  const capped = nextVersions.slice(0, MAX_VERSIONS);

  const doc: GuidelineDoc = {
    version: trimmedVersion,
    content: trimmedContent,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy ?? null,
  };

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: DOC_KEY },
      create: { key: DOC_KEY, value: JSON.stringify(doc), updatedBy: updatedBy ?? null },
      update: { value: JSON.stringify(doc), updatedBy: updatedBy ?? null },
    }),
    prisma.siteSetting.upsert({
      where: { key: VERSIONS_KEY },
      create: { key: VERSIONS_KEY, value: JSON.stringify(capped) },
      update: { value: JSON.stringify(capped) },
    }),
  ]);

  invalidateGuidelineDocCache();
  // LLL8 프롬프트 접미사 캐시도 즉시 무효화 (circular import 회피 위해 dynamic).
  try {
    const mod = await import("./guideline-prompt-service");
    mod.invalidateGuidelinePromptCache();
  } catch {
    /* best-effort */
  }
  return doc;
}
