/**
 * 행정심판 판례 DB — 관리자가 검색·필터·상세 열람하고 Lawbot과 동기화.
 * 저장: SiteSetting key = "precedents.db" (JSON Precedent[]).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const STORE_KEY = "precedents.db";

export type Precedent = {
  id: string;
  caseNo: string;
  court: string;
  decisionDate: string; // YYYY-MM-DD
  category: string; // e.g. "출입국", "영업허가", "건축"
  keywords: string[];
  summary: string;
  fullText?: string;
  url?: string;
  tags: string[];
  createdAt: string;
  source?: "manual" | "lawbot";
};

export type PrecedentFilters = {
  category?: string;
  court?: string;
  yearFrom?: number;
  yearTo?: number;
};

function newId(): string {
  return `prc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll(): Promise<Precedent[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as Precedent[]) : [];
  } catch (err) {
    logger.warn("[precedent-db] read failed", err);
    return [];
  }
}

async function writeAll(list: Precedent[]): Promise<void> {
  const value = JSON.stringify(list);
  await prisma.siteSetting.upsert({
    where: { key: STORE_KEY },
    create: { key: STORE_KEY, value },
    update: { value },
  });
}

export async function listPrecedents(): Promise<Precedent[]> {
  return readAll();
}

export async function getPrecedentById(id: string): Promise<Precedent | null> {
  const all = await readAll();
  return all.find((p) => p.id === id) ?? null;
}

export async function addPrecedent(
  input: Omit<Precedent, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<Precedent> {
  const all = await readAll();
  const record: Precedent = {
    id: input.id ?? newId(),
    caseNo: input.caseNo.trim(),
    court: input.court.trim(),
    decisionDate: input.decisionDate,
    category: input.category.trim(),
    keywords: input.keywords ?? [],
    summary: input.summary,
    fullText: input.fullText,
    url: input.url,
    tags: input.tags ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
    source: input.source ?? "manual",
  };
  all.unshift(record);
  await writeAll(all);
  return record;
}

export async function updatePrecedent(
  id: string,
  patch: Partial<Omit<Precedent, "id" | "createdAt">>
): Promise<Precedent | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  await writeAll(all);
  return all[idx];
}

export async function deletePrecedent(id: string): Promise<boolean> {
  const all = await readAll();
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length === all.length) return false;
  await writeAll(filtered);
  return true;
}

function matchesQuery(p: Precedent, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    p.caseNo.toLowerCase().includes(needle) ||
    p.summary.toLowerCase().includes(needle) ||
    p.court.toLowerCase().includes(needle) ||
    p.keywords.some((k) => k.toLowerCase().includes(needle)) ||
    p.tags.some((t) => t.toLowerCase().includes(needle))
  );
}

export async function searchPrecedents(
  query: string,
  filters: PrecedentFilters = {}
): Promise<Precedent[]> {
  const all = await readAll();
  const q = (query ?? "").trim();
  return all.filter((p) => {
    if (!matchesQuery(p, q)) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.court && p.court !== filters.court) return false;
    if (filters.yearFrom || filters.yearTo) {
      const year = Number(p.decisionDate.slice(0, 4));
      if (filters.yearFrom && year < filters.yearFrom) return false;
      if (filters.yearTo && year > filters.yearTo) return false;
    }
    return true;
  });
}

export async function getPrecedentsByCategory(category: string): Promise<Precedent[]> {
  return searchPrecedents("", { category });
}

/**
 * Lawbot 동기화 — LAWBOT_API_URL 이 설정된 경우 GET {url}/precedents 로 최신 판례를 받아 upsert.
 * 응답 shape: { precedents: Array<Omit<Precedent, "id"|"createdAt"|"source">> }
 * 실패해도 예외 던지지 않고 { added: number, error?: string } 반환.
 */
export async function syncFromLawbot(): Promise<{ added: number; error?: string }> {
  const baseUrl = process.env.LAWBOT_API_URL;
  if (!baseUrl) return { added: 0, error: "LAWBOT_API_URL not set" };
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/precedents`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { added: 0, error: `Lawbot ${res.status}` };
    const data = (await res.json()) as { precedents?: Array<Partial<Precedent>> };
    const incoming = data.precedents ?? [];
    const existing = await readAll();
    const seen = new Set(existing.map((p) => `${p.caseNo}|${p.court}`));
    let added = 0;
    for (const raw of incoming) {
      if (!raw.caseNo || !raw.court) continue;
      const key = `${raw.caseNo}|${raw.court}`;
      if (seen.has(key)) continue;
      existing.unshift({
        id: newId(),
        caseNo: raw.caseNo,
        court: raw.court,
        decisionDate: raw.decisionDate ?? "",
        category: raw.category ?? "미분류",
        keywords: raw.keywords ?? [],
        summary: raw.summary ?? "",
        fullText: raw.fullText,
        url: raw.url,
        tags: raw.tags ?? [],
        createdAt: new Date().toISOString(),
        source: "lawbot",
      });
      seen.add(key);
      added++;
    }
    if (added > 0) await writeAll(existing);
    return { added };
  } catch (err) {
    logger.warn("[precedent-db] sync failed", err);
    return { added: 0, error: (err as Error).message };
  }
}

/** 카테고리 + 키워드로 관련 판례 상위 N개. */
export async function findSimilarPrecedents(
  category: string | null | undefined,
  keywords: string[],
  limit = 5
): Promise<Precedent[]> {
  const all = await readAll();
  const kw = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const scored = all.map((p) => {
    let score = 0;
    if (category && p.category === category) score += 3;
    for (const k of kw) {
      if (p.keywords.some((pk) => pk.toLowerCase().includes(k))) score += 2;
      if (p.summary.toLowerCase().includes(k)) score += 1;
    }
    return { p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}
