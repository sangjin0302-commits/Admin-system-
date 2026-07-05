/**
 * Google Workspace 계정 관리 (Admin SDK Directory API).
 *
 * TODO: 실사용 시 서비스 계정에 도메인 전체 위임(domain-wide delegation)이 설정되어야 하며,
 *       GOOGLE_WORKSPACE_ADMIN_EMAIL 로 지정된 관리자를 대행(impersonate)합니다.
 *
 * env:
 *   GOOGLE_WORKSPACE_ADMIN_EMAIL — impersonate 대상 (예: admin@example.com)
 *   GOOGLE_SERVICE_ACCOUNT_JSON — 재사용 (calendar-sync와 동일)
 *
 * SiteSetting keys:
 *   - "integration.google_workspace.config" — { adminEmail, defaultDomain, enabled }
 *   - "integration.google_workspace.history" — 액션 로그
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const CONFIG_KEY = "integration.google_workspace.config";
const HISTORY_KEY = "integration.google_workspace.history";
const MAX_HISTORY = 100;

const SCOPE = "https://www.googleapis.com/auth/admin.directory.user";

export type WorkspaceUser = {
  primaryEmail: string;
  name: { givenName: string; familyName: string };
  suspended?: boolean;
  id?: string;
};

export type WorkspaceConfig = {
  adminEmail: string;
  defaultDomain: string;
  enabled: boolean;
};

export type WorkspaceLogEntry = {
  ts: string;
  action: "create" | "suspend" | "reactivate" | "list" | "test";
  target?: string;
  ok: boolean;
  error?: string;
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch (err) {
    logger.warn(`[gws] siteSetting 파싱 실패 (${key})`, err);
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

export async function getWorkspaceConfig(): Promise<WorkspaceConfig> {
  const stored = await readJson<Partial<WorkspaceConfig>>(CONFIG_KEY, {});
  const adminEmail = stored.adminEmail ?? process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL?.trim() ?? "";
  const defaultDomain = stored.defaultDomain ?? adminEmail.split("@")[1] ?? "";
  return {
    adminEmail,
    defaultDomain,
    enabled: stored.enabled ?? false,
  };
}

export async function saveWorkspaceConfig(cfg: Partial<WorkspaceConfig>): Promise<void> {
  const current = await readJson<Partial<WorkspaceConfig>>(CONFIG_KEY, {});
  await writeJson(CONFIG_KEY, { ...current, ...cfg });
}

export async function getWorkspaceHistory(): Promise<WorkspaceLogEntry[]> {
  return readJson<WorkspaceLogEntry[]>(HISTORY_KEY, []);
}

async function appendHistory(entry: WorkspaceLogEntry): Promise<void> {
  const list = await getWorkspaceHistory();
  list.unshift(entry);
  await writeJson(HISTORY_KEY, list.slice(0, MAX_HISTORY));
}

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
    logger.warn("[gws] SA 파싱 실패", err);
    return null;
  }
}

function b64url(input: Buffer | string): string {
  const b = typeof input === "string" ? Buffer.from(input) : input;
  return b.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(sa: ServiceAccount, subject: string): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = b64url(
      JSON.stringify({
        iss: sa.client_email,
        scope: SCOPE,
        aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        sub: subject, // domain-wide delegation impersonation
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
    if (!res.ok) {
      logger.warn("[gws] token 요청 실패", res.status);
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    logger.warn("[gws] token 예외", err);
    return null;
  }
}

async function apiFetch(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
  if (!(await isFeatureEnabled("google_workspace_admin"))) return { ok: false, status: 0, data: null, error: "flag_off" };
  const sa = readServiceAccount();
  if (!sa) return { ok: false, status: 0, data: null, error: "service_account_missing" };
  const cfg = await getWorkspaceConfig();
  if (!cfg.adminEmail) return { ok: false, status: 0, data: null, error: "admin_email_missing" };
  const token = await getAccessToken(sa, cfg.adminEmail);
  if (!token) return { ok: false, status: 0, data: null, error: "token_failed" };
  try {
    const res = await fetch(`https://admin.googleapis.com/admin/directory/v1${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, data, error: (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: String(err) };
  }
}

function randomPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
  let out = "";
  for (let i = 0; i < 16; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createUser(params: {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  password?: string;
}): Promise<{ ok: boolean; user?: WorkspaceUser; error?: string; tempPassword?: string }> {
  const tempPassword = params.password ?? randomPassword();
  const body = {
    primaryEmail: params.primaryEmail,
    name: { givenName: params.firstName, familyName: params.lastName },
    password: tempPassword,
    changePasswordAtNextLogin: true,
  };
  const r = await apiFetch(`/users`, { method: "POST", body });
  await appendHistory({
    ts: new Date().toISOString(),
    action: "create",
    target: params.primaryEmail,
    ok: r.ok,
    error: r.error,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, user: r.data as WorkspaceUser, tempPassword };
}

export async function suspendUser(email: string): Promise<{ ok: boolean; error?: string }> {
  const r = await apiFetch(`/users/${encodeURIComponent(email)}`, {
    method: "PUT",
    body: { suspended: true },
  });
  await appendHistory({
    ts: new Date().toISOString(),
    action: "suspend",
    target: email,
    ok: r.ok,
    error: r.error,
  });
  return { ok: r.ok, error: r.error };
}

export async function reactivateUser(email: string): Promise<{ ok: boolean; error?: string }> {
  const r = await apiFetch(`/users/${encodeURIComponent(email)}`, {
    method: "PUT",
    body: { suspended: false },
  });
  await appendHistory({
    ts: new Date().toISOString(),
    action: "reactivate",
    target: email,
    ok: r.ok,
    error: r.error,
  });
  return { ok: r.ok, error: r.error };
}

export async function listUsers(): Promise<{ ok: boolean; users: WorkspaceUser[]; error?: string }> {
  const cfg = await getWorkspaceConfig();
  const domain = cfg.defaultDomain;
  const query = domain ? `?domain=${encodeURIComponent(domain)}&maxResults=100` : `?customer=my_customer&maxResults=100`;
  const r = await apiFetch(`/users${query}`);
  await appendHistory({
    ts: new Date().toISOString(),
    action: "list",
    ok: r.ok,
    error: r.error,
  });
  if (!r.ok) return { ok: false, users: [], error: r.error };
  const users = ((r.data as { users?: WorkspaceUser[] }).users ?? []) as WorkspaceUser[];
  return { ok: true, users };
}

export async function testWorkspaceConnection(): Promise<{ ok: boolean; error?: string }> {
  const r = await listUsers();
  return { ok: r.ok, error: r.error };
}
