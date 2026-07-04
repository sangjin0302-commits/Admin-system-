import { NextResponse } from "next/server";

import { auditBySlug } from "@/lib/services/seo-audit-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const audit = await auditBySlug(slug);
  if (!audit) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, audit });
}
