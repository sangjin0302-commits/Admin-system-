import { NextResponse } from "next/server";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES = [
  "행정심판(처분 취소)",
  "인허가 신청 (일반 영업허가)",
  "인허가 신청 (환경/건축)",
  "이의신청 (과태료)",
  "사실조사 의뢰",
  "계약서 검토",
] as const;

const DIFFICULTY = ["초급", "중급", "고급"] as const;

const SYSTEM = `당신은 한국 행정사 자격 실무 멘토입니다.
현실적이고 실무자가 실제 마주칠 만한 상담 시나리오를 생성합니다.
법령·용어·기한을 정확히. 훈련용이므로 답을 미리 주지 않습니다.
JSON 형식으로 응답합니다.`;

export async function POST(req: Request) {
  const api = createAdminRequestContext("mentor.generate-case");
  if (!(await isFeatureEnabled("mentor_case_simulator"))) {
    return api.error(403, "멘토링 기능 비활성.", { code: "FEATURE_DISABLED" });
  }
  const body = (await req.json().catch(() => ({}))) as {
    category?: string;
    difficulty?: string;
  };
  const category = CATEGORIES.includes(body.category as any) ? body.category : CATEGORIES[0];
  const difficulty = DIFFICULTY.includes(body.difficulty as any) ? body.difficulty : DIFFICULTY[1];

  const prompt = `아래 조건으로 행정사 상담 시나리오 1건 생성:
- 카테고리: ${category}
- 난이도: ${difficulty}

JSON 형식으로만 응답:
{
  "clientProfile": "클라이언트 배경 2-3문장",
  "situation": "구체적 사실관계 5-8문장 (기간·금액·처분내용 포함)",
  "clientQuestion": "클라이언트가 실제 물어볼 질문 (구어체)",
  "hiddenTraps": ["함정 1", "함정 2"],
  "expectedAnswerPoints": ["답변에 반드시 들어가야 할 요점 3-5개"],
  "relatedLaws": ["관련 법령 조문 2-3개"]
}`;

  try {
    const result = await smartInvoke("drafting" as any, prompt, {
      system: SYSTEM,
      maxTokens: 1500,
      keywords: ["행정사", "상담"],
    });
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return api.ok({ ok: true, scenario: parsed, model: result.model, category, difficulty });
  } catch (err) {
    api.logError(err);
    return api.error(500, "시나리오 생성 실패.", { code: "GEN_FAILED" });
  }
}
