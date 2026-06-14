import { NextResponse } from "next/server";

import {
  getSiteSettings,
  saveSiteSettings,
  SITE_SETTINGS_DEFAULTS,
  type SiteSettingsKey
} from "@/lib/services/site-settings";

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

  await saveSiteSettings(values);
  const settings = await getSiteSettings();
  return NextResponse.json({ ok: true, settings });
}
