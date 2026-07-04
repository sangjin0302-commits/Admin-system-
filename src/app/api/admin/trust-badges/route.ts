import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

interface TrustBadgeInput {
  label: string;
  iconUrl?: string;
  url?: string;
}

function sanitize(body: unknown): TrustBadgeInput[] | null {
  if (!body || typeof body !== "object") return null;
  const arr = (body as { badges?: unknown }).badges;
  if (!Array.isArray(arr)) return null;
  const out: TrustBadgeInput[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!label) continue;
    const iconUrl = typeof o.iconUrl === "string" ? o.iconUrl.trim() : "";
    const url = typeof o.url === "string" ? o.url.trim() : "";
    out.push({
      label,
      ...(iconUrl ? { iconUrl } : {}),
      ...(url ? { url } : {}),
    });
  }
  return out;
}

export async function GET() {
  const row = await prisma.siteSetting.findUnique({ where: { key: "trust.badges" } }).catch(() => null);
  let badges: TrustBadgeInput[] = [];
  if (row?.value) {
    try {
      const parsed: unknown = JSON.parse(row.value);
      const sanitized = sanitize({ badges: parsed });
      if (sanitized) badges = sanitized;
    } catch {
      /* fallthrough */
    }
  }
  return NextResponse.json({ ok: true, badges });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const badges = sanitize(body);
  if (!badges) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const value = JSON.stringify(badges);
  await prisma.siteSetting.upsert({
    where: { key: "trust.badges" },
    create: { key: "trust.badges", value },
    update: { value },
  });

  return NextResponse.json({ ok: true, badges });
}
