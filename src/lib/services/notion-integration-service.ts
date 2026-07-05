/**
 * Notion 통합 서비스 — 사건/문의를 Notion 데이터베이스에 페이지로 자동 생성·동기화.
 *
 * 저장(구독/상태): SiteSetting keys
 *   - "integration.notion.config" — { apiToken?, databaseId?, enabled }  (관리자가 설정 UI에서 저장)
 *   - "integration.notion.history" — 최근 sync 로그 (최대 200건)
 *   - "integration.notion.map"     — { [`inquiry:<id>`|`case:<id>`]: notionPageId }
 *
 * 환경 변수(대체 경로): NOTION_API_TOKEN, NOTION_DB_ID (SiteSetting이 없으면 이 값을 사용)
 *
 * 외부 API 호출 실패는 항상 warn 로그 남기고 조용히 실패 — 기능 플래그가 꺼져 있으면 아무것도 하지 않음.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const CONFIG_KEY = "integration.notion.config";
const HISTORY_KEY = "integration.notion.history";
const MAP_KEY = "integration.notion.map";
const NOTION_VERSION = "2022-06-28";
const API_BASE = "https://api.notion.com/v1";
const MAX_HISTORY = 200;

export type NotionConfig = {
  apiToken: string;
  databaseId: string;
  enabled: boolean;
};

export type NotionSyncLogEntry = {
  ts: string;
  entity: "inquiry" | "case";
  entityId: string;
  action: "create" | "update" | "poll" | "test";
  ok: boolean;
  pageId?: string;
  error?: string;
};

async function readSiteSettingJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch (err) {
    logger.warn(`[notion] siteSetting 파싱 실패 (${key})`, err);
    return fallback;
  }
}

async function writeSiteSettingJson(key: string, value: unknown): Promise<void> {
  const s = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: s },
    update: { value: s },
  });
}

export async function getNotionConfig(): Promise<NotionConfig> {
  const stored = await readSiteSettingJson<Partial<NotionConfig>>(CONFIG_KEY, {});
  return {
    apiToken: stored.apiToken ?? process.env.NOTION_API_TOKEN?.trim() ?? "",
    databaseId: stored.databaseId ?? process.env.NOTION_DB_ID?.trim() ?? "",
    enabled: stored.enabled ?? true,
  };
}

export async function saveNotionConfig(cfg: Partial<NotionConfig>): Promise<void> {
  const current = await readSiteSettingJson<Partial<NotionConfig>>(CONFIG_KEY, {});
  await writeSiteSettingJson(CONFIG_KEY, { ...current, ...cfg });
}

export async function getNotionHistory(): Promise<NotionSyncLogEntry[]> {
  return readSiteSettingJson<NotionSyncLogEntry[]>(HISTORY_KEY, []);
}

async function appendHistory(entry: NotionSyncLogEntry): Promise<void> {
  const list = await getNotionHistory();
  list.unshift(entry);
  await writeSiteSettingJson(HISTORY_KEY, list.slice(0, MAX_HISTORY));
}

async function getPageMap(): Promise<Record<string, string>> {
  return readSiteSettingJson<Record<string, string>>(MAP_KEY, {});
}

async function setPageMap(key: string, pageId: string): Promise<void> {
  const map = await getPageMap();
  map[key] = pageId;
  await writeSiteSettingJson(MAP_KEY, map);
}

async function notionFetch(
  cfg: NotionConfig,
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    logger.warn("[notion] fetch 실패", err);
    return { ok: false, status: 0, data: { error: String(err) } };
  }
}

/** 연결 테스트 — 데이터베이스 메타를 GET. */
export async function testNotionConnection(): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getNotionConfig();
  if (!cfg.apiToken || !cfg.databaseId) {
    return { ok: false, error: "API 토큰 또는 DB ID가 설정되지 않았습니다." };
  }
  const r = await notionFetch(cfg, `/databases/${encodeURIComponent(cfg.databaseId)}`);
  if (!r.ok) {
    const err = (r.data as { message?: string })?.message ?? `HTTP ${r.status}`;
    return { ok: false, error: err };
  }
  return { ok: true };
}

function truncateRichText(text: string, max = 1900): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function upsertPage(
  entity: "inquiry" | "case",
  entityId: string,
  properties: Record<string, unknown>
): Promise<{ ok: boolean; pageId?: string; error?: string }> {
  const cfg = await getNotionConfig();
  if (!cfg.apiToken || !cfg.databaseId) {
    return { ok: false, error: "미설정" };
  }
  const map = await getPageMap();
  const mapKey = `${entity}:${entityId}`;
  const existingPageId = map[mapKey];

  if (existingPageId) {
    const r = await notionFetch(cfg, `/pages/${existingPageId}`, {
      method: "PATCH",
      body: { properties },
    });
    if (!r.ok) {
      const msg = (r.data as { message?: string })?.message ?? `HTTP ${r.status}`;
      return { ok: false, error: msg };
    }
    return { ok: true, pageId: existingPageId };
  }

  const r = await notionFetch(cfg, `/pages`, {
    method: "POST",
    body: { parent: { database_id: cfg.databaseId }, properties },
  });
  if (!r.ok) {
    const msg = (r.data as { message?: string })?.message ?? `HTTP ${r.status}`;
    return { ok: false, error: msg };
  }
  const pageId = (r.data as { id?: string }).id ?? "";
  if (pageId) await setPageMap(mapKey, pageId);
  return { ok: true, pageId };
}

/** 사건을 Notion 페이지로 동기화 (없으면 생성, 있으면 업데이트). */
export async function syncCaseToNotion(caseId: string): Promise<{ ok: boolean; pageId?: string; error?: string }> {
  if (!(await isFeatureEnabled("notion_sync"))) return { ok: false, error: "flag_off" };
  try {
    const c = await prisma.caseMatter.findUnique({ where: { id: caseId } });
    if (!c) return { ok: false, error: "case_not_found" };
    // Notion database 속성은 사용자 스키마에 따라 다르므로 안전한 기본 속성만 사용:
    //   Name (title), Status (rich_text), Category (rich_text), CaseNo (rich_text)
    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: truncateRichText(c.title ?? c.id, 200) } }] },
      Status: { rich_text: [{ text: { content: c.status } }] },
      Category: { rich_text: [{ text: { content: c.category } }] },
      CaseNo: { rich_text: [{ text: { content: c.caseNo ?? "" } }] },
    };
    const r = await upsertPage("case", c.id, properties);
    await appendHistory({
      ts: new Date().toISOString(),
      entity: "case",
      entityId: c.id,
      action: r.pageId ? "update" : "create",
      ok: r.ok,
      pageId: r.pageId,
      error: r.error,
    });
    return r;
  } catch (err) {
    logger.warn("[notion] syncCaseToNotion 실패", err);
    return { ok: false, error: String(err) };
  }
}

/** 문의를 Notion 페이지로 동기화. */
export async function syncInquiryToNotion(inquiryId: string): Promise<{ ok: boolean; pageId?: string; error?: string }> {
  if (!(await isFeatureEnabled("notion_sync"))) return { ok: false, error: "flag_off" };
  try {
    const i = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!i) return { ok: false, error: "inquiry_not_found" };
    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: truncateRichText(i.title ?? i.id, 200) } }] },
      Status: { rich_text: [{ text: { content: i.status } }] },
      Category: { rich_text: [{ text: { content: i.inquiryType } }] },
      CaseNo: { rich_text: [{ text: { content: i.email ?? "" } }] },
    };
    const r = await upsertPage("inquiry", i.id, properties);
    await appendHistory({
      ts: new Date().toISOString(),
      entity: "inquiry",
      entityId: i.id,
      action: r.pageId ? "update" : "create",
      ok: r.ok,
      pageId: r.pageId,
      error: r.error,
    });
    return r;
  } catch (err) {
    logger.warn("[notion] syncInquiryToNotion 실패", err);
    return { ok: false, error: String(err) };
  }
}

/** Notion에서 관리자가 편집한 페이지의 Status를 로컬 사건/문의로 되돌립니다.
 *  최근 편집된 페이지를 쿼리해서 map에 있는 항목만 대상으로 동기화합니다.
 */
export async function pollNotionUpdates(): Promise<{ ok: boolean; changed: number; error?: string }> {
  if (!(await isFeatureEnabled("notion_sync"))) return { ok: false, changed: 0, error: "flag_off" };
  const cfg = await getNotionConfig();
  if (!cfg.apiToken || !cfg.databaseId) return { ok: false, changed: 0, error: "미설정" };
  const map = await getPageMap();
  const reverseMap: Record<string, { entity: "inquiry" | "case"; id: string }> = {};
  for (const [k, pageId] of Object.entries(map)) {
    const [entity, id] = k.split(":");
    if (entity === "inquiry" || entity === "case") reverseMap[pageId] = { entity, id };
  }

  const r = await notionFetch(cfg, `/databases/${encodeURIComponent(cfg.databaseId)}/query`, {
    method: "POST",
    body: { page_size: 50, sorts: [{ timestamp: "last_edited_time", direction: "descending" }] },
  });
  if (!r.ok) {
    const err = (r.data as { message?: string })?.message ?? `HTTP ${r.status}`;
    return { ok: false, changed: 0, error: err };
  }

  const results = (r.data as { results?: Array<{ id: string; properties?: Record<string, unknown> }> }).results ?? [];
  let changed = 0;
  for (const page of results) {
    const match = reverseMap[page.id];
    if (!match) continue;
    const statusProp = page.properties?.Status as { rich_text?: Array<{ plain_text?: string }> } | undefined;
    const newStatusText = statusProp?.rich_text?.[0]?.plain_text ?? "";
    if (!newStatusText) continue;
    // 실제 상태 전이는 서비스 계층 검증을 통과해야 하므로 여기서는 이력만 기록.
    await appendHistory({
      ts: new Date().toISOString(),
      entity: match.entity,
      entityId: match.id,
      action: "poll",
      ok: true,
      pageId: page.id,
      error: `pending_status=${newStatusText}`,
    });
    changed += 1;
  }
  return { ok: true, changed };
}

/** best-effort 백그라운드 훅 — 사건·문의 상태 업데이트 후 호출. 실패해도 무시. */
export function fireAndForgetSyncCase(caseId: string): void {
  syncCaseToNotion(caseId).catch((err) => logger.warn("[notion] bg case sync 실패", err));
}
export function fireAndForgetSyncInquiry(inquiryId: string): void {
  syncInquiryToNotion(inquiryId).catch((err) => logger.warn("[notion] bg inquiry sync 실패", err));
}
