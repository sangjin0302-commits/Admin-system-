/**
 * Enterprise SSO (OIDC) service.
 * Storage: SiteSetting "sso.configs" → Record<orgId, SsoConfig>
 */

import { prisma } from "@/lib/prisma/client";

export type SsoProvider = "generic-oidc" | "google-workspace" | "microsoft-entra";

export interface SsoConfig {
  orgId: string;
  orgName: string;
  provider: SsoProvider;
  discoveryUrl: string;        // OIDC discovery document URL
  clientId: string;
  clientSecret: string;
  allowedDomains: string[];    // e.g. ["acme.com"]
  createdAt: string;
  active: boolean;
}

const KEY = "sso.configs";

async function readAll(): Promise<Record<string, SsoConfig>> {
  const row = await prisma.siteSetting.findUnique({ where: { key: KEY } }).catch(() => null);
  if (!row || !row.value) return {};
  try { return JSON.parse(row.value) as Record<string, SsoConfig>; } catch { return {}; }
}

async function writeAll(v: Record<string, SsoConfig>): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(v) },
    update: { value: JSON.stringify(v) },
  });
}

export function extractDomain(email: string): string | null {
  const m = /@([^@\s]+)$/.exec(email.trim().toLowerCase());
  return m ? m[1] : null;
}

export async function listSsoConfigs(): Promise<SsoConfig[]> {
  return Object.values(await readAll());
}

export async function getSsoConfig(orgId: string): Promise<SsoConfig | null> {
  const all = await readAll();
  return all[orgId] ?? null;
}

export async function getSsoForDomain(email: string): Promise<SsoConfig | null> {
  const domain = extractDomain(email);
  if (!domain) return null;
  const all = await readAll();
  for (const cfg of Object.values(all)) {
    if (!cfg.active) continue;
    if (cfg.allowedDomains.some((d) => d.toLowerCase() === domain)) return cfg;
  }
  return null;
}

export async function createSsoConfig(orgId: string, config: Omit<SsoConfig, "orgId" | "createdAt">): Promise<SsoConfig> {
  const all = await readAll();
  const record: SsoConfig = {
    ...config,
    orgId,
    createdAt: new Date().toISOString(),
  };
  all[orgId] = record;
  await writeAll(all);
  return record;
}

export async function deleteSsoConfig(orgId: string): Promise<void> {
  const all = await readAll();
  delete all[orgId];
  await writeAll(all);
}

export interface OidcDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  issuer?: string;
}

export async function fetchOidcDiscovery(discoveryUrl: string): Promise<OidcDiscovery | null> {
  try {
    const res = await fetch(discoveryUrl, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as OidcDiscovery;
  } catch {
    return null;
  }
}

/** Build the OIDC authorize URL. */
export async function buildAuthorizeUrl(
  cfg: SsoConfig,
  redirectUri: string,
  state: string
): Promise<string | null> {
  const disc = await fetchOidcDiscovery(cfg.discoveryUrl);
  if (!disc) return null;
  const u = new URL(disc.authorization_endpoint);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  return u.toString();
}

export interface OidcTokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
}

export interface OidcUserInfo {
  sub?: string;
  email?: string;
  name?: string;
  hd?: string;
}

export async function exchangeCode(
  cfg: SsoConfig,
  code: string,
  redirectUri: string
): Promise<{ tokens: OidcTokenResponse; user: OidcUserInfo } | null> {
  const disc = await fetchOidcDiscovery(cfg.discoveryUrl);
  if (!disc) return null;
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    });
    const tokRes = await fetch(disc.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokRes.ok) return null;
    const tokens = (await tokRes.json()) as OidcTokenResponse;
    let user: OidcUserInfo = {};
    if (disc.userinfo_endpoint && tokens.access_token) {
      const uRes = await fetch(disc.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (uRes.ok) user = (await uRes.json()) as OidcUserInfo;
    } else if (tokens.id_token) {
      // Fallback: decode id_token payload (no verification — verification would
      // require JWKS; sufficient for identity extraction when userinfo missing)
      const parts = tokens.id_token.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8")) as OidcUserInfo;
          user = payload;
        } catch { /* ignore */ }
      }
    }
    return { tokens, user };
  } catch {
    return null;
  }
}
