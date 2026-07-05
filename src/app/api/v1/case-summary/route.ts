import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/middleware/api-key-auth";

export async function POST(req: Request) {
  const started = Date.now();
  const auth = await requireApiKey(req, "case-summary-ai");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      await auth.onFinish(false, Date.now() - started);
      return NextResponse.json({ ok: false, error: "MISSING_TEXT" }, { status: 400 });
    }
    // 실제로는 Claude Haiku 호출. 여기서는 첫 200자 커트 요약 stub.
    const summary = text.length <= 200 ? text : `${text.slice(0, 200)}…`;
    await auth.onFinish(true, Date.now() - started);
    return NextResponse.json({ ok: true, remainingQuota: auth.value.remainingQuota - 1, summary });
  } catch (err) {
    await auth.onFinish(false, Date.now() - started);
    return NextResponse.json({ ok: false, error: "INTERNAL", detail: String(err) }, { status: 500 });
  }
}
