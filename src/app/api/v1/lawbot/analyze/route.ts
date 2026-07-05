import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/middleware/api-key-auth";

export async function POST(req: Request) {
  const started = Date.now();
  const auth = await requireApiKey(req, "lawbot-analyze");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      await auth.onFinish(false, Date.now() - started);
      return NextResponse.json({ ok: false, error: "MISSING_PROMPT" }, { status: 400 });
    }
    // 실제 Lawbot 서비스 연동은 내부 orchestrator를 통해 이루어짐. 여기서는 stub 응답.
    const result = {
      summary: `[STUB] ${prompt.slice(0, 60)} 관련 초기 분석`,
      relatedLaws: [],
      relatedPrecedents: [],
      risks: [],
      winProbability: null as number | null,
    };
    await auth.onFinish(true, Date.now() - started);
    return NextResponse.json({ ok: true, remainingQuota: auth.value.remainingQuota - 1, result });
  } catch (err) {
    await auth.onFinish(false, Date.now() - started);
    return NextResponse.json({ ok: false, error: "INTERNAL", detail: String(err) }, { status: 500 });
  }
}
