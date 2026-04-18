import { promises as fs } from "node:fs";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";

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

function getSafeTokenMinLength() {
  const raw = process.env.ADMIN_MARKETING_SYNC_TOKEN_MIN_LENGTH?.trim();
  if (!raw) return 24;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return 24;
  return Math.min(128, Math.max(12, parsed));
}

function safeEqualToken(input: string, expected: string) {
  const left = Buffer.from(input, "utf8");
  const right = Buffer.from(expected, "utf8");

  const length = Math.max(left.length, right.length);
  const paddedLeft = Buffer.alloc(length);
  const paddedRight = Buffer.alloc(length);
  left.copy(paddedLeft);
  right.copy(paddedRight);

  const matched = timingSafeEqual(paddedLeft, paddedRight);
  return matched && left.length === right.length;
}

async function ensureParentDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export function verifyMarketingSyncToken(token: string | null): boolean {
  const expected = process.env.ADMIN_MARKETING_SYNC_TOKEN?.trim() || "";
  const minTokenLength = getSafeTokenMinLength();

  if (expected.length > 0 && expected.length < minTokenLength) {
    return false;
  }

  if (!expected) {
    // Local/dev convenience: allow only outside production.
    return process.env.NODE_ENV !== "production";
  }
  return !!token && safeEqualToken(token.trim(), expected);
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
