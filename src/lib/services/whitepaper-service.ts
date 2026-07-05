/**
 * AI 법률 백서 판매 서비스.
 * Storage:
 *   "whitepapers.catalog"    → Whitepaper[]
 *   "whitepapers.purchases"  → Purchase[]
 *   "whitepapers.links"      → DownloadLink[]  (24h expiring)
 */

import { prisma } from "@/lib/prisma/client";

export type WhitepaperCategory = "practice_guide" | "case_analysis" | "procedure_guide";

export interface Whitepaper {
  id: string;
  title: string;
  description: string;
  price: number;                 // KRW
  tocPreview: string[];          // outline entries
  pdfUrl: string;                // storage key or URL
  coverImage?: string;
  category: WhitepaperCategory;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  sampleUrl?: string;            // watermarked first-3-pages preview
}

export interface Purchase {
  id: string;
  whitepaperId: string;
  buyerEmail: string;
  amountKrw: number;
  paidAt: string;
  tossPaymentKey?: string;
}

export interface DownloadLink {
  token: string;
  whitepaperId: string;
  buyerEmail: string;
  expiresAt: string;
}

const CATALOG_KEY = "whitepapers.catalog";
const PURCHASES_KEY = "whitepapers.purchases";
const LINKS_KEY = "whitepapers.links";

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row || !row.value) return fallback;
  try { return JSON.parse(row.value) as T; } catch { return fallback; }
}
async function writeJson(key: string, v: unknown): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(v) },
    update: { value: JSON.stringify(v) },
  });
}
function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function genToken(): string {
  return Array.from({ length: 4 })
    .map(() => Math.random().toString(36).slice(2, 10))
    .join("");
}

// --- Catalog ---
export async function listWhitepapers(opts?: { publishedOnly?: boolean; category?: WhitepaperCategory }): Promise<Whitepaper[]> {
  const all = await readJson<Whitepaper[]>(CATALOG_KEY, []);
  return all.filter((w) => {
    if (opts?.publishedOnly && !w.published) return false;
    if (opts?.category && w.category !== opts.category) return false;
    return true;
  });
}

export async function getWhitepaper(id: string): Promise<Whitepaper | null> {
  const all = await readJson<Whitepaper[]>(CATALOG_KEY, []);
  return all.find((w) => w.id === id) ?? null;
}

export async function upsertWhitepaper(input: Omit<Whitepaper, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Whitepaper> {
  const all = await readJson<Whitepaper[]>(CATALOG_KEY, []);
  const now = new Date().toISOString();
  if (input.id) {
    const idx = all.findIndex((w) => w.id === input.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...input, id: input.id, updatedAt: now };
      await writeJson(CATALOG_KEY, all);
      return all[idx];
    }
  }
  const record: Whitepaper = {
    ...input,
    id: input.id ?? genId("wp"),
    createdAt: now,
    updatedAt: now,
  };
  all.push(record);
  await writeJson(CATALOG_KEY, all);
  return record;
}

export async function deleteWhitepaper(id: string): Promise<void> {
  const all = await readJson<Whitepaper[]>(CATALOG_KEY, []);
  await writeJson(CATALOG_KEY, all.filter((w) => w.id !== id));
}

export async function setPublished(id: string, published: boolean): Promise<Whitepaper | null> {
  const wp = await getWhitepaper(id);
  if (!wp) return null;
  return upsertWhitepaper({ ...wp, published });
}

// --- Purchases ---
export async function recordPurchase(input: {
  whitepaperId: string;
  buyerEmail: string;
  amountKrw: number;
  tossPaymentKey?: string;
}): Promise<{ purchase: Purchase; downloadUrl: string }> {
  const purchases = await readJson<Purchase[]>(PURCHASES_KEY, []);
  const now = new Date().toISOString();
  const purchase: Purchase = {
    id: genId("pur"),
    ...input,
    paidAt: now,
  };
  purchases.push(purchase);
  await writeJson(PURCHASES_KEY, purchases);
  const link = await issueDownloadLink(input.whitepaperId, input.buyerEmail);
  return { purchase, downloadUrl: `/api/whitepapers/download?token=${link.token}` };
}

export async function listPurchases(filter?: { buyerEmail?: string }): Promise<Purchase[]> {
  const all = await readJson<Purchase[]>(PURCHASES_KEY, []);
  return all
    .filter((p) => (filter?.buyerEmail ? p.buyerEmail === filter.buyerEmail : true))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

// --- Download links (24h expiring) ---
export async function issueDownloadLink(whitepaperId: string, buyerEmail: string): Promise<DownloadLink> {
  const links = await readJson<DownloadLink[]>(LINKS_KEY, []);
  const link: DownloadLink = {
    token: genToken(),
    whitepaperId,
    buyerEmail,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  };
  // Prune expired
  const now = Date.now();
  const kept = links.filter((l) => new Date(l.expiresAt).getTime() > now);
  kept.push(link);
  await writeJson(LINKS_KEY, kept);
  return link;
}

export async function consumeDownloadLink(token: string): Promise<{ whitepaper: Whitepaper; buyerEmail: string } | null> {
  const links = await readJson<DownloadLink[]>(LINKS_KEY, []);
  const link = links.find((l) => l.token === token);
  if (!link) return null;
  if (new Date(link.expiresAt).getTime() < Date.now()) return null;
  const wp = await getWhitepaper(link.whitepaperId);
  if (!wp) return null;
  return { whitepaper: wp, buyerEmail: link.buyerEmail };
}
