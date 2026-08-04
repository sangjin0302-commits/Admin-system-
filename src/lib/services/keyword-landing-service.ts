/**
 * 키워드 랜딩 자동확장 서비스.
 *
 * 하드코딩된 기본 7개 랜딩(/keyword/[term])은 그대로 두고, GSC 갭 파인더에서
 * 발견한 신규 검색어를 원클릭으로 **DB 랜딩**으로 추가한다. 저장은 새 마이그레이션
 * 없이 SiteSetting(prefix `kwlanding.`, index `kwlanding.__index__`)에 JSON 으로.
 *
 * 외부 유료 API·AI 생성 없음(무료·내부). 랜딩 본문은 기존 /keyword 템플릿이
 * label·tokens·description 으로 렌더한다.
 *
 * 순수 헬퍼(slugifyQuery·isValidKeywordSlug·deriveTokens)는 DB 없이 테스트 가능
 * (test:keyword-landing).
 */

import { prisma } from "@/lib/prisma/client";

export type KeywordLandingRecord = {
  slug: string;
  label: string;
  group: string;
  description: string;
  tokens: string[];
  deadlineNote?: string;
  createdAt: string;
};

const KEY_PREFIX = "kwlanding.";
const INDEX_KEY = "kwlanding.__index__";
const SLUG_MAX = 48;

/* -------------------------------------------------------------------- */
/*  순수 헬퍼 (테스트 대상)                                              */
/* -------------------------------------------------------------------- */

/** 한글·영숫자·하이픈 허용 슬러그(기존 랜딩이 "귀화"·"행정심판" 등 한글 슬러그). */
export function isValidKeywordSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length > SLUG_MAX) return false;
  return /^[\p{L}\p{N}][\p{L}\p{N}-]*$/u.test(slug);
}

/** GSC 검색어 → URL 슬러그. 공백→하이픈, 허용 외 문자 제거, 소문자(영문). */
export function slugifyQuery(query: string): string {
  const s = (query ?? "")
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  return s;
}

/** 검색어 → 블로그 매칭 토큰(원문 + 공백분리 조각, 2자 이상, 중복 제거). */
export function deriveTokens(query: string): string[] {
  const norm = (query ?? "").normalize("NFC").trim();
  if (!norm) return [];
  const parts = norm.split(/\s+/).filter((p) => p.length >= 2);
  return Array.from(new Set([norm, ...parts]));
}

/* -------------------------------------------------------------------- */
/*  저장/조회                                                           */
/* -------------------------------------------------------------------- */

function keyFor(slug: string) {
  return `${KEY_PREFIX}${slug}`;
}

function parseRecord(slug: string, value: string): KeywordLandingRecord | null {
  try {
    const o = JSON.parse(value) as Record<string, unknown>;
    if (!o || typeof o !== "object") return null;
    const tokens = Array.isArray(o.tokens) ? o.tokens.filter((t): t is string => typeof t === "string") : [];
    return {
      slug,
      label: typeof o.label === "string" && o.label ? o.label : slug,
      group: typeof o.group === "string" && o.group ? o.group : "기타",
      description: typeof o.description === "string" ? o.description : "",
      tokens: tokens.length > 0 ? tokens : [slug],
      deadlineNote: typeof o.deadlineNote === "string" ? o.deadlineNote : undefined,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function readIndex(): Promise<string[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: INDEX_KEY } }).catch(() => null);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    /* ignore */
  }
  return [];
}

async function writeIndex(slugs: string[]): Promise<void> {
  const unique = Array.from(new Set(slugs));
  await prisma.siteSetting.upsert({
    where: { key: INDEX_KEY },
    create: { key: INDEX_KEY, value: JSON.stringify(unique) },
    update: { value: JSON.stringify(unique) },
  });
}

/** DB 로 추가된 랜딩 전체(신규→오래된 순). DB 오류 시 빈 배열(공개 페이지 안전). */
export async function getExtraKeywordLandings(): Promise<KeywordLandingRecord[]> {
  const slugs = await readIndex();
  if (slugs.length === 0) return [];
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: slugs.map(keyFor) } } }).catch(() => []);
  const bySlug = new Map<string, string>();
  for (const row of rows) {
    if (row.key.startsWith(KEY_PREFIX)) bySlug.set(row.key.slice(KEY_PREFIX.length), row.value);
  }
  const out: KeywordLandingRecord[] = [];
  for (const slug of slugs) {
    const v = bySlug.get(slug);
    if (!v) continue;
    const parsed = parseRecord(slug, v);
    if (parsed) out.push(parsed);
  }
  return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getKeywordLanding(slug: string): Promise<KeywordLandingRecord | null> {
  if (!isValidKeywordSlug(slug)) return null;
  const row = await prisma.siteSetting.findUnique({ where: { key: keyFor(slug) } }).catch(() => null);
  if (!row) return null;
  return parseRecord(slug, row.value);
}

/** GSC 갭 검색어에서 템플릿 랜딩 생성(무료·AI 없음). 이미 있으면 SLUG_EXISTS. */
export async function createKeywordLandingFromQuery(
  query: string,
  opts: { group?: string; description?: string } = {}
): Promise<KeywordLandingRecord> {
  const slug = slugifyQuery(query);
  if (!isValidKeywordSlug(slug)) throw new Error("INVALID_SLUG");
  const existing = await prisma.siteSetting.findUnique({ where: { key: keyFor(slug) } }).catch(() => null);
  if (existing) throw new Error("SLUG_EXISTS");
  const label = query.normalize("NFC").trim().slice(0, 60) || slug;
  const record: KeywordLandingRecord = {
    slug,
    label,
    group: opts.group?.trim() || "기타",
    description:
      opts.description?.trim() ||
      `${label} 관련 실무 안내와 관련 칼럼 모음 — 에토스 행정사사무소(ETHOS).`,
    tokens: deriveTokens(query),
    createdAt: new Date().toISOString(),
  };
  await prisma.siteSetting.create({ data: { key: keyFor(slug), value: JSON.stringify(record) } });
  const slugs = await readIndex();
  if (!slugs.includes(slug)) {
    slugs.push(slug);
    await writeIndex(slugs);
  }
  return record;
}

export async function deleteKeywordLanding(slug: string): Promise<boolean> {
  if (!isValidKeywordSlug(slug)) return false;
  try {
    await prisma.siteSetting.delete({ where: { key: keyFor(slug) } });
  } catch {
    /* ignore missing */
  }
  const slugs = await readIndex();
  const next = slugs.filter((s) => s !== slug);
  if (next.length !== slugs.length) await writeIndex(next);
  return true;
}
