/**
 * HubSpot / Salesforce CRM 통합 (adapter pattern).
 *
 * env:
 *   CRM_PROVIDER = "hubspot" | "salesforce"
 *   HUBSPOT_API_KEY
 *   SALESFORCE_INSTANCE_URL, SALESFORCE_TOKEN
 *
 * SiteSetting keys:
 *   - "integration.crm.config"  — { provider, hubspot?, salesforce?, enabled }
 *   - "integration.crm.history" — 동기화 로그 (최대 200건)
 *   - "integration.crm.map"     — { [`inquiry:<id>`|`case:<id>`]: externalId }
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const CONFIG_KEY = "integration.crm.config";
const HISTORY_KEY = "integration.crm.history";
const MAP_KEY = "integration.crm.map";
const MAX_HISTORY = 200;

export type CrmProvider = "hubspot" | "salesforce";

export type CrmConfig = {
  provider: CrmProvider;
  enabled: boolean;
  hubspot: { apiKey: string };
  salesforce: { instanceUrl: string; token: string };
};

export type CrmLogEntry = {
  ts: string;
  provider: CrmProvider;
  entity: "inquiry" | "case" | "pull";
  entityId?: string;
  action: "contact" | "deal" | "pull" | "test";
  ok: boolean;
  externalId?: string;
  error?: string;
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch (err) {
    logger.warn(`[crm] siteSetting 파싱 실패 (${key})`, err);
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

export async function getCrmConfig(): Promise<CrmConfig> {
  const stored = await readJson<Partial<CrmConfig>>(CONFIG_KEY, {});
  const envProvider = (process.env.CRM_PROVIDER?.trim() as CrmProvider | undefined) ?? undefined;
  return {
    provider: stored.provider ?? envProvider ?? "hubspot",
    enabled: stored.enabled ?? false,
    hubspot: { apiKey: stored.hubspot?.apiKey ?? process.env.HUBSPOT_API_KEY?.trim() ?? "" },
    salesforce: {
      instanceUrl: stored.salesforce?.instanceUrl ?? process.env.SALESFORCE_INSTANCE_URL?.trim() ?? "",
      token: stored.salesforce?.token ?? process.env.SALESFORCE_TOKEN?.trim() ?? "",
    },
  };
}

export async function saveCrmConfig(cfg: Partial<CrmConfig>): Promise<void> {
  const current = await readJson<Partial<CrmConfig>>(CONFIG_KEY, {});
  await writeJson(CONFIG_KEY, { ...current, ...cfg });
}

export async function getCrmHistory(): Promise<CrmLogEntry[]> {
  return readJson<CrmLogEntry[]>(HISTORY_KEY, []);
}

async function appendHistory(entry: CrmLogEntry): Promise<void> {
  const list = await getCrmHistory();
  list.unshift(entry);
  await writeJson(HISTORY_KEY, list.slice(0, MAX_HISTORY));
}

async function getMap(): Promise<Record<string, string>> {
  return readJson<Record<string, string>>(MAP_KEY, {});
}
async function setMap(key: string, externalId: string): Promise<void> {
  const map = await getMap();
  map[key] = externalId;
  await writeJson(MAP_KEY, map);
}

/* ------------ Adapters ------------ */

async function hubspotContact(cfg: CrmConfig, email: string, props: Record<string, string>): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!cfg.hubspot.apiKey) return { ok: false, error: "hubspot_api_key_missing" };
  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.hubspot.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { email, ...props } }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function hubspotDeal(cfg: CrmConfig, name: string, props: Record<string, string>): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!cfg.hubspot.apiKey) return { ok: false, error: "hubspot_api_key_missing" };
  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.hubspot.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { dealname: name, ...props } }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function salesforceRecord(
  cfg: CrmConfig,
  sobject: "Contact" | "Opportunity",
  fields: Record<string, string>
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!cfg.salesforce.instanceUrl || !cfg.salesforce.token) {
    return { ok: false, error: "salesforce_missing" };
  }
  try {
    const url = `${cfg.salesforce.instanceUrl.replace(/\/$/, "")}/services/data/v58.0/sobjects/${sobject}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.salesforce.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/* ------------ Public ------------ */

export async function syncClientToCrm(inquiryId: string): Promise<{ ok: boolean; externalId?: string; error?: string }> {
  if (!(await isFeatureEnabled("crm_integration"))) return { ok: false, error: "flag_off" };
  const cfg = await getCrmConfig();
  if (!cfg.enabled) return { ok: false, error: "disabled" };
  const i = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
  if (!i) return { ok: false, error: "inquiry_not_found" };

  let result: { ok: boolean; id?: string; error?: string };
  if (cfg.provider === "hubspot") {
    result = await hubspotContact(cfg, i.email, {
      firstname: i.contactName ?? "",
      phone: i.phone ?? "",
      hs_lead_status: i.status,
    });
  } else {
    result = await salesforceRecord(cfg, "Contact", {
      Email: i.email,
      LastName: i.contactName ?? "Unknown",
      Phone: i.phone ?? "",
      Description: (i.description ?? "").slice(0, 32000),
    });
  }

  if (result.ok && result.id) await setMap(`inquiry:${i.id}`, result.id);
  await appendHistory({
    ts: new Date().toISOString(),
    provider: cfg.provider,
    entity: "inquiry",
    entityId: i.id,
    action: "contact",
    ok: result.ok,
    externalId: result.id,
    error: result.error,
  });
  return { ok: result.ok, externalId: result.id, error: result.error };
}

export async function syncCaseToCrm(caseId: string): Promise<{ ok: boolean; externalId?: string; error?: string }> {
  if (!(await isFeatureEnabled("crm_integration"))) return { ok: false, error: "flag_off" };
  const cfg = await getCrmConfig();
  if (!cfg.enabled) return { ok: false, error: "disabled" };
  const c = await prisma.caseMatter.findUnique({ where: { id: caseId } });
  if (!c) return { ok: false, error: "case_not_found" };

  let result: { ok: boolean; id?: string; error?: string };
  if (cfg.provider === "hubspot") {
    result = await hubspotDeal(cfg, c.title ?? c.id, {
      dealstage: c.status,
      pipeline: "default",
    });
  } else {
    result = await salesforceRecord(cfg, "Opportunity", {
      Name: c.title ?? c.id,
      StageName: c.status,
      CloseDate: (c.dueDate ?? new Date(Date.now() + 30 * 86400_000)).toISOString().slice(0, 10),
    });
  }

  if (result.ok && result.id) await setMap(`case:${c.id}`, result.id);
  await appendHistory({
    ts: new Date().toISOString(),
    provider: cfg.provider,
    entity: "case",
    entityId: c.id,
    action: "deal",
    ok: result.ok,
    externalId: result.id,
    error: result.error,
  });
  return { ok: result.ok, externalId: result.id, error: result.error };
}

/** CRM에서 최근 업데이트를 조회 — 현재는 히스토리에 기록만. */
export async function pullCrmUpdates(): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!(await isFeatureEnabled("crm_integration"))) return { ok: false, count: 0, error: "flag_off" };
  const cfg = await getCrmConfig();
  if (!cfg.enabled) return { ok: false, count: 0, error: "disabled" };
  const map = await getMap();
  const count = Object.keys(map).length;
  await appendHistory({
    ts: new Date().toISOString(),
    provider: cfg.provider,
    entity: "pull",
    action: "pull",
    ok: true,
  });
  return { ok: true, count };
}

export async function testCrmConnection(): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getCrmConfig();
  if (cfg.provider === "hubspot") {
    if (!cfg.hubspot.apiKey) return { ok: false, error: "hubspot_api_key_missing" };
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${cfg.hubspot.apiKey}` },
      });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }
  if (!cfg.salesforce.instanceUrl || !cfg.salesforce.token) return { ok: false, error: "salesforce_missing" };
  try {
    const res = await fetch(`${cfg.salesforce.instanceUrl.replace(/\/$/, "")}/services/data/`, {
      headers: { Authorization: `Bearer ${cfg.salesforce.token}` },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export function fireAndForgetInquiryToCrm(inquiryId: string): void {
  syncClientToCrm(inquiryId).catch((err) => logger.warn("[crm] bg 실패", err));
}
export function fireAndForgetCaseToCrm(caseId: string): void {
  syncCaseToCrm(caseId).catch((err) => logger.warn("[crm] bg 실패", err));
}
