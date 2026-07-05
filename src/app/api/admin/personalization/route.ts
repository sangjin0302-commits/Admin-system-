import { NextResponse } from "next/server";

import {
  DEFAULT_VARIANTS,
  listVariants,
  saveVariants,
  type PersonalizationVariant,
} from "@/lib/services/homepage-personalization-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const variants = await listVariants();
    return NextResponse.json({ variants, defaults: DEFAULT_VARIANTS });
  } catch (err) {
    logger.error("[api.admin.personalization] GET 실패", err instanceof Error ? { message: err.message } : { err });
    return NextResponse.json({ error: "variants 조회 실패" }, { status: 500 });
  }
}

function sanitizeStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeVariant(v: unknown): PersonalizationVariant | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id.trim() : "";
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!id || !name) return null;

  const trigger = (r.trigger && typeof r.trigger === "object" ? r.trigger : {}) as Record<string, unknown>;
  const devicesRaw = sanitizeStringArray(trigger.devices);
  const devices = devicesRaw?.filter(
    (d): d is "mobile" | "tablet" | "desktop" => d === "mobile" || d === "tablet" || d === "desktop",
  );

  return {
    id,
    name,
    trigger: {
      keywords: sanitizeStringArray(trigger.keywords),
      referrerDomains: sanitizeStringArray(trigger.referrerDomains),
      utmSources: sanitizeStringArray(trigger.utmSources),
      regions: sanitizeStringArray(trigger.regions),
      devices: devices && devices.length > 0 ? devices : undefined,
    },
    heroBadge: typeof r.heroBadge === "string" ? r.heroBadge : undefined,
    heroTitle: typeof r.heroTitle === "string" ? r.heroTitle : undefined,
    heroDescription: typeof r.heroDescription === "string" ? r.heroDescription : undefined,
  };
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.variants)) {
      return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
    }
    const variants: PersonalizationVariant[] = [];
    for (const item of body.variants) {
      const v = sanitizeVariant(item);
      if (v) variants.push(v);
    }
    await saveVariants(variants);
    return NextResponse.json({ ok: true, count: variants.length });
  } catch (err) {
    logger.error("[api.admin.personalization] PUT 실패", err instanceof Error ? { message: err.message } : { err });
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
