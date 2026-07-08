import { smartInvoke } from "@/lib/services/smart-ai-client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { createAdminRequestContext } from "@/lib/http/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `당신은 한국 행정사 서면 첨삭 전문가입니다.
5개 축으로 엄격히 평가: 법령 인용 정확도, 논리 구조, 사실관계 정합성, 클라이언트 이익 반영, 문장 명료성.
각 축 0-20점. JSON만 응답.`;

const DOC_TYPES = ["행정심판청구서", "이의신청서", "인허가신청서", "탄원서", "의견서", "회신"] as const;

export async function POST(req: Request) {
  const api = createAdminRequestContext("mentor.critique-draft");
  if (!(await isFeatureEnabled("mentor_document_critique"))) {
    return api.error(403, "서면 첨삭 비활성.", { code: "FEATURE_DISABLED" });
  }
  const body = (await req.json().catch(() => ({}))) as {
    docType?: string;
    draft?: string;
    context?: string;
  };
  if (!body.draft || body.draft.trim().length < 30) {
    return api.error(400, "초안 30자 이상 필요.", { code: "TOO_SHORT" });
  }
  const docType = DOC_TYPES.includes(body.docType as any) ? body.docType : DOC_TYPES[0];

  const prompt = `[서면 종류] ${docType}
[사건 맥락] ${body.context ?? "미제공"}

[초안]
${body.draft}

JSON으로 5축 채점:
{
  "totalScore": 0-100,
  "axes": {
    "legalCitation": { "score": 0-20, "comment": "..." },
    "logicStructure": { "score": 0-20, "comment": "..." },
    "factConsistency": { "score": 0-20, "comment": "..." },
    "clientBenefit": { "score": 0-20, "comment": "..." },
    "clarity": { "score": 0-20, "comment": "..." }
  },
  "topFixes": ["최우선 개선점 3개"],
  "suggestedRevision": "개선된 첫 문단 예시"
}`;

  try {
    const result = await smartInvoke("drafting" as any, prompt, {
      system: SYSTEM,
      maxTokens: 2500,
      keywords: ["첨삭", "서면"],
    });
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return api.ok({ ok: true, critique: parsed, model: result.model, docType });
  } catch (err) {
    api.logError(err);
    return api.error(500, "첨삭 실패.", { code: "CRITIQUE_FAILED" });
  }
}
