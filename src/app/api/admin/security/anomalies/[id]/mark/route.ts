import { NextResponse } from "next/server";
import { setMark, type AnomalyMark } from "@/lib/services/audit-anomaly-detector";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const ct = req.headers.get("content-type") ?? "";
    let mark: string | null = null;
    if (ct.includes("application/json")) {
      const body = (await req.json()) as { mark?: string };
      mark = typeof body.mark === "string" ? body.mark : null;
    } else {
      const form = await req.formData();
      const v = form.get("mark");
      mark = typeof v === "string" ? v : null;
    }
    if (mark !== "normal" && mark !== "investigate") {
      return NextResponse.json({ error: "mark must be normal|investigate" }, { status: 400 });
    }
    await setMark(id, mark as AnomalyMark);
    // If POST from form, redirect back
    if (!ct.includes("application/json")) {
      return NextResponse.redirect(new URL("/admin/security/anomalies", req.url), 303);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[api/admin/security/anomalies/mark] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
