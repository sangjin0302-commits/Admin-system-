import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  buildAuthorizeUrl,
  isGoogleOAuthConfigured,
} from "@/lib/services/google-oauth-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Google OAuth 미설정 — GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI 환경변수가 필요합니다.",
      },
      { status: 503 }
    );
  }
  const state = randomBytes(16).toString("hex");
  const url = buildAuthorizeUrl(state);
  if (!url) {
    return NextResponse.json({ ok: false, error: "URL build failed" }, { status: 500 });
  }

  const res = NextResponse.redirect(url);
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
