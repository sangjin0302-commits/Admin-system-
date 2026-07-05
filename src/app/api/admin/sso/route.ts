import { NextResponse } from "next/server";
import {
  createSsoConfig,
  deleteSsoConfig,
  fetchOidcDiscovery,
  listSsoConfigs,
  type SsoConfig,
} from "@/lib/services/enterprise-sso-service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const testUrl = url.searchParams.get("test");
  if (testUrl) {
    const discovery = await fetchOidcDiscovery(testUrl);
    if (!discovery) return NextResponse.json({ ok: false, error: "DISCOVERY_FAILED" });
    return NextResponse.json({ ok: true, discovery });
  }
  const configs = await listSsoConfigs();
  return NextResponse.json({ ok: true, configs });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { action?: "create" | "delete"; orgId?: string; config?: (Omit<SsoConfig, "orgId" | "createdAt"> & { orgId?: string }) }
    | null;
  if (!body?.action) return NextResponse.json({ ok: false, error: "NO_ACTION" }, { status: 400 });
  if (body.action === "create" && body.config) {
    if (!body.config.orgName) return NextResponse.json({ ok: false, error: "NO_ORG_NAME" }, { status: 400 });
    const orgId = body.config.orgId ?? body.orgId;
    if (!orgId) return NextResponse.json({ ok: false, error: "NO_ORG_ID" }, { status: 400 });
    const { orgId: _drop, ...rest } = body.config;
    void _drop;
    await createSsoConfig(orgId, rest as Omit<SsoConfig, "orgId" | "createdAt">);
  } else if (body.action === "delete" && body.orgId) {
    await deleteSsoConfig(body.orgId);
  } else {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }
  const configs = await listSsoConfigs();
  return NextResponse.json({ ok: true, configs });
}
