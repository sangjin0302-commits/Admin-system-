/**
 * API 마켓플레이스 — Lawbot·초안·인용검증 등을 외부 유료 API로 판매.
 * Storage: SiteSetting "api.keys" (Array<ApiKeyRecord>), "api.usage" (Array<UsageRecord>).
 * 실제 대용량 사용량 추적은 별도 저장소로 이관 예정.
 */

import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma/client";

export type ApiProductId = "lawbot-analyze" | "case-summary-ai" | "citation-verify" | "korean-legal-entity-extract";

export interface ApiProduct {
  id: ApiProductId;
  name: string;
  endpoint: string;
  description: string;
  pricing: { perCall: number; monthly: number };
  monthlyQuota: number;
}

export const API_PRODUCTS: ApiProduct[] = [
  {
    id: "lawbot-analyze",
    name: "Lawbot 사건 분석",
    endpoint: "/api/v1/lawbot/analyze",
    description: "사건 개요를 넣으면 관련 법령/판례·승소 가능성·리스크를 반환합니다.",
    pricing: { perCall: 500, monthly: 290_000 },
    monthlyQuota: 1000,
  },
  {
    id: "case-summary-ai",
    name: "AI 사건 요약",
    endpoint: "/api/v1/case-summary",
    description: "Claude Haiku 기반 사건 요약 (500토큰 이내).",
    pricing: { perCall: 100, monthly: 90_000 },
    monthlyQuota: 3000,
  },
  {
    id: "citation-verify",
    name: "판례·법령 인용 검증",
    endpoint: "/api/v1/citation-verify",
    description: "입력된 판례 번호·법령 조문의 실재 여부를 검증합니다.",
    pricing: { perCall: 200, monthly: 190_000 },
    monthlyQuota: 2000,
  },
  {
    id: "korean-legal-entity-extract",
    name: "한국 법률 엔티티 추출",
    endpoint: "/api/v1/legal-entity-extract",
    description: "한글 계약서·판결문에서 당사자·기일·금액·조항을 구조화 추출.",
    pricing: { perCall: 300, monthly: 190_000 },
    monthlyQuota: 2500,
  },
];

export interface ApiKeyRecord {
  id: string;
  userId: string;
  userEmail: string;
  productId: ApiProductId;
  prefix: string; // "ek_live_xxxx"
  hash: string; // sha256 of full key
  createdAt: string;
  revokedAt?: string;
  monthlyCallCount: number;
  totalCallCount: number;
  lastUsedAt?: string;
}

export interface UsageRecord {
  id: string;
  keyId: string;
  productId: ApiProductId;
  at: string;
  ok: boolean;
  latencyMs?: number;
}

const KEYS_KEY = "api.keys";
const USAGE_KEY = "api.usage";
const MAX_USAGE_ROWS = 1000;

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: v },
    update: { value: v },
  });
}

export function getApiProduct(id: string): ApiProduct | null {
  return API_PRODUCTS.find((p) => p.id === id) ?? null;
}

export async function listApiKeys(userId?: string): Promise<ApiKeyRecord[]> {
  const all = await readJson<ApiKeyRecord[]>(KEYS_KEY, []);
  return userId ? all.filter((k) => k.userId === userId) : all;
}

/**
 * API 키 발급 — 전체 시크릿은 이 함수 리턴값에만 존재. DB엔 sha256 해시만 저장.
 */
export async function provisionApiKey(
  userId: string,
  userEmail: string,
  productId: ApiProductId
): Promise<{ record: ApiKeyRecord; secret: string }> {
  if (!getApiProduct(productId)) throw new Error(`UNKNOWN_PRODUCT: ${productId}`);
  const raw = `ek_live_${randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 14);
  const record: ApiKeyRecord = {
    id: newId("apk"),
    userId,
    userEmail,
    productId,
    prefix,
    hash: sha256(raw),
    createdAt: new Date().toISOString(),
    monthlyCallCount: 0,
    totalCallCount: 0,
  };
  const all = await readJson<ApiKeyRecord[]>(KEYS_KEY, []);
  all.push(record);
  await writeJson(KEYS_KEY, all);
  return { record, secret: raw };
}

export async function revokeApiKey(id: string): Promise<boolean> {
  const all = await readJson<ApiKeyRecord[]>(KEYS_KEY, []);
  const idx = all.findIndex((k) => k.id === id);
  if (idx < 0) return false;
  all[idx] = { ...all[idx], revokedAt: new Date().toISOString() };
  await writeJson(KEYS_KEY, all);
  return true;
}

export interface ValidationResult {
  ok: boolean;
  reason?: "MISSING" | "INVALID" | "REVOKED" | "QUOTA_EXCEEDED";
  key?: ApiKeyRecord;
  product?: ApiProduct;
  remainingQuota?: number;
}

export async function validateApiKey(rawKey: string | null | undefined): Promise<ValidationResult> {
  if (!rawKey) return { ok: false, reason: "MISSING" };
  const hash = sha256(rawKey);
  const all = await readJson<ApiKeyRecord[]>(KEYS_KEY, []);
  const key = all.find((k) => k.hash === hash);
  if (!key) return { ok: false, reason: "INVALID" };
  if (key.revokedAt) return { ok: false, reason: "REVOKED", key };
  const product = getApiProduct(key.productId);
  if (!product) return { ok: false, reason: "INVALID", key };
  const remaining = Math.max(0, product.monthlyQuota - key.monthlyCallCount);
  if (remaining <= 0) return { ok: false, reason: "QUOTA_EXCEEDED", key, product, remainingQuota: 0 };
  return { ok: true, key, product, remainingQuota: remaining };
}

export async function recordUsage(keyId: string, productId: ApiProductId, ok: boolean, latencyMs?: number): Promise<void> {
  const keys = await readJson<ApiKeyRecord[]>(KEYS_KEY, []);
  const idx = keys.findIndex((k) => k.id === keyId);
  if (idx >= 0) {
    keys[idx] = {
      ...keys[idx],
      monthlyCallCount: keys[idx].monthlyCallCount + 1,
      totalCallCount: keys[idx].totalCallCount + 1,
      lastUsedAt: new Date().toISOString(),
    };
    await writeJson(KEYS_KEY, keys);
  }
  const usage = await readJson<UsageRecord[]>(USAGE_KEY, []);
  usage.push({ id: newId("use"), keyId, productId, at: new Date().toISOString(), ok, latencyMs });
  if (usage.length > MAX_USAGE_ROWS) usage.splice(0, usage.length - MAX_USAGE_ROWS);
  await writeJson(USAGE_KEY, usage);
}

export async function listUsage(limit = 100): Promise<UsageRecord[]> {
  const all = await readJson<UsageRecord[]>(USAGE_KEY, []);
  return all.slice(-limit).reverse();
}

export async function revenueSummary(): Promise<{ totalCalls: number; estimatedRevenue: number; byProduct: Record<string, { calls: number; revenue: number }> }> {
  const keys = await readJson<ApiKeyRecord[]>(KEYS_KEY, []);
  const byProduct: Record<string, { calls: number; revenue: number }> = {};
  let totalCalls = 0;
  let estimatedRevenue = 0;
  for (const k of keys) {
    const p = getApiProduct(k.productId);
    if (!p) continue;
    const rev = k.totalCallCount * p.pricing.perCall;
    totalCalls += k.totalCallCount;
    estimatedRevenue += rev;
    if (!byProduct[k.productId]) byProduct[k.productId] = { calls: 0, revenue: 0 };
    byProduct[k.productId].calls += k.totalCallCount;
    byProduct[k.productId].revenue += rev;
  }
  return { totalCalls, estimatedRevenue, byProduct };
}
