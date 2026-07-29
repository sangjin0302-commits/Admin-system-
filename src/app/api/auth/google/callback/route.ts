import { NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  storeToken,
} from "@/lib/services/google-oauth-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/admin/calendar?google=denied", req.url));
  }
  if (!code || !state) {
    return NextResponse.json(
      { ok: false, error: "missing code/state" },
      { status: 400 }
    );
  }

  const cookieState = req.headers
    .get("cookie")
    ?.match(/g_oauth_state=([^;]+)/)?.[1];
  if (!cookieState || cookieState !== state) {
    return NextResponse.json(
      { ok: false, error: "state mismatch" },
      { status: 400 }
    );
  }

  const token = await exchangeCodeForToken(code);
  if (!token || !token.refresh_token) {
    return NextResponse.redirect(
      new URL("/admin/calendar?google=token_failed", req.url)
    );
  }

  await storeToken({ token });

  const from = req.headers.get("cookie")?.match(/g_oauth_from=([^;]+)/)?.[1];
  const redirectTo =
    from === "google-services"
      ? "/admin/integrations/google-services?google=connected"
      : "/admin/calendar?google=connected";

  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  res.cookies.delete("g_oauth_state");
  res.cookies.delete("g_oauth_from");
  return res;
}
