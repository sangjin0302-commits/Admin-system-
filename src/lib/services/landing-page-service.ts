/**
 * Landing Page Builder Service
 *
 * Stores per-slug landing page block definitions in `SiteSetting` under
 * key pattern `landing.{slug}` (JSON-encoded value). Uses SiteSetting to
 * avoid a new Prisma migration.
 */

import { prisma } from "@/lib/prisma/client";

export type LandingBlockType = "hero" | "stats" | "testimonial" | "faq" | "cta";

export type LandingBlock = {
  id: string;
  type: LandingBlockType;
  data: Record<string, unknown>;
};

export type LandingPageRecord = {
  slug: string;
  title: string;
  blocks: LandingBlock[];
  updatedAt: string;
};

const LANDING_KEY_PREFIX = "landing.";
const LANDING_INDEX_KEY = "landing.__index__";

/* -------------------------------------------------------------------- */
/*  Slug + block helpers                                                */
/* -------------------------------------------------------------------- */

const SLUG_MAX_LENGTH = 64;

export function isValidLandingSlug(slug: string): boolean {
  if (!slug) return false;
  if (slug.length > SLUG_MAX_LENGTH) return false;
  return /^[a-z0-9][a-z0-9-]*$/i.test(slug);
}

function keyFor(slug: string) {
  return `${LANDING_KEY_PREFIX}${slug}`;
}

function normalizeBlock(raw: unknown, index: number): LandingBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  if (
    type !== "hero" &&
    type !== "stats" &&
    type !== "testimonial" &&
    type !== "faq" &&
    type !== "cta"
  ) {
    return null;
  }
  const data =
    obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : {};
  const id = typeof obj.id === "string" && obj.id ? obj.id : `blk_${index}_${Date.now().toString(36)}`;
  return { id, type, data };
}

function parseRecord(slug: string, value: string): LandingPageRecord | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    const title = typeof obj.title === "string" ? obj.title : slug;
    const rawBlocks = Array.isArray(obj.blocks) ? obj.blocks : [];
    const blocks: LandingBlock[] = [];
    rawBlocks.forEach((b, i) => {
      const normalized = normalizeBlock(b, i);
      if (normalized) blocks.push(normalized);
    });
    const updatedAt =
      typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString();
    return { slug, title, blocks, updatedAt };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------- */
/*  Index management                                                    */
/* -------------------------------------------------------------------- */

async function readIndex(): Promise<string[]> {
  const row = await prisma.siteSetting
    .findUnique({ where: { key: LANDING_INDEX_KEY } })
    .catch(() => null);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((s): s is string => typeof s === "string");
    }
  } catch {
    /* ignore */
  }
  return [];
}

async function writeIndex(slugs: string[]): Promise<void> {
  const unique = Array.from(new Set(slugs));
  await prisma.siteSetting.upsert({
    where: { key: LANDING_INDEX_KEY },
    create: { key: LANDING_INDEX_KEY, value: JSON.stringify(unique) },
    update: { value: JSON.stringify(unique) }
  });
}

async function addToIndex(slug: string) {
  const slugs = await readIndex();
  if (!slugs.includes(slug)) {
    slugs.push(slug);
    await writeIndex(slugs);
  }
}

async function removeFromIndex(slug: string) {
  const slugs = await readIndex();
  const next = slugs.filter((s) => s !== slug);
  if (next.length !== slugs.length) {
    await writeIndex(next);
  }
}

/* -------------------------------------------------------------------- */
/*  Public API                                                          */
/* -------------------------------------------------------------------- */

export async function getLanding(slug: string): Promise<LandingPageRecord | null> {
  if (!isValidLandingSlug(slug)) return null;
  const row = await prisma.siteSetting
    .findUnique({ where: { key: keyFor(slug) } })
    .catch(() => null);
  if (!row) return null;
  return parseRecord(slug, row.value);
}

export async function listLandings(): Promise<LandingPageRecord[]> {
  const slugs = await readIndex();
  if (slugs.length === 0) return [];
  const rows = await prisma.siteSetting
    .findMany({ where: { key: { in: slugs.map(keyFor) } } })
    .catch(() => []);
  const bySlug = new Map<string, string>();
  for (const row of rows) {
    if (row.key.startsWith(LANDING_KEY_PREFIX)) {
      bySlug.set(row.key.slice(LANDING_KEY_PREFIX.length), row.value);
    }
  }
  const results: LandingPageRecord[] = [];
  for (const slug of slugs) {
    const value = bySlug.get(slug);
    if (!value) continue;
    const parsed = parseRecord(slug, value);
    if (parsed) results.push(parsed);
  }
  return results.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function createLanding(
  slug: string,
  title: string,
  blocks: LandingBlock[] = []
): Promise<LandingPageRecord> {
  if (!isValidLandingSlug(slug)) {
    throw new Error("INVALID_SLUG");
  }
  const existing = await prisma.siteSetting
    .findUnique({ where: { key: keyFor(slug) } })
    .catch(() => null);
  if (existing) {
    throw new Error("SLUG_EXISTS");
  }
  const record: LandingPageRecord = {
    slug,
    title: title || slug,
    blocks: blocks.map((b, i) => normalizeBlock(b, i)).filter(Boolean) as LandingBlock[],
    updatedAt: new Date().toISOString()
  };
  await prisma.siteSetting.create({
    data: {
      key: keyFor(slug),
      value: JSON.stringify(record)
    }
  });
  await addToIndex(slug);
  return record;
}

export async function updateLanding(
  slug: string,
  data: Partial<Pick<LandingPageRecord, "title" | "blocks">>
): Promise<LandingPageRecord | null> {
  if (!isValidLandingSlug(slug)) return null;
  const current = await getLanding(slug);
  if (!current) return null;
  const next: LandingPageRecord = {
    slug,
    title: typeof data.title === "string" ? data.title : current.title,
    blocks: Array.isArray(data.blocks)
      ? (data.blocks.map((b, i) => normalizeBlock(b, i)).filter(Boolean) as LandingBlock[])
      : current.blocks,
    updatedAt: new Date().toISOString()
  };
  await prisma.siteSetting.upsert({
    where: { key: keyFor(slug) },
    create: { key: keyFor(slug), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) }
  });
  await addToIndex(slug);
  return next;
}

export async function deleteLanding(slug: string): Promise<boolean> {
  if (!isValidLandingSlug(slug)) return false;
  try {
    await prisma.siteSetting.delete({ where: { key: keyFor(slug) } });
  } catch {
    /* ignore missing */
  }
  await removeFromIndex(slug);
  return true;
}

/* -------------------------------------------------------------------- */
/*  Block defaults (for editor UI)                                      */
/* -------------------------------------------------------------------- */

export function defaultBlockData(type: LandingBlockType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { eyebrow: "", title: "", subtitle: "", ctaLabel: "무료 검토 신청", ctaHref: "/intake" };
    case "stats":
      return {
        title: "숫자로 보는 신뢰",
        items: [
          { value: "500+", label: "처리 사건" },
          { value: "24h", label: "회신 시간" },
          { value: "3", label: "지원 언어" }
        ]
      };
    case "testimonial":
      return { author: "", quote: "", context: "" };
    case "faq":
      return {
        title: "자주 묻는 질문",
        items: [{ q: "", a: "" }]
      };
    case "cta":
      return {
        title: "지금 시작하세요",
        subtitle: "",
        ctaLabel: "무료 검토 신청",
        ctaHref: "/intake"
      };
    default:
      return {};
  }
}
