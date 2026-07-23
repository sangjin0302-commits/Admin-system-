import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/middleware/api-key-auth";

export async function POST(req: Request) {
  const started = Date.now();
  const auth = await requireApiKey(req, "korean-legal-entity-extract");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text : "";
    if (!text) {
      await auth.onFinish(false, Date.now() - started);
      return NextResponse.json({ ok: false, error: "MISSING_TEXT" }, { status: 400 });
    }
    const parties: string[] = [];
    for (const m of text.matchAll(/(?:갑|을|병|정)\s*[:：]\s*([^\n,]+)/g)) parties.push(m[1].trim());
    const amounts: string[] = [];
    for (const m of text.matchAll(/[₩원]\s*([0-9,]+)/g)) amounts.push(m[1]);
    const dates: string[] = [];
    for (const m of text.matchAll(/(20\d{2})[-.년]\s*(\d{1,2})[-.월]\s*(\d{1,2})/g)) {
      dates.push(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`);
    }
    const clauses: string[] = [];
    for (const m of text.matchAll(/제\s?(\d+)\s?조/g)) clauses.push(`제${m[1]}조`);
    await auth.onFinish(true, Date.now() - started);
    return NextResponse.json({
      ok: true,
      remainingQuota: auth.value.remainingQuota - 1,
      entities: { parties, amounts, dates, clauses },
    });
  } catch (err) {
    console.error("[v1/legal-entity-extract] failed", err);
    await auth.onFinish(false, Date.now() - started);
    return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
  }
}
