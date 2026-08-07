import { NextResponse } from "next/server";

import {
  getSiteSettings,
  saveSiteSettings,
  SITE_SETTINGS_DEFAULTS,
  type SiteSettingsKey
} from "@/lib/services/site-settings";
import { invalidatePath } from "@/lib/services/edge-cache-service";

// getSiteSettings 를 읽는 정적(ISR) 공개 마케팅 페이지 전체.
// 저장 키가 어느 페이지를 건드리는지 세분화하지 않고, 작은 정적 집합을 통째로 재검증한다.
const STATIC_MARKETING_PATHS = [
  "/",
  "/en",
  "/about",
  "/en/about",
  "/fees",
  "/en/fees",
  "/services/immigration",
  "/services/appeal",
  "/services/contract",
  "/services/license",
  "/services/corporate",
  "/en/services/immigration",
  "/en/services/appeal",
  "/en/services/contract",
  "/en/services/license",
  "/en/services/corporate",
];

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const values: Partial<Record<SiteSettingsKey, string>> = {};
  for (const key of Object.keys(SITE_SETTINGS_DEFAULTS) as SiteSettingsKey[]) {
    const v = (body as Record<string, unknown>)[key];
    if (typeof v === "string") values[key] = v;
  }

  try {
    await saveSiteSettings(values);
    for (const p of STATIC_MARKETING_PATHS) void invalidatePath(p, "site-settings save");
    const settings = await getSiteSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("admin/site-content POST failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
