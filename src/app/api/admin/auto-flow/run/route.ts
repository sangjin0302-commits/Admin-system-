import { NextResponse } from "next/server";
import { runFullAutoFlow, getFullAutoConfig, setFullAutoConfig, type FullAutoConfig } from "@/lib/services/full-auto-case-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Support both JSON and form submissions
    const ct = req.headers.get("content-type") ?? "";
    let inquiryId: string | null = null;
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => null);
      inquiryId = typeof body?.inquiryId === "string" ? body.inquiryId : null;
    } else {
      const form = await req.formData().catch(() => null);
      const v = form?.get("inquiryId");
      inquiryId = typeof v === "string" ? v : null;
    }
    if (!inquiryId) {
      return NextResponse.json({ error: "inquiryId is required" }, { status: 400 });
    }
    const result = await runFullAutoFlow(inquiryId);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    logger.error("[api/admin/auto-flow/run] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  const cfg = await getFullAutoConfig();
  return NextResponse.json({ config: cfg });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Partial<FullAutoConfig>;
    const current = await getFullAutoConfig();
    const next: FullAutoConfig = {
      enabled: typeof body.enabled === "boolean" ? body.enabled : current.enabled,
      categoryWhitelist: Array.isArray(body.categoryWhitelist) ? body.categoryWhitelist.filter((v) => typeof v === "string") : current.categoryWhitelist,
      thresholds: { ...current.thresholds, ...(body.thresholds ?? {}) },
    };
    await setFullAutoConfig(next);
    return NextResponse.json({ ok: true, config: next });
  } catch (err) {
    logger.error("[api/admin/auto-flow PATCH] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
