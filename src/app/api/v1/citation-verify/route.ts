import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/middleware/api-key-auth";

interface Citation {
  type: "precedent" | "statute";
  ref: string;
}

export async function POST(req: Request) {
  const started = Date.now();
  const auth = await requireApiKey(req, "citation-verify");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const citations = Array.isArray(body?.citations) ? (body.citations as Citation[]) : [];
    if (citations.length === 0) {
      await auth.onFinish(false, Date.now() - started);
      return NextResponse.json({ ok: false, error: "MISSING_CITATIONS" }, { status: 400 });
    }
    // citation-verifier 서비스가 있으면 위임, 없으면 형식 검증만 stub.
    const results = citations.map((c) => {
      const looksLikeCaseNo = /^\d{4}[가-힣]{1,3}\d{2,6}$/.test(c.ref ?? "");
      const looksLikeStatute = /제\s?\d+\s?조/.test(c.ref ?? "");
      const valid =
        c.type === "precedent" ? looksLikeCaseNo :
        c.type === "statute" ? looksLikeStatute : false;
      return { input: c, valid, confidence: valid ? 0.7 : 0.1, note: valid ? "형식 일치" : "형식 불일치 또는 검증 실패" };
    });
    await auth.onFinish(true, Date.now() - started);
    return NextResponse.json({ ok: true, remainingQuota: auth.value.remainingQuota - 1, results });
  } catch (err) {
    await auth.onFinish(false, Date.now() - started);
    return NextResponse.json({ ok: false, error: "INTERNAL", detail: String(err) }, { status: 500 });
  }
}
