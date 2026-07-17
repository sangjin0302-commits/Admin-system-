/**
 * 사건 → 자동 리서치 (Tier 2)
 *
 * 흐름:
 *   1) AI 키워드 추출 (Haiku, cheap)
 *   2) 병렬 법제처 API 조회 (법령/판례/행정심판 재결례/법령해석례/행정규칙/자치법규/별표서식)
 *   3) AI 종합 요약 (Sonnet, drafting)
 *   4) 결과 1시간 캐시 (동일 사건 재요청 무료)
 *
 * 대략 비용/신규호출: Haiku ~$0.0004 + Sonnet ~$0.01 ≈ $0.011.
 */

import { createHash } from "crypto";

import { withCache } from "@/lib/services/cache-service";
import {
  verifyCitations,
  type CitationVerifyResult,
} from "@/lib/services/citation-verify-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  searchAdminJudgment,
  searchAdminRule,
  searchArticleFullText,
  searchForm,
  searchInterpretation,
  searchLaw,
  searchMinistryInterpretation,
  searchOrdinance,
  searchPrecedent,
  searchSpecialAdminJudgment,
  type AdminJudgmentItem,
  type AdminRuleItem,
  type FormItem,
  type InterpretationItem,
  type LawResultItem,
  type LawSearchItem,
  type MinistryInterpItem,
  type OrdinanceItem,
  type PrecedentSearchItem,
} from "@/lib/services/law-api-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import type { TaskType } from "@/lib/services/model-router-service";
import {
  searchNotionArchive,
  type NotionReferenceMaterial,
} from "@/lib/integrations/notion";
import { logger } from "@/lib/utils/logger";

export type CaseResearchResult = {
  keywords: string[];
  laws: LawSearchItem[];
  /** 조문 본문 포함 (aiSearch) */
  articles: LawResultItem[];
  precedents: PrecedentSearchItem[];
  adminJudgments: AdminJudgmentItem[];
  /** 조세심판원 재결례 */
  specialJudgments: AdminJudgmentItem[];
  interpretations: InterpretationItem[];
  /** 법무부(비자·체류) 유권해석 */
  ministryInterps: MinistryInterpItem[];
  adminRules: AdminRuleItem[];
  forms: FormItem[];
  ordinances: OrdinanceItem[];
  /** 노션 아카이브 자료. 노션 연동이 꺼져 있으면 빈 배열 */
  archiveMaterials: NotionReferenceMaterial[];
  summary: string;
  /** AI 요약의 조문 인용 검증 결과. 플래그 off이거나 검증 불가 시 null */
  citationCheck: CitationVerifyResult | null;
  generatedAt: string;
};

const CACHE_TTL_SEC = 3600; // 1 hour

const RESEARCH_SYSTEM_PROMPT =
  "당신은 행정사무소의 법률 리서치 어시스턴트입니다. 사건에 관련된 법령·판례·해석례를 종합해 실무자가 참고할 수 있게 정리하세요. 승소예측·자문 언급 금지. 사실 나열 + 관련성 설명만.";

/**
 * 노션 "사용 위치" 중 AI 종합에 근거로 넣을 값.
 * guidebook/customer_message 등은 사람이 읽는 용도라 프롬프트에 넣지 않습니다.
 */
const AI_CONTEXT_USAGE_SITES = ["case_outlook", "domain_pack"];

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
    articles: LawResultItem[];
    precedents: PrecedentSearchItem[];
    adminJudgments: AdminJudgmentItem[];
    specialJudgments: AdminJudgmentItem[];
    interpretations: InterpretationItem[];
    ministryInterps: MinistryInterpItem[];
    adminRules: AdminRuleItem[];
    ordinances: OrdinanceItem[];
    forms: FormItem[];
    archiveMaterials: NotionReferenceMaterial[];
  }
): Promise<string> {
  const {
    laws,
    articles,
    precedents,
    adminJudgments,
    specialJudgments,
    interpretations,
    ministryInterps,
    adminRules,
    ordinances,
    forms,
    archiveMaterials,
  } = data;
  // 적격 필터는 searchNotionArchive가 이미 조회 단계에서 적용합니다.
  const archiveForPrompt = archiveMaterials.slice(0, 3);
  const prompt = `사건: ${caseDescription.slice(0, 1500)}

검색된 자료:
[법령] ${laws.slice(0, 5).map((l) => `${l.title} (${l.extra["법령구분명"] ?? ""})`).join(", ") || "없음"}
[조문 본문] ${
    articles
      .slice(0, 3)
      .map(
        (a) =>
          `${a.extra["법령명"] ?? ""} ${a.title} ${a.number}\n${(a.extra["조문내용"] ?? "").slice(0, 600)}`
      )
      .join("\n---\n") || "없음"
  }
[판례] ${
    precedents
      .slice(0, 5)
      .map((p) => `${p.title} ${p.number} (${p.agency} ${p.date})`)
      .join("\n") || "없음"
  }
[행정심판 재결례] ${
    adminJudgments
      .slice(0, 3)
      .map((d) => `${d.title} ${d.number} (${d.agency})`)
      .join("\n") || "없음"
  }
[조세심판원 재결례] ${
    specialJudgments
      .slice(0, 2)
      .map((d) => `${d.title} ${d.number} (${d.agency})`)
      .join("\n") || "없음"
  }
[법령해석례(법제처)] ${interpretations.slice(0, 3).map((i) => `${i.title} (${i.agency})`).join(", ") || "없음"}
[법무부 유권해석] ${ministryInterps.slice(0, 3).map((i) => `${i.title} (${i.agency})`).join(", ") || "없음"}
[행정규칙] ${adminRules.slice(0, 3).map((a) => a.title).join(", ") || "없음"}
[자치법규] ${ordinances.slice(0, 3).map((o) => `${o.title} (${o.agency})`).join(", ") || "없음"}
[별표·서식] ${forms.slice(0, 3).map((f) => `${f.title} (${f.extra["관련법령명"] ?? ""})`).join(", ") || "없음"}
[사무소 내부 아카이브] ${
    archiveForPrompt
      .map(
        (m) =>
          `${m.title}${m.trustLevel ? ` (신뢰도: ${m.trustLevel})` : ""}\n관련 법령: ${
            m.lawReferences ?? "미기재"
          }\n요약: ${(m.summary ?? "").slice(0, 400)}`
      )
      .join("\n---\n") || "없음"
  }

위 자료를 바탕으로:
1. 관련 법령·조문 후보 (조문 본문 포함)
2. 참고 판례 · 행정심판 재결례
3. 유권해석 (법무부·법제처)
4. 인허가·행정 절차 확인 포인트 + 필요 서식
한국어 3-5문단으로 정리.

[사무소 내부 아카이브]는 사무소가 정리해 둔 자료입니다. 실무 맥락 보강에만 쓰고,
법령·조문 인용은 반드시 위 [법령]/[조문 본문]에 실제로 있는 것만 하세요.
아카이브 자료를 근거로 삼은 문단에는 자료 제목을 괄호로 밝히세요.`;
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

    const [
      laws,
      articles,
      precedents,
      adminJudgments,
      specialJudgments,
      interpretations,
      ministryInterps,
      adminRules,
      ordinances,
      forms,
      archiveMaterials,
    ] = await Promise.all([
      searchLaw(primaryKw, 5).catch(() => [] as LawSearchItem[]),
      // 조문 본문 (aiSearch — 검색 응답에 본문 포함)
      searchArticleFullText(primaryKw, 3).catch(() => [] as LawResultItem[]),
      searchPrecedent(primaryKw, 5).catch(() => [] as PrecedentSearchItem[]),
      searchAdminJudgment(primaryKw, 3).catch(() => [] as AdminJudgmentItem[]),
      // 조세심판원
      searchSpecialAdminJudgment("tt", primaryKw, 2).catch(() => [] as AdminJudgmentItem[]),
      searchInterpretation(primaryKw, 3).catch(() => [] as InterpretationItem[]),
      // 법무부 (비자·체류)
      searchMinistryInterpretation("moj", primaryKw, 3).catch(() => [] as MinistryInterpItem[]),
      searchAdminRule(primaryKw, 3).catch(() => [] as AdminRuleItem[]),
      searchOrdinance(primaryKw, 3).catch(() => [] as OrdinanceItem[]),
      searchForm(primaryKw, 3).catch(() => [] as FormItem[]),
      // 사무소 노션 아카이브 — 연동 off면 빈 배열.
      // AI 근거로 쓸 수 있는 것만: 원문 미확인(must_verify) 제외 + 사용 위치가 AI 맥락용인 것.
      searchNotionArchive({
        keywords,
        limit: 4,
        usageSites: AI_CONTEXT_USAGE_SITES,
        excludeMustVerify: true,
      }).catch(() => [] as NotionReferenceMaterial[]),
    ]);

    const rawSummary = await summarize(trimmed, {
      laws,
      articles,
      precedents,
      adminJudgments,
      specialJudgments,
      interpretations,
      ministryInterps,
      adminRules,
      ordinances,
      forms,
      archiveMaterials,
    });

    /**
     * 인용 검증 — AI가 지어낸 조문을 잡는다.
     * 차단·재시도하지 않고 그대로 노출한다. 불일치가 있으면 요약 본문에도
     * 경고를 덧붙여 복사해 가더라도 놓칠 수 없게 한다.
     */
    let citationCheck: CitationVerifyResult | null = null;
    let summary = rawSummary;
    if (await isFeatureEnabled("case_research_verify_citations")) {
      citationCheck = await verifyCitations(rawSummary);
      if (citationCheck.hallucinationDetected) {
        const bad = citationCheck.mismatched + citationCheck.notFound;
        summary = `${rawSummary}\n\n⚠️ 인용 검증: ${bad}건의 조문 인용이 실제와 불일치합니다. 아래 검증 결과를 확인하세요.`;
      }
    }

    return {
      keywords,
      laws,
      articles,
      precedents,
      adminJudgments,
      specialJudgments,
      interpretations,
      ministryInterps,
      adminRules,
      forms,
      ordinances,
      archiveMaterials,
      summary,
      citationCheck,
      generatedAt: new Date().toISOString(),
    };
  };

  if (options.bypassCache) return run();
  return withCache<CaseResearchResult>(cacheKeyFor(trimmed), CACHE_TTL_SEC, run);
}
