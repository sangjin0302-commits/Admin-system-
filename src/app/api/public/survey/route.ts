import { NextRequest, NextResponse } from "next/server";
import { submitSurveyResponse } from "@/lib/services/satisfaction-survey-service";

export async function POST(req: NextRequest) {
  // 본문이 비었거나 JSON 이 아니면 여기서 throw 되어 500 이 나갔다.
  // 의도한 건 400 이다.
  const body = (await req.json().catch(() => null)) as
    | { token?: string; rating?: number; comment?: string }
    | null;
  if (!body) {
    return NextResponse.json({ error: "요청 본문(JSON)을 확인해 주세요." }, { status: 400 });
  }

  const { token, rating, comment } = body;
  if (!token || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "별점(1-5)과 토큰이 필요합니다." }, { status: 400 });
  }

  const ok = await submitSurveyResponse(token, rating, comment || "");
  if (!ok) {
    return NextResponse.json(
      { error: "만료되었거나 잘못된 설문 링크입니다." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
