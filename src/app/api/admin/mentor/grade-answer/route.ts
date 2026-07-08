import { smartInvoke } from "@/lib/services/smart-ai-client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `당신은 한국 행정사 실무 멘토입니다.
학습자의 답변을 엄격하고 정확하게 평가합니다.
법령 인용 정확도·기한 준수·절차 순서·클라이언트 커뮤니케이션 4개 기준.
JSON 형식으로만 응답.`;

export async function POST(req: Request) {
  const api = createAdminRequestContext("mentor.grade-answer");
  if (!(await isFeatureEnabled("mentor_case_simulator"))) {
    return api.error(403, "멘토링 기능 비활성.", { code: "FEATURE_DISABLED" });
  }
  const body = (await req.json().catch(() => ({}))) as {
    scenario?: { situation?: string; clientQuestion?: string; expectedAnswerPoints?: string[] };
    userAnswer?: string;
  };
  if (!body.scenario || !body.userAnswer) {
    return api.error(400, "scenario 및 userAnswer 필요.", { code: "MISSING" });
  }

  const prompt = `[시나리오]
상황: ${body.scenario.situation ?? ""}
질문: ${body.scenario.clientQuestion ?? ""}
기대 답변 요점: ${(body.scenario.expectedAnswerPoints ?? []).join(", ")}

[학습자 답변]
${body.userAnswer}

JSON으로 평가:
{
  "score": 0-100,
  "strengths": ["잘한 점 2-3개"],
  "weaknesses": ["개선점 2-3개"],
  "missedPoints": ["누락된 요점"],
  "legalAccuracy": "법령 인용 정확도 코멘트",
  "improvedAnswer": "모범 답변 4-6문장"
}`;

  try {
    const result = await smartInvoke("drafting" as any, prompt, {
      system: SYSTEM,
      maxTokens: 2000,
      keywords: ["평가", "행정사"],
    });
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return api.ok({ ok: true, grading: parsed, model: result.model });
  } catch (err) {
    api.logError(err);
    return api.error(500, "평가 실패.", { code: "GRADE_FAILED" });
  }
}
