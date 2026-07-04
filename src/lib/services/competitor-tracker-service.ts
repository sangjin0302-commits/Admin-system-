/**
 * Competitor tracker — manually curated. No scraping (legally gray).
 *
 * SiteSetting.key = "competitors.entries" holds a JSON array of Competitor.
 * CRUD helpers exposed for the admin UI; every mutation rewrites the array
 * back into the same row.
 */

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const KEY = "competitors.entries";

export type CompetitorService = {
  name: string;
  priceRange: string; // free-form: "33만원", "50-100만원", "사안별 협의"
};

export type Competitor = {
  id: string;
  name: string;
  url: string;
  services: CompetitorService[];
  notes: string;
  updatedAt: string; // ISO
};

export type CompetitorInput = Omit<Competitor, "id" | "updatedAt">;

async function readAll(): Promise<Competitor[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as Competitor[];
  } catch (err) {
    logger.warn("[competitor-tracker] read failed", err);
    return [];
  }
}

async function writeAll(entries: Competitor[]): Promise<void> {
  const value = JSON.stringify(entries);
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value, updatedBy: "competitor-tracker-service" },
    update: { value, updatedBy: "competitor-tracker-service" },
  });
}

function normalize(input: CompetitorInput): CompetitorInput {
  return {
    name: input.name.trim(),
    url: input.url.trim(),
    notes: (input.notes ?? "").trim(),
    services: Array.isArray(input.services)
      ? input.services
          .filter((s) => s && typeof s.name === "string" && s.name.trim().length > 0)
          .map((s) => ({ name: s.name.trim(), priceRange: (s.priceRange ?? "").trim() }))
      : [],
  };
}

export async function listCompetitors(): Promise<Competitor[]> {
  return readAll();
}

export async function getCompetitor(id: string): Promise<Competitor | null> {
  const all = await readAll();
  return all.find((c) => c.id === id) ?? null;
}

export async function addCompetitor(data: CompetitorInput): Promise<Competitor> {
  const normalized = normalize(data);
  if (!normalized.name) throw new Error("NAME_REQUIRED");
  const entry: Competitor = {
    id: randomUUID(),
    ...normalized,
    updatedAt: new Date().toISOString(),
  };
  const all = await readAll();
  all.push(entry);
  await writeAll(all);
  return entry;
}

export async function updateCompetitor(
  id: string,
  data: Partial<CompetitorInput>
): Promise<Competitor | null> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const merged = normalize({ ...all[idx], ...data } as CompetitorInput);
  all[idx] = { ...all[idx], ...merged, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx];
}

export async function removeCompetitor(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/**
 * Load ETHOS pricing from FeeItem for side-by-side comparison.
 */
export async function loadEthosPricing(): Promise<{ service: string; amount: string; category: string }[]> {
  try {
    const items = await prisma.feeItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      select: { service: true, amount: true, category: true },
    });
    return items.map((i) => ({ service: i.service, amount: i.amount, category: i.category }));
  } catch (err) {
    logger.warn("[competitor-tracker] load ethos pricing failed", err);
    return [];
  }
}

/**
 * Very rough price parse: extract the smallest integer 만원-amount from a
 * free-form string. Returns null when no number is found. Used only to
 * produce the "X% 저렴/비싸다" hint — never for billing.
 */
export function roughPriceWon(text: string): number | null {
  if (!text) return null;
  // Match "50만원", "50만", "500,000"
  const manMatch = text.match(/(\d[\d,]*)\s*만/);
  if (manMatch) {
    const n = Number(manMatch[1].replace(/,/g, ""));
    if (Number.isFinite(n)) return n * 10000;
  }
  const wonMatch = text.match(/(\d[\d,]{2,})/);
  if (wonMatch) {
    const n = Number(wonMatch[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 1000) return n;
  }
  return null;
}

export type ComparisonHint = {
  serviceKey: string;
  ethosPrice: number;
  competitorPrice: number;
  competitorName: string;
  diffPct: number; // positive => ETHOS is cheaper by this percent
};

export async function buildComparisonHints(): Promise<ComparisonHint[]> {
  const [competitors, ethos] = await Promise.all([listCompetitors(), loadEthosPricing()]);
  const hints: ComparisonHint[] = [];
  for (const comp of competitors) {
    for (const svc of comp.services) {
      const compPrice = roughPriceWon(svc.priceRange);
      if (compPrice == null) continue;
      // Fuzzy match: pick the ETHOS FeeItem whose service name shares the
      // most characters with the competitor service name.
      const matched = ethos
        .map((e) => ({ e, score: overlapScore(e.service, svc.name) }))
        .sort((a, b) => b.score - a.score)[0];
      if (!matched || matched.score < 0.2) continue;
      const ethosPrice = roughPriceWon(matched.e.amount);
      if (ethosPrice == null) continue;
      const diffPct = ((compPrice - ethosPrice) / compPrice) * 100;
      hints.push({
        serviceKey: `${comp.name} · ${svc.name}`,
        ethosPrice,
        competitorPrice: compPrice,
        competitorName: comp.name,
        diffPct: Number(diffPct.toFixed(1)),
      });
    }
  }
  return hints;
}

function overlapScore(a: string, b: string): number {
  const set = new Set(a.replace(/\s+/g, ""));
  let matched = 0;
  for (const ch of b.replace(/\s+/g, "")) if (set.has(ch)) matched += 1;
  const denom = Math.max(1, Math.max(a.length, b.length));
  return matched / denom;
}
