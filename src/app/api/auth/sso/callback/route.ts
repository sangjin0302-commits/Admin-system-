import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, getSsoConfig } from "@/lib/services/enterprise-sso-service";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const storedState = jar.get("sso.state")?.value;
  const orgId = jar.get("sso.orgId")?.value;
  const fallbackEmail = jar.get("sso.email")?.value;

  if (!code || !state || !storedState || state !== storedState || !orgId) {
    return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 400 });
  }
  const cfg = await getSsoConfig(orgId);
  if (!cfg) return NextResponse.json({ ok: false, error: "SSO_MISSING" }, { status: 400 });

  const redirectUri = `${url.origin}/api/auth/sso/callback`;
  const result = await exchangeCode(cfg, code, redirectUri);
  if (!result) return NextResponse.json({ ok: false, error: "TOKEN_EXCHANGE_FAILED" }, { status: 502 });

  const email = (result.user.email ?? fallbackEmail ?? "").toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "NO_EMAIL_CLAIM" }, { status: 400 });

  // Create/update PortalClient (best-effort; ignore if model missing)
  try {
    const anyPrisma = prisma as unknown as {
      portalClient?: {
        upsert: (args: unknown) => Promise<unknown>;
      };
    };
    if (anyPrisma.portalClient) {
      await anyPrisma.portalClient.upsert({
        where: { email },
        create: {
          email,
          name: result.user.name ?? email,
          ssoOrgId: orgId,
        },
        update: {
          ssoOrgId: orgId,
          name: result.user.name ?? undefined,
        },
      }).catch(() => null);
    }
  } catch { /* ignore */ }

  const res = NextResponse.redirect(`${url.origin}/portal`, 302);
  // Session token — simple signed-cookie stand-in (reuse existing portal cookie name pattern)
  res.cookies.set("portal.email", email, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
  res.cookies.set("portal.sso.org", orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
  // Clear temp state
  res.cookies.set("sso.state", "", { path: "/", maxAge: 0 });
  res.cookies.set("sso.orgId", "", { path: "/", maxAge: 0 });
  res.cookies.set("sso.email", "", { path: "/", maxAge: 0 });
  return res;
}
