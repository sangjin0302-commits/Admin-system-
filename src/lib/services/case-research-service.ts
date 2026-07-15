/**
 * 사건 → 자동 리서치 (Tier 2)
 *
 * 흐름:
 *   1) AI 키워드 추출 (Haiku, cheap)
 *   2) 병렬 법제처 API 조회 (법령/판례/해석례/행정규칙/서식/자치법규)
 *   3) AI 종합 요약 (Sonnet, drafting)
 *   4) 결과 1시간 캐시 (동일 사건 재요청 무료)
 *
 * 대략 비용/신규호출: Haiku ~$0.0004 + Sonnet ~$0.01 ≈ $0.011.
 */

import { createHash } from "crypto";

import { withCache } from "@/lib/services/cache-service";
import {
  searchAdminRule,
  searchForm,
  searchInterpretation,
  searchLaw,
  searchOrdinance,
  searchPrecedent,
  type AdminRuleItem,
  type FormItem,
  type InterpretationItem,
  type LawSearchItem,
  type OrdinanceItem,
  type PrecedentSearchItem,
} from "@/lib/services/law-api-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import type { TaskType } from "@/lib/services/model-router-service";
import { logger } from "@/lib/utils/logger";

export type CaseResearchResult = {
  keywords: string[];
  laws: LawSearchItem[];
  precedents: PrecedentSearchItem[];
  interpretations: InterpretationItem[];
  adminRules: AdminRuleItem[];
  forms: FormItem[];
  ordinances: OrdinanceItem[];
  summary: string;
  generatedAt: string;
};

const CACHE_TTL_SEC = 3600; // 1 hour

const RESEARCH_SYSTEM_PROMPT =
  "당신은 행정사무소의 법률 리서치 어시스턴트입니다. 사건에 관련된 법령·판례·해석례를 종합해 실무자가 참고할 수 있게 정리하세요. 승소예측·자문 언급 금지. 사실 나열 + 관련성 설명만.";

function cacheKeyFor(caseDescription: string): string {
  const hash = createHash("md5")
    .update(caseDescription.slice(0, 500))
    .digest("hex")
    .slice(0, 16);
  return `case-research:${hash}`;
}

async function extractKeywords(caseDescription: string): Promise<string[]> {
  try {
    const res = await smartInvoke(
      "extract" as TaskType,
      `다음 사건 설명에서 법률 검색 키워드 5개를 추출하세요. 구체적인 법률 용어·법령명·판례 검색에 사용됩니다. JSON 배열만 반환: ["키워드1","키워드2",...]\n\n사건: ${caseDescription.slice(0, 2000)}`,
      { forceLevel: "cheap", maxTokens: 200 }
    );
    const match = res.text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]) as unknown;
      if (Array.isArray(parsed)) {
        const kws = parsed
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
          .slice(0, 5);
        if (kws.length > 0) return kws;
      }
    }
  } catch (err) {
    logger.warn("case-research: keyword extraction failed", { err: String(err) });
  }
  return [caseDescription.slice(0, 40)];
}

async function summarize(
  caseDescription: string,
  data: {
    laws: LawSearchItem[];
    precedents: PrecedentSearchItem[];
    interpretations: InterpretationItem[];
    adminRules: AdminRuleItem[];
  }
): Promise<string> {
  const { laws, precedents, interpretations, adminRules } = data;
  const prompt = `사건: ${caseDescription.slice(0, 1500)}

검색된 자료:
[법령] ${laws.slice(0, 5).map((l) => `${l.name} (${l.lawType})`).join(", ") || "없음"}
[판례] ${
    precedents
      .slice(0, 5)
      .map((p) => `${p.caseName} ${p.caseNumber} - ${p.summary.slice(0, 100)}`)
      .join("\n") || "없음"
  }
[해석례] ${interpretations.slice(0, 3).map((i) => `${i.title} (${i.agency})`).join(", ") || "없음"}
[행정규칙] ${adminRules.slice(0, 3).map((a) => a.name).join(", ") || "없음"}

위 자료를 바탕으로:
1. 이 사건과 가장 관련 높은 법령·조문 후보
2. 참고할 만한 판례 요약
3. 행정 절차 상 확인 포인트
4. 필요한 서식/증빙
한국어 3-5문단으로 정리.`;
  try {
    const res = await smartInvoke("drafting" as TaskType, prompt, {
      system: RESEARCH_SYSTEM_PROMPT,
      maxTokens: 1500,
    });
    return res.text.trim();
  } catch (err) {
    logger.warn("case-research: summary failed", { err: String(err) });
    return "AI 종합 요약을 생성하지 못했습니다. 아래 검색된 자료를 직접 확인해 주세요.";
  }
}

export async function researchCase(
  caseDescription: string,
  options: { bypassCache?: boolean } = {}
): Promise<CaseResearchResult> {
  const trimmed = caseDescription.trim();
  const run = async (): Promise<CaseResearchResult> => {
    const keywords = await extractKeywords(trimmed);
    const primaryKw = keywords[0] ?? trimmed.slice(0, 40);

    const [laws, precedents, interpretations, adminRules, forms, ordinances] =
      await Promise.all([
        searchLaw(primaryKw, 5).catch(() => [] as LawSearchItem[]),
        searchPrecedent(primaryKw, 5).catch(() => [] as PrecedentSearchItem[]),
        searchInterpretation(primaryKw, 3).catch(
          () => [] as InterpretationItem[]
        ),
        searchAdminRule(primaryKw, 3).catch(() => [] as AdminRuleItem[]),
        searchForm(primaryKw, 3).catch(() => [] as FormItem[]),
        searchOrdinance(primaryKw, 3).catch(() => [] as OrdinanceItem[]),
      ]);

    const summary = await summarize(trimmed, {
      laws,
      precedents,
      interpretations,
      adminRules,
    });

    return {
      keywords,
      laws,
      precedents,
      interpretations,
      adminRules,
      forms,
      ordinances,
      summary,
      generatedAt: new Date().toISOString(),
    };
  };

  if (options.bypassCache) return run();
  return withCache<CaseResearchResult>(cacheKeyFor(trimmed), CACHE_TTL_SEC, run);
}
