import { promises as fs } from "node:fs";
import path from "node:path";

export type MarketingSnapshot = {
  generated_at?: string;
  source?: string;
  window_days?: number;
  summary?: Record<string, unknown>;
  top_naver_keywords?: unknown[];
  next_actions?: string[];
  ab_policy?: Record<string, unknown>;
  posting_time_policy?: Record<string, unknown>;
  recycle_queue?: Record<string, unknown>;
  received_at?: string;
};

function resolveSnapshotPath() {
  const fromEnv = process.env.AUTOPOST_MARKETING_PAYLOAD_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data", "marketing-sync-latest.json");
}

async function ensureParentDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export function verifyMarketingSyncToken(token: string | null): boolean {
  const expected = process.env.ADMIN_MARKETING_SYNC_TOKEN?.trim() || "";
  if (!expected) {
    // Local/dev convenience: allow only outside production.
    return process.env.NODE_ENV !== "production";
  }
  return !!token && token === expected;
}

export async function saveMarketingSnapshot(payload: MarketingSnapshot) {
  const filePath = resolveSnapshotPath();
  await ensureParentDir(filePath);

  const normalized: MarketingSnapshot = {
    ...payload,
    received_at: new Date().toISOString(),
  };

  await fs.writeFile(filePath, JSON.stringify(normalized, null, 2), "utf-8");
  return { filePath };
}

export async function readMarketingSnapshot(): Promise<MarketingSnapshot | null> {
  const filePath = resolveSnapshotPath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as MarketingSnapshot;
    return parsed;
  } catch {
    return null;
  }
}
