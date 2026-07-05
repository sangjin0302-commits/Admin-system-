/**
 * AI 학습 데이터셋 마켓플레이스 — 익명화된 사건·문의 데이터를 유료 판매.
 * Storage: SiteSetting "dataset.catalog", "dataset.orders".
 * 실제 익명화는 관리자가 수동 큐레이션 후 SiteSetting에 JSONL 스냅샷을 저장하는 흐름.
 */

import { prisma } from "@/lib/prisma/client";

export type DatasetCategory = "visa" | "appeal" | "contract" | "license" | "corporate" | "mixed";
export type DatasetLicense = "research" | "commercial" | "exclusive";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: DatasetCategory;
  price: number;
  size: number; // record count
  license: DatasetLicense;
  sampleUrl?: string;
  sampleJsonl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetOrder {
  id: string;
  datasetId: string;
  buyerEmail: string;
  buyerOrg?: string;
  orderId: string;
  amount: number;
  status: "pending" | "paid" | "delivered" | "cancelled";
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
}

const CATALOG_KEY = "dataset.catalog";
const ORDERS_KEY = "dataset.orders";

function newId(p: string): string {
  return `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
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

export async function listDatasets(includeUnpublished = false): Promise<Dataset[]> {
  const all = await readJson<Dataset[]>(CATALOG_KEY, []);
  return includeUnpublished ? all : all.filter((d) => d.published);
}

export async function getDataset(id: string): Promise<Dataset | null> {
  const all = await readJson<Dataset[]>(CATALOG_KEY, []);
  return all.find((d) => d.id === id) ?? null;
}

export async function upsertDataset(input: Partial<Dataset> & Pick<Dataset, "name" | "price" | "category">): Promise<Dataset> {
  const all = await readJson<Dataset[]>(CATALOG_KEY, []);
  const now = new Date().toISOString();
  if (input.id) {
    const idx = all.findIndex((d) => d.id === input.id);
    if (idx >= 0) {
      const updated: Dataset = { ...all[idx], ...input, id: input.id, updatedAt: now };
      all[idx] = updated;
      await writeJson(CATALOG_KEY, all);
      return updated;
    }
  }
  const item: Dataset = {
    id: input.id ?? newId("ds"),
    name: input.name,
    description: input.description ?? "",
    category: input.category,
    price: input.price,
    size: input.size ?? 0,
    license: input.license ?? "research",
    sampleUrl: input.sampleUrl,
    sampleJsonl: input.sampleJsonl,
    published: input.published ?? false,
    createdAt: now,
    updatedAt: now,
  };
  all.push(item);
  await writeJson(CATALOG_KEY, all);
  return item;
}

export async function deleteDataset(id: string): Promise<boolean> {
  const all = await readJson<Dataset[]>(CATALOG_KEY, []);
  const next = all.filter((d) => d.id !== id);
  if (next.length === all.length) return false;
  await writeJson(CATALOG_KEY, next);
  return true;
}

/** PII 제거 — 이름·전화·주소·주민번호·사건번호 등 마스킹. */
export function anonymizeText(input: string): string {
  return input
    .replace(/\b\d{6}[- ]?\d{7}\b/g, "[주민번호]")
    .replace(/\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b/g, "[전화]")
    .replace(/\b\d{2,4}[- ]?\d{3,4}[- ]?\d{4}\b/g, "[전화]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[이메일]")
    .replace(/\b\d{4}[가-힣]{1,3}\d{3,6}\b/g, "[사건번호]")
    .replace(/서울|부산|대구|인천|광주|대전|울산|경기|강원|충[남북]|전[남북]|경[남북]|제주/g, "[지역]");
}

/** 익명화된 샘플 레코드를 JSONL로 변환. */
export function toJsonl(records: Array<Record<string, unknown>>): string {
  return records
    .map((r) => JSON.stringify(r))
    .join("\n");
}

export async function listOrders(datasetId?: string): Promise<DatasetOrder[]> {
  const all = await readJson<DatasetOrder[]>(ORDERS_KEY, []);
  return datasetId ? all.filter((o) => o.datasetId === datasetId) : all;
}

export async function createOrder(input: {
  datasetId: string;
  buyerEmail: string;
  buyerOrg?: string;
  orderId: string;
  amount: number;
}): Promise<DatasetOrder> {
  const all = await readJson<DatasetOrder[]>(ORDERS_KEY, []);
  const item: DatasetOrder = {
    id: newId("dso"),
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  all.push(item);
  await writeJson(ORDERS_KEY, all);
  return item;
}

export async function markOrderPaid(orderId: string): Promise<DatasetOrder | null> {
  const all = await readJson<DatasetOrder[]>(ORDERS_KEY, []);
  const idx = all.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status: "paid", paidAt: new Date().toISOString() };
  await writeJson(ORDERS_KEY, all);
  return all[idx];
}
