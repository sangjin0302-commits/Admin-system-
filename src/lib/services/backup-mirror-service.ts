/**
 * Airtable / Google Sheets 실시간 미러 백업.
 *
 * SiteSetting keys:
 *   - "integration.backup_mirror.config" — { provider, airtable?, sheets?, enabled }
 *   - "integration.backup_mirror.history" — sync 로그 (최대 200건)
 *
 * env (fallback):
 *   AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME
 *   GOOGLE_SHEETS_ID (GOOGLE_SERVICE_ACCOUNT_JSON 재사용)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const CONFIG_KEY = "integration.backup_mirror.config";
const HISTORY_KEY = "integration.backup_mirror.history";
const MAX_HISTORY = 200;

export type BackupProvider = "airtable" | "sheets";

export type BackupMirrorConfig = {
  provider: BackupProvider;
  enabled: boolean;
  airtable: { apiKey: string; baseId: string; tableName: string };
  sheets: { spreadsheetId: string; sheetName: string };
};

export type BackupMirrorLogEntry = {
  ts: string;
  provider: BackupProvider;
  entity: string;
  action: "mirror" | "full_sync" | "test";
  count: number;
  ok: boolean;
  error?: string;
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch (err) {
    logger.warn(`[backup-mirror] siteSetting 파싱 실패 (${key})`, err);
    return fallback;
  }
}

async function writeJson(key: string, v: unknown): Promise<void> {
  const s = JSON.stringify(v);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: s },
    update: { value: s },
  });
}

export async function getBackupMirrorConfig(): Promise<BackupMirrorConfig> {
  const stored = await readJson<Partial<BackupMirrorConfig>>(CONFIG_KEY, {});
  return {
    provider: stored.provider ?? "airtable",
    enabled: stored.enabled ?? false,
    airtable: {
      apiKey: stored.airtable?.apiKey ?? process.env.AIRTABLE_API_KEY?.trim() ?? "",
      baseId: stored.airtable?.baseId ?? process.env.AIRTABLE_BASE_ID?.trim() ?? "",
      tableName: stored.airtable?.tableName ?? process.env.AIRTABLE_TABLE_NAME?.trim() ?? "Backup",
    },
    sheets: {
      spreadsheetId: stored.sheets?.spreadsheetId ?? process.env.GOOGLE_SHEETS_ID?.trim() ?? "",
      sheetName: stored.sheets?.sheetName ?? "Backup",
    },
  };
}

export async function saveBackupMirrorConfig(cfg: Partial<BackupMirrorConfig>): Promise<void> {
  const current = await readJson<Partial<BackupMirrorConfig>>(CONFIG_KEY, {});
  await writeJson(CONFIG_KEY, { ...current, ...cfg });
}

export async function getBackupMirrorHistory(): Promise<BackupMirrorLogEntry[]> {
  return readJson<BackupMirrorLogEntry[]>(HISTORY_KEY, []);
}

async function appendHistory(entry: BackupMirrorLogEntry): Promise<void> {
  const list = await getBackupMirrorHistory();
  list.unshift(entry);
  await writeJson(HISTORY_KEY, list.slice(0, MAX_HISTORY));
}

/** Airtable에 단일 record 추가. */
async function mirrorToAirtable(
  cfg: BackupMirrorConfig,
  entity: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  if (!cfg.airtable.apiKey || !cfg.airtable.baseId || !cfg.airtable.tableName) {
    return { ok: false, error: "미설정" };
  }
  try {
    const url = `https://api.airtable.com/v0/${cfg.airtable.baseId}/${encodeURIComponent(cfg.airtable.tableName)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.airtable.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Entity: entity,
              Data: JSON.stringify(data).slice(0, 90_000),
              MirroredAt: new Date().toISOString(),
            },
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    logger.warn("[backup-mirror] airtable 실패", err);
    return { ok: false, error: String(err) };
  }
}

// Google Sheets append via 서비스 계정 — JWT 서명은 calendar-sync-service와 동일 방식.
type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const obj = JSON.parse(decoded) as ServiceAccount;
    if (!obj.client_email || !obj.private_key) return null;
    return obj;
  } catch (err) {
    logger.warn("[backup-mirror] SA 파싱 실패", err);
    return null;
  }
}

function b64url(input: Buffer | string): string {
  const b = typeof input === "string" ? Buffer.from(input) : input;
  return b.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getSheetsToken(sa: ServiceAccount): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = b64url(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );
    const signingInput = `${header}.${payload}`;
    const { createSign } = await import("crypto");
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    const sig = b64url(signer.sign(sa.private_key));
    const jwt = `${signingInput}.${sig}`;

    const res = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    logger.warn("[backup-mirror] sheets token 실패", err);
    return null;
  }
}

async function mirrorToSheets(
  cfg: BackupMirrorConfig,
  entity: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const sa = readServiceAccount();
  if (!sa) return { ok: false, error: "service_account_missing" };
  if (!cfg.sheets.spreadsheetId) return { ok: false, error: "spreadsheetId 미설정" };
  const token = await getSheetsToken(sa);
  if (!token) return { ok: false, error: "token_failed" };
  const range = `${cfg.sheets.sheetName}!A:C`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    cfg.sheets.spreadsheetId
  )}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [[entity, JSON.stringify(data).slice(0, 40_000), new Date().toISOString()]],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    logger.warn("[backup-mirror] sheets append 실패", err);
    return { ok: false, error: String(err) };
  }
}

/** 단일 record 미러링 — inquiry/case/payment 등 임의 엔티티. */
export async function mirrorRecord(
  entity: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isFeatureEnabled("backup_mirror"))) return { ok: false, error: "flag_off" };
  const cfg = await getBackupMirrorConfig();
  if (!cfg.enabled) return { ok: false, error: "disabled" };
  const r = cfg.provider === "airtable" ? await mirrorToAirtable(cfg, entity, data) : await mirrorToSheets(cfg, entity, data);
  await appendHistory({
    ts: new Date().toISOString(),
    provider: cfg.provider,
    entity,
    action: "mirror",
    count: r.ok ? 1 : 0,
    ok: r.ok,
    error: r.error,
  });
  return r;
}

/** 전체 동기화 — 문의·사건을 순차적으로 스트림 미러. */
export async function runFullSync(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!(await isFeatureEnabled("backup_mirror"))) return { ok: false, count: 0, error: "flag_off" };
  const cfg = await getBackupMirrorConfig();
  if (!cfg.enabled) return { ok: false, count: 0, error: "disabled" };
  let count = 0;
  try {
    const inquiries = await prisma.inquiry.findMany({ take: 500, orderBy: { updatedAt: "desc" } });
    for (const i of inquiries) {
      const r = await mirrorRecord("inquiry", {
        id: i.id,
        status: i.status,
        title: i.title,
        email: i.email,
        createdAt: i.createdAt.toISOString(),
      });
      if (r.ok) count += 1;
    }
    const cases = await prisma.caseMatter.findMany({ take: 500, orderBy: { updatedAt: "desc" } });
    for (const c of cases) {
      const r = await mirrorRecord("case", {
        id: c.id,
        caseNo: c.caseNo,
        status: c.status,
        title: c.title,
        category: c.category,
        createdAt: c.createdAt.toISOString(),
      });
      if (r.ok) count += 1;
    }
    await appendHistory({
      ts: new Date().toISOString(),
      provider: cfg.provider,
      entity: "*",
      action: "full_sync",
      count,
      ok: true,
    });
    return { ok: true, count };
  } catch (err) {
    logger.warn("[backup-mirror] runFullSync 실패", err);
    await appendHistory({
      ts: new Date().toISOString(),
      provider: cfg.provider,
      entity: "*",
      action: "full_sync",
      count,
      ok: false,
      error: String(err),
    });
    return { ok: false, count, error: String(err) };
  }
}

/** best-effort background fire. */
export function fireAndForgetMirror(entity: string, data: Record<string, unknown>): void {
  mirrorRecord(entity, data).catch((err) => logger.warn("[backup-mirror] bg 실패", err));
}
