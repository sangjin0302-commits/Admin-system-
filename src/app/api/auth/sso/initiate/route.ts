import { NextResponse } from "next/server";
import { buildAuthorizeUrl, getSsoForDomain } from "@/lib/services/enterprise-sso-service";

function randomState(): string {
  return Array.from({ length: 4 })
    .map(() => Math.random().toString(36).slice(2, 10))
    .join("");
}

async function handle(req: Request, email: string): Promise<Response> {
  const cfg = await getSsoForDomain(email);
  if (!cfg) {
    return NextResponse.json({ ok: false, error: "SSO_NOT_CONFIGURED" }, { status: 404 });
  }
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/sso/callback`;
  const state = randomState();
  const authorizeUrl = await buildAuthorizeUrl(cfg, redirectUri, state);
  if (!authorizeUrl) {
    return NextResponse.json({ ok: false, error: "OIDC_DISCOVERY_FAILED" }, { status: 502 });
  }
  const res = NextResponse.redirect(authorizeUrl, 302);
  res.cookies.set("sso.state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  res.cookies.set("sso.orgId", cfg.orgId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  res.cookies.set("sso.email", email, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? "";
  if (!email) return NextResponse.json({ ok: false, error: "NO_EMAIL" }, { status: 400 });
  return handle(req, email);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email ?? "";
  if (!email) return NextResponse.json({ ok: false, error: "NO_EMAIL" }, { status: 400 });
  return handle(req, email);
}
