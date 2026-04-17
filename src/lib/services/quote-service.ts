import type {
  CaseStage,
  InquiryStatus,
  PaymentStageKind,
  Prisma,
  QuoteStatus
} from "@generated/prisma-client/client";

import { generateCaseNumber } from "@/lib/case-utils/case-number";
import { syncCaseAnalysisToNotion } from "@/lib/integrations/notion";
import {
  buildAcceptedNoticeDraftEn,
  buildAcceptedNoticeDraftKo,
  buildQuoteSendDraftEn,
  buildQuoteSendDraftKo
} from "@/lib/message-templates/quote-flow";
import { prisma } from "@/lib/prisma/client";
import { analyzeInquiryCase } from "@/lib/services/case-analysis-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";
import {
  buildContractDraftText,
  buildManualSummary,
  computeQuoteDraft
} from "@/lib/quote-engine/engine";
import {
  mapUrgencyLevelToRuleCode,
  selectDefaultRuleCode,
  suggestServiceLegacyIds
} from "@/lib/quote-engine/legacy-mapping";
import type {
  PricingOptionMaster,
  PricingRuleMaster,
  QuoteComputationResult,
  QuoteInquirySnapshot,
  QuoteSummarySnapshot,
  QuoteWorkspace,
  ServiceTypeMaster
} from "@/lib/quote-engine/types";
import { formatCurrency, toStageKindLabel } from "@/lib/quote-engine/utils";
import type { InquiryType, UrgencyLevel } from "@/types/inquiry";

type InquiryRecord = Prisma.InquiryGetPayload<Record<string, never>>;
type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    inquiry: true;
    lineItems: true;
    adjustments: true;
    paymentPlans: true;
    contractDraft: true;
    caseRecord: true;
  };
}>;
type DbClient = Pick<typeof prisma, "quote" | "contractDraft" | "caseRecord" | "inquiry">;

function asDbClient(client: unknown): DbClient {
  return client as DbClient;
}

function buildContractAnalysisTerms(quote: QuoteWithRelations) {
  const analysis = analyzeInquiryCase(quote.inquiry);

  const sections = [
    "[사건 분석 참고]",
    `사건 강도: ${analysis.strengthLabel} (${analysis.strengthScore}점)`,
    `사건 요약: ${analysis.summary}`,
    "",
    "[핵심 쟁점]",
    ...analysis.issues.map((item) => `- ${item}`),
    "",
    "[유리 요소]",
    ...analysis.favorableFactors.map((item) => `- ${item}`),
    "",
    "[불리 요소]",
    ...analysis.riskFactors.map((item) => `- ${item}`),
    "",
    "[추가 확인 필요 사실]",
    ...analysis.missingFacts.map((item) => `- ${item}`),
    "",
    "[참고 법령]",
    ...analysis.lawReferences.map((item) => `- ${item.title}: ${item.summary}`),
    "",
    "[판례 검색어]",
    ...analysis.precedentReferences.map((item) => `- ${item.query}`)
  ];

  return sections.join("\n");
}

function buildLawbotSection(title: string, items?: string[] | null) {
  return [
    "",
    title,
    ...(items && items.length > 0 ? items.map((item) => `- ${item}`) : ["- 원문 명시 없음"])
  ];
}

function formatLawbotDomainRoute(item: {
  label: string;
  score?: number;
  why?: string;
  priority_sources?: string[];
}) {
  return [
    item.label,
    item.score !== undefined ? `${Math.round(item.score)}점` : null,
    item.why,
    item.priority_sources?.length ? `우선 자료: ${item.priority_sources.join(", ")}` : null
  ]
    .filter(Boolean)
    .join(" / ");
}

function formatLawbotResearchSubtype(item: {
  label: string;
  domain_key: string;
  score?: number;
  note?: string;
}) {
  return [item.label, item.domain_key, item.score !== undefined ? `${Math.round(item.score)}점` : null, item.note]
    .filter(Boolean)
    .join(" / ");
}

function buildLawbotAnalysisDraft(result: Awaited<ReturnType<typeof getLawbotCaseAnalysis>>) {
  if (result.status !== "available") {
    return null;
  }

  const data = result.data;
  return [
    "[Lawbot 참고 분석]",
    `- 입력 요약: ${data.input_summary}`,
    data.confidence_score !== undefined
      ? `- 분석 신뢰도: ${Math.round(data.confidence_score)}점${data.confidence_label ? ` (${data.confidence_label})` : ""}`
      : null,
    data.match_reason ? `- 매칭 근거: ${data.match_reason}` : null,
    data.sync_ready !== undefined ? `- 동기화 준비 여부: ${data.sync_ready ? "저장 가능" : "보조 검토 필요"}` : null,
    data.practical_use_status ? `- 실전 사용 상태: ${data.practical_use_status}` : null,
    "",
    "[Lawbot 핵심 쟁점]",
    ...(data.key_issues.length > 0 ? data.key_issues.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 추가 확인 사실]",
    ...(data.followup_facts.length > 0 ? data.followup_facts.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 추가 검토 필요 사유]", data.review_required_reasons),
    ...buildLawbotSection("[Lawbot 빠진 핵심 사실]", data.critical_missing_facts),
    data.research_goal ? "" : null,
    data.research_goal ? "[Lawbot 조사 목표]" : null,
    data.research_goal ? `- ${data.research_goal}` : null,
    ...buildLawbotSection("[Lawbot 분야 라우팅]", data.domain_routes?.map(formatLawbotDomainRoute)),
    ...buildLawbotSection("[Lawbot 세부 유형 라우팅]", data.research_subtypes?.map(formatLawbotResearchSubtype)),
    ...buildLawbotSection("[Lawbot 실무 체크리스트]", data.practical_checklist),
    ...buildLawbotSection("[Lawbot 준비 자료 체크리스트]", data.document_checklist),
    ...buildLawbotSection("[Lawbot 공부 가이드]", data.study_guide),
    "",
    "[Lawbot 정확 매칭 법령]",
    ...(data.matched_laws?.length
      ? data.matched_laws.map(
          (item) =>
            `- ${item.law}${item.match_type ? ` / ${item.match_type}` : ""}${item.score !== undefined ? ` / ${Math.round(item.score)}점` : ""}${item.reason ? ` / ${item.reason}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 정확 매칭 조문]",
    ...(data.matched_articles?.length
      ? data.matched_articles.map(
          (item) =>
            `- ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}${item.summary ?? item.article_text ? ` / ${item.summary ?? item.article_text}` : ""}${item.match_reason ? ` / ${item.match_reason}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 우선 액션]",
    ...(data.priority_actions?.length ? data.priority_actions.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 리스크 플래그]",
    ...(data.risk_flags?.length ? data.risk_flags.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 비자 유형별 준비 포인트]", data.visa_specific_guidance),
    ...buildLawbotSection("[Lawbot 비자 세부 대응 포인트]", data.visa_scenario_guidance),
    ...buildLawbotSection("[Lawbot 행정심판 심화 포인트]", data.admin_appeal_deep_guidance),
    ...buildLawbotSection("[Lawbot 행정심판 기간·집행정지 포인트]", data.admin_appeal_timeline_guidance),
    ...buildLawbotSection("[Lawbot 업종별 인허가 포인트]", data.licensing_industry_guidance),
    ...buildLawbotSection("[Lawbot 업종별 인허가 심화 체크]", data.licensing_sector_deep_guidance),
    "",
    "[Lawbot 실무자용 메모]",
    ...(data.practitioner_brief?.length ? data.practitioner_brief.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 교육용 설명]",
    ...(data.training_notes?.length ? data.training_notes.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 고객 설명 초안]",
    ...(data.client_ready_summary?.length ? data.client_ready_summary.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 사건 유형별 플레이북]",
    ...(data.practice_playbook?.length ? data.practice_playbook.map((item) => `- ${item}`) : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 플레이북 근거 법령]", data.playbook_legal_bases),
    "",
    "[Lawbot 참고 법령]",
    ...(data.applicable_laws.length > 0 ? data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`) : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 판례]",
    ...(data.related_precedents?.length
      ? data.related_precedents.map((item) =>
          `- ${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 참고 해석례]",
    ...(data.related_interpretations?.length
      ? data.related_interpretations.map((item) =>
          `- ${item.title}${item.number ? ` / ${item.number}` : ""}${item.agency ? ` / ${item.agency}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}`
        )
      : ["- 원문 명시 없음"]),
    "",
    "[Lawbot 보조 참고 자료]",
    ...(data.supplemental_sources
      ? Object.entries(data.supplemental_sources)
          .flatMap(([category, items]) =>
            items.map(
              (item) =>
                `- ${category}: ${String(item.title ?? item.query ?? "참고 자료")}${item.snippet ? ` / ${String(item.snippet)}` : ""}`
            )
          )
      : ["- 원문 명시 없음"]),
    ...buildLawbotSection("[Lawbot 보조 자료 하이라이트]", data.supplemental_source_highlights),
    ...buildLawbotSection("[Lawbot 후속 좁은 질문 추천]", data.followup_narrow_questions),
    data.sync_payload
      ? [
          "",
          "[Lawbot 동기화 요약]",
          ...(data.sync_payload.practical_use_status ? [`- 실전 사용 상태: ${data.sync_payload.practical_use_status}`] : []),
          ...(data.sync_payload.review_required_reasons?.map((item) => `- 추가 검토: ${item}`) ?? []),
          ...(data.sync_payload.critical_missing_facts?.map((item) => `- 부족 사실: ${item}`) ?? []),
          ...(data.sync_payload.primary_law ? [`- 대표 법령: ${data.sync_payload.primary_law}`] : []),
          ...(data.sync_payload.primary_article ? [`- 대표 조문: ${data.sync_payload.primary_article}`] : []),
          ...(data.sync_payload.primary_precedent ? [`- 대표 판례: ${data.sync_payload.primary_precedent}`] : []),
          ...(data.sync_payload.priority_actions?.map((item) => `- 우선 액션: ${item}`) ?? []),
          ...(data.sync_payload.risk_flags?.map((item) => `- 리스크: ${item}`) ?? []),
          ...(data.sync_payload.domain_routes?.map((item) => `- 분야 라우팅: ${formatLawbotDomainRoute(item)}`) ?? []),
          ...(data.sync_payload.research_subtypes?.map((item) => `- 세부 유형: ${formatLawbotResearchSubtype(item)}`) ?? []),
          ...(data.sync_payload.research_goal ? [`- 조사 목표: ${data.sync_payload.research_goal}`] : []),
          ...(data.sync_payload.practical_checklist?.map((item) => `- 실무 체크: ${item}`) ?? []),
          ...(data.sync_payload.document_checklist?.map((item) => `- 준비 자료: ${item}`) ?? []),
          ...(data.sync_payload.study_guide?.map((item) => `- 공부 가이드: ${item}`) ?? []),
          ...(data.sync_payload.visa_specific_guidance?.map((item) => `- 비자 준비: ${item}`) ?? []),
          ...(data.sync_payload.visa_scenario_guidance?.map((item) => `- 비자 대응: ${item}`) ?? []),
          ...(data.sync_payload.admin_appeal_deep_guidance?.map((item) => `- 행정심판 심화: ${item}`) ?? []),
          ...(data.sync_payload.admin_appeal_timeline_guidance?.map((item) => `- 행정심판 기간: ${item}`) ?? []),
          ...(data.sync_payload.licensing_industry_guidance?.map((item) => `- 인허가 업종: ${item}`) ?? []),
          ...(data.sync_payload.licensing_sector_deep_guidance?.map((item) => `- 인허가 심화: ${item}`) ?? []),
          ...(data.sync_payload.matched_laws?.length
            ? data.sync_payload.matched_laws.map((item) => `- 법령: ${item.law}`)
            : []),
          ...(data.sync_payload.matched_articles?.length
            ? data.sync_payload.matched_articles.map(
                (item) => `- 조문: ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}`
              )
            : []),
          ...(data.sync_payload.supplemental_sources?.map((item) => `- 보조 자료: ${item}`) ?? []),
        ].join("\n")
      : null
  ]
    .filter(Boolean)
    .join("\n");
}

function composeContractAnalysisTerms(
  quote: QuoteWithRelations,
  lawbotAnalysis?: Awaited<ReturnType<typeof getLawbotCaseAnalysis>>
) {
  const internalTerms = buildContractAnalysisTerms(quote);
  const lawbotTerms = buildLawbotAnalysisDraft(lawbotAnalysis ?? { status: "disabled", message: "" });

  return [internalTerms, lawbotTerms].filter(Boolean).join("\n\n");
}

function mergeEditableSpecialTerms(
  manualTerms: string | null | undefined,
  analysisTerms: string
) {
  const cleanedManualTerms = manualTerms
    ?.split("\n\n[자동 분석 참고]\n\n")[0]
    ?.trim();
  const cleanedAnalysisTerms = analysisTerms.trim();

  if (cleanedManualTerms && cleanedAnalysisTerms) {
    return [cleanedManualTerms, "[자동 분석 참고]", cleanedAnalysisTerms].join("\n\n");
  }

  return cleanedManualTerms || cleanedAnalysisTerms || null;
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

function serializeInquiryForQuote(inquiry: InquiryRecord): QuoteWorkspace["inquiry"] {
  return {
    id: inquiry.id,
    title: inquiry.title,
    description: inquiry.description,
    inquiryType: inquiry.inquiryType,
    urgencyLevel: inquiry.urgencyLevel,
    preferredLanguage: inquiry.preferredLanguage,
    contactName: inquiry.contactName,
    organizationName: inquiry.organizationName,
    email: inquiry.email,
    phone: inquiry.phone,
    classificationReason: inquiry.classificationReason,
    serviceTags: parseStringArray(inquiry.serviceTags),
    hasPreparedDocuments: inquiry.hasPreparedDocuments,
    needsTranslation: inquiry.needsTranslation,
    isCorporateRequest: inquiry.isCorporateRequest,
    consultationRequired: inquiry.consultationRequired,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString()
  };
}

function suggestInitialOptionLegacyIds(inquiry: QuoteInquirySnapshot, options: PricingOptionMaster[]) {
  const available = new Set(options.filter((option) => option.isActive).map((option) => option.legacyId));
  const selected = new Set<string>();

  if (inquiry.isCorporateRequest && available.has("multi")) {
    selected.add("multi");
  }

  if ((inquiry.needsTranslation || !inquiry.hasPreparedDocuments) && available.has("docs")) {
    selected.add("docs");
  }

  if (available.has("vat")) {
    selected.add("vat");
  }

  return Array.from(selected);
}

const quoteStatusToInquiryStatus: Record<QuoteStatus, InquiryStatus> = {
  DRAFT: "QUOTE_DRAFTED",
  READY_TO_SEND: "QUOTE_PENDING",
  SENT: "QUOTE_SENT",
  ACCEPTED: "WON",
  REJECTED: "ON_HOLD",
  EXPIRED: "ON_HOLD"
};

const quoteTransitionMap: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["DRAFT", "READY_TO_SEND", "SENT", "REJECTED", "EXPIRED"],
  READY_TO_SEND: ["READY_TO_SEND", "DRAFT", "SENT", "REJECTED", "EXPIRED"],
  SENT: ["SENT", "READY_TO_SEND", "ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: ["ACCEPTED"],
  REJECTED: ["REJECTED", "READY_TO_SEND", "SENT"],
  EXPIRED: ["EXPIRED", "READY_TO_SEND", "SENT"]
};

function buildPaymentSummaryText(
  paymentPlans: Array<{
    stageKind: PaymentStageKind;
    percentage: number;
    dueText: string;
    amountMin: number;
    amountMax: number;
  }>
) {
  if (paymentPlans.length === 0) {
    return "수임 구조 미설정";
  }

  return paymentPlans
    .map(
      (plan) =>
        `${toStageKindLabel(plan.stageKind)} ${plan.percentage}% - ${plan.dueText} (${formatCurrency(plan.amountMin)} ~ ${formatCurrency(plan.amountMax)})`
    )
    .join("\n");
}

function toContractDraftSnapshot(contractDraft: QuoteWithRelations["contractDraft"]) {
  if (!contractDraft) return null;

  return {
    id: contractDraft.id,
    status: contractDraft.status,
    title: contractDraft.title,
    bodyText: contractDraft.bodyText,
    paymentSummary: contractDraft.paymentSummary,
    scopeText: contractDraft.scopeText,
    successFeeRestricted: contractDraft.successFeeRestricted,
    specialTerms: contractDraft.specialTerms,
    updatedAt: contractDraft.updatedAt.toISOString()
  };
}

type QuoteLineItemRecord = QuoteWithRelations["lineItems"][number];
type QuoteAdjustmentRecord = QuoteWithRelations["adjustments"][number];
type QuotePaymentPlanRecord = QuoteWithRelations["paymentPlans"][number];
type QuoteComputedLineItem = QuoteComputationResult["lineItems"][number];
type QuoteComputedAdjustment = QuoteComputationResult["adjustments"][number];
type QuoteComputedPaymentPlan = QuoteComputationResult["paymentPlans"][number];
type ServiceTypeRecord = Awaited<ReturnType<typeof prisma.serviceType.findMany>>[number];
type PricingOptionRecord = Awaited<ReturnType<typeof prisma.pricingOption.findMany>>[number];
type PricingRuleRecord = Awaited<ReturnType<typeof prisma.pricingRule.findMany>>[number];
type ManualQuoteLineInput = {
  id: string;
  label: string;
  description?: string | null;
  amountMin: number;
  amountMax: number;
  sortOrder: number;
};
type ManualQuoteAdjustmentInput = {
  id: string;
  label: string;
  description?: string | null;
  computedMin: number;
  computedMax: number;
  sortOrder: number;
};
type ManualQuotePaymentPlanInput = {
  id: string;
  percentage: number;
  dueText: string;
  sortOrder: number;
  stageKind: PaymentStageKind;
};

function serializeQuote(quote: QuoteWithRelations) {
  const sortedLineItems = quote.lineItems.sort(
    (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
  );
  const sortedAdjustments = quote.adjustments.sort(
    (left: QuoteAdjustmentRecord, right: QuoteAdjustmentRecord) => left.sortOrder - right.sortOrder
  );
  const sortedPaymentPlans = quote.paymentPlans.sort(
    (left: QuotePaymentPlanRecord, right: QuotePaymentPlanRecord) => left.sortOrder - right.sortOrder
  );
  const paymentSummary = buildPaymentSummaryText(sortedPaymentPlans);
  const messageInput = {
    contactName: quote.inquiry.contactName,
    inquiryType: quote.inquiry.inquiryType,
    totalMin: quote.totalMin,
    totalMax: quote.totalMax,
    paymentSummary,
    caseNumber: quote.caseRecord?.caseNumber
  };

  return {
    id: quote.id,
    status: quote.status,
    selectedServiceLegacyIds: parseStringArray(quote.selectedServiceLegacyIds),
    selectedOptionLegacyIds: parseStringArray(quote.selectedOptionLegacyIds),
    urgencyRuleCode: quote.urgencyRuleCode,
    consultRuleCode: quote.consultRuleCode,
    paymentRuleCode: quote.paymentRuleCode,
    rangeMode: quote.rangeMode,
    serviceBaseMin: quote.serviceBaseMin,
    serviceBaseMax: quote.serviceBaseMax,
    subtotalMin: quote.subtotalMin,
    subtotalMax: quote.subtotalMax,
    vatAmountMin: quote.vatAmountMin,
    vatAmountMax: quote.vatAmountMax,
    totalMin: quote.totalMin,
    totalMax: quote.totalMax,
    consultFee: quote.consultFee,
    successFeeRestricted: quote.successFeeRestricted,
    draftNotes: quote.draftNotes,
    calculationSummary: quote.calculationSummary,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    lineItems: sortedLineItems
      .map((line: QuoteLineItemRecord) => ({
        id: line.id,
        kind: line.kind,
        label: line.label,
        description: line.description,
        amountMin: line.amountMin,
        amountMax: line.amountMax,
        sortOrder: line.sortOrder,
        serviceTypeId: line.serviceTypeId,
        isManual: line.isManual
      })),
    adjustments: sortedAdjustments
      .map((adjustment: QuoteAdjustmentRecord) => ({
        id: adjustment.id,
        label: adjustment.label,
        description: adjustment.description,
        optionType: adjustment.optionType,
        flatAmount: adjustment.flatAmount,
        percentRate: adjustment.percentRate,
        computedMin: adjustment.computedMin,
        computedMax: adjustment.computedMax,
        isVat: adjustment.isVat,
        sortOrder: adjustment.sortOrder,
        pricingOptionId: adjustment.pricingOptionId,
        isManual: adjustment.isManual
      })),
    paymentPlans: sortedPaymentPlans
      .map((plan: QuotePaymentPlanRecord) => ({
        id: plan.id,
        stageKind: plan.stageKind,
        percentage: plan.percentage,
        dueText: plan.dueText,
        amountMin: plan.amountMin,
        amountMax: plan.amountMax,
        sortOrder: plan.sortOrder
      })),
    contractDraft: toContractDraftSnapshot(quote.contractDraft),
    caseRecord: quote.caseRecord
      ? {
          id: quote.caseRecord.id,
          caseNumber: quote.caseRecord.caseNumber,
          currentStage: quote.caseRecord.currentStage,
          dueDate: quote.caseRecord.dueDate ? quote.caseRecord.dueDate.toISOString() : null,
          internalMemo: quote.caseRecord.internalMemo,
          updatedAt: quote.caseRecord.updatedAt.toISOString()
        }
      : null,
    messageDrafts: {
      quoteSendKo: buildQuoteSendDraftKo(messageInput),
      quoteSendEn: buildQuoteSendDraftEn(messageInput),
      acceptedKo: buildAcceptedNoticeDraftKo(messageInput),
      acceptedEn: buildAcceptedNoticeDraftEn(messageInput)
    }
  } satisfies QuoteSummarySnapshot;
}

async function loadQuoteMasters() {
  const [serviceTypes, pricingOptions, pricingRules] = await Promise.all([
    prisma.serviceType.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { minPrice: "asc" }] }),
    prisma.pricingOption.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.pricingRule.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } })
  ]);

  return {
    serviceTypes: serviceTypes.map<ServiceTypeMaster>((serviceType: ServiceTypeRecord) => ({
      id: serviceType.id,
      legacyId: serviceType.legacyId,
      name: serviceType.name,
      category: serviceType.category,
      minPrice: serviceType.minPrice,
      maxPrice: serviceType.maxPrice,
      isAppeal: serviceType.isAppeal,
      isActive: serviceType.isActive
    })),
    pricingOptions: pricingOptions.map<PricingOptionMaster>((option: PricingOptionRecord) => ({
      id: option.id,
      legacyId: option.legacyId,
      name: option.name,
      description: option.description,
      optionType: option.optionType,
      flatAmount: option.flatAmount,
      percentRate: option.percentRate,
      unitLabel: option.unitLabel,
      isVat: option.isVat,
      isActive: option.isActive
    })),
    pricingRules: pricingRules.map<PricingRuleMaster>((rule: PricingRuleRecord) => ({
      id: rule.id,
      code: rule.code,
      ruleType: rule.ruleType,
      label: rule.label,
      description: rule.description,
      numericValue: rule.numericValue,
      percentValue: rule.percentValue,
      jsonValue: rule.jsonValue,
      isDefault: rule.isDefault,
      isActive: rule.isActive
    }))
  };
}

function toQuoteComputationInput(
  inquiry: QuoteInquirySnapshot,
  masters: Awaited<ReturnType<typeof loadQuoteMasters>>,
  input: {
    selectedServiceLegacyIds?: string[];
    selectedOptionLegacyIds?: string[];
    urgencyRuleCode?: string;
    consultRuleCode?: string;
    paymentRuleCode?: string;
    rangeMode?: boolean;
    stageOverrides?: Partial<Record<PaymentStageKind, { percentage?: number; dueText?: string }>>;
    draftNotes?: string | null;
  }
) {
  return {
    inquiry,
    masters,
    selectedServiceLegacyIds:
      input.selectedServiceLegacyIds ??
      suggestServiceLegacyIds(inquiry, masters.serviceTypes),
    selectedOptionLegacyIds: input.selectedOptionLegacyIds ?? [],
    urgencyRuleCode:
      input.urgencyRuleCode ??
      mapUrgencyLevelToRuleCode(inquiry.urgencyLevel) ??
      selectDefaultRuleCode(masters.pricingRules, "URGENCY", "URGENCY_STANDARD"),
    consultRuleCode:
      input.consultRuleCode ??
      selectDefaultRuleCode(masters.pricingRules, "CONSULT", "CONSULT_NONE"),
    paymentRuleCode:
      input.paymentRuleCode ??
      selectDefaultRuleCode(masters.pricingRules, "PAYMENT", "PAYMENT_STANDARD"),
    rangeMode: input.rangeMode ?? true,
    stageOverrides: input.stageOverrides,
    draftNotes: input.draftNotes
  };
}

async function persistQuoteComputation(
  inquiryId: string,
  computation: QuoteComputationResult,
  input: {
    quoteId?: string;
    status?: QuoteStatus;
    draftNotes?: string | null;
  } = {}
) {
  const payload = {
    status: input.status ?? "DRAFT",
    selectedServiceLegacyIds: JSON.stringify(computation.selectedServiceLegacyIds),
    selectedOptionLegacyIds: JSON.stringify(computation.selectedOptionLegacyIds),
    urgencyRuleCode: computation.urgencyRuleCode,
    consultRuleCode: computation.consultRuleCode,
    paymentRuleCode: computation.paymentRuleCode,
    rangeMode: computation.rangeMode,
    serviceBaseMin: computation.serviceBaseMin,
    serviceBaseMax: computation.serviceBaseMax,
    subtotalMin: computation.subtotalMin,
    subtotalMax: computation.subtotalMax,
    vatAmountMin: computation.vatAmountMin,
    vatAmountMax: computation.vatAmountMax,
    totalMin: computation.totalMin,
    totalMax: computation.totalMax,
    consultFee: computation.consultFee,
    successFeeRestricted: computation.successFeeRestricted,
    draftNotes: input.draftNotes ?? null,
    calculationSummary: computation.calculationSummary
  };

  if (input.quoteId) {
    await prisma.$transaction([
      prisma.quoteLineItem.deleteMany({ where: { quoteId: input.quoteId } }),
      prisma.quoteAdjustment.deleteMany({ where: { quoteId: input.quoteId } }),
      prisma.paymentPlan.deleteMany({ where: { quoteId: input.quoteId } }),
      prisma.quote.update({
        where: { id: input.quoteId },
        data: {
          ...payload,
          lineItems: {
            create: computation.lineItems.map((line: QuoteComputedLineItem) => ({
              serviceTypeId: line.serviceTypeId,
              kind: line.kind,
              label: line.label,
              description: line.description,
              amountMin: line.amountMin,
              amountMax: line.amountMax,
              sortOrder: line.sortOrder,
              isManual: line.isManual ?? false
            }))
          },
          adjustments: {
            create: computation.adjustments.map((adjustment: QuoteComputedAdjustment) => ({
              pricingOptionId: adjustment.pricingOptionId,
              label: adjustment.label,
              description: adjustment.description,
              optionType: adjustment.optionType,
              flatAmount: adjustment.flatAmount,
              percentRate: adjustment.percentRate,
              computedMin: adjustment.computedMin,
              computedMax: adjustment.computedMax,
              isVat: adjustment.isVat,
              sortOrder: adjustment.sortOrder,
              isManual: adjustment.isManual ?? false
            }))
          },
          paymentPlans: {
            create: computation.paymentPlans.map((plan: QuoteComputedPaymentPlan) => ({
              stageKind: plan.stageKind,
              percentage: plan.percentage,
              dueText: plan.dueText,
              amountMin: plan.amountMin,
              amountMax: plan.amountMax,
              sortOrder: plan.sortOrder
            }))
          }
        }
      })
    ]);

    return getQuoteByIdOrThrow(input.quoteId);
  }

  const quote = await prisma.quote.create({
    data: {
      inquiryId,
      ...payload,
      lineItems: {
        create: computation.lineItems.map((line: QuoteComputedLineItem) => ({
          serviceTypeId: line.serviceTypeId,
          kind: line.kind,
          label: line.label,
          description: line.description,
          amountMin: line.amountMin,
          amountMax: line.amountMax,
          sortOrder: line.sortOrder,
          isManual: line.isManual ?? false
        }))
      },
      adjustments: {
        create: computation.adjustments.map((adjustment: QuoteComputedAdjustment) => ({
          pricingOptionId: adjustment.pricingOptionId,
          label: adjustment.label,
          description: adjustment.description,
          optionType: adjustment.optionType,
          flatAmount: adjustment.flatAmount,
          percentRate: adjustment.percentRate,
          computedMin: adjustment.computedMin,
          computedMax: adjustment.computedMax,
          isVat: adjustment.isVat,
          sortOrder: adjustment.sortOrder,
          isManual: adjustment.isManual ?? false
        }))
      },
      paymentPlans: {
        create: computation.paymentPlans.map((plan: QuoteComputedPaymentPlan) => ({
          stageKind: plan.stageKind,
          percentage: plan.percentage,
          dueText: plan.dueText,
          amountMin: plan.amountMin,
          amountMax: plan.amountMax,
          sortOrder: plan.sortOrder
        }))
      }
    },
    include: {
      inquiry: true,
      lineItems: true,
      adjustments: true,
      paymentPlans: true,
      contractDraft: true,
      caseRecord: true
    }
  });

  return quote;
}

async function getQuoteByIdOrThrow(quoteId: string) {
  return prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      inquiry: true,
      lineItems: true,
      adjustments: true,
      paymentPlans: true,
      contractDraft: true,
      caseRecord: true
    }
  });
}

export async function getQuoteWorkspaceForInquiry(inquiryId: string): Promise<QuoteWorkspace> {
  const [inquiry, masters, latestQuote] = await Promise.all([
    prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId } }),
    loadQuoteMasters(),
    prisma.quote.findFirst({
      where: { inquiryId },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        inquiry: true,
        lineItems: true,
        adjustments: true,
        paymentPlans: true,
        contractDraft: true,
        caseRecord: true
      }
    })
  ]);

  const inquirySnapshot = serializeInquiryForQuote(inquiry);
  const suggestedServiceLegacyIds = suggestServiceLegacyIds(inquirySnapshot, masters.serviceTypes);
  const caseAnalysis = analyzeInquiryCase(inquiry);
  const lawbotAnalysis = await getLawbotCaseAnalysis(inquiry);

  return {
    inquiry: inquirySnapshot,
    caseAnalysis,
    lawbotAnalysis,
    masters: {
      serviceTypes: masters.serviceTypes,
      pricingOptions: masters.pricingOptions,
      urgencyRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "URGENCY"),
      consultRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "CONSULT"),
      paymentRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "PAYMENT"),
      policyRules: masters.pricingRules.filter((rule: PricingRuleMaster) => rule.ruleType === "POLICY")
    },
    suggestedServiceLegacyIds,
    suggestedUrgencyRuleCode: mapUrgencyLevelToRuleCode(inquiry.urgencyLevel),
    latestQuote: latestQuote ? serializeQuote(latestQuote) : null
  };
}

export async function createQuoteDraftForInquiry(inquiryId: string) {
  const inquiry = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId } });
  const masters = await loadQuoteMasters();
  const inquirySnapshot = serializeInquiryForQuote(inquiry);
  const selectedServiceLegacyIds = suggestServiceLegacyIds(inquirySnapshot, masters.serviceTypes);
  const selectedOptionLegacyIds = suggestInitialOptionLegacyIds(inquirySnapshot, masters.pricingOptions);

  const computation = computeQuoteDraft(
    toQuoteComputationInput(inquirySnapshot, masters, {
      selectedServiceLegacyIds,
      selectedOptionLegacyIds,
      urgencyRuleCode: mapUrgencyLevelToRuleCode(inquiry.urgencyLevel),
      consultRuleCode: selectDefaultRuleCode(masters.pricingRules, "CONSULT", "CONSULT_NONE"),
      paymentRuleCode: selectDefaultRuleCode(masters.pricingRules, "PAYMENT", "PAYMENT_STANDARD"),
      rangeMode: true
    })
  );

  const quote = await persistQuoteComputation(inquiryId, computation);
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "QUOTE_DRAFTED" }
  });
  return serializeQuote(quote);
}

export async function recalculateQuoteDraft(
  quoteId: string,
  input: {
    selectedServiceLegacyIds: string[];
    selectedOptionLegacyIds: string[];
    urgencyRuleCode: string;
    consultRuleCode: string;
    paymentRuleCode: string;
    rangeMode: boolean;
    stageOverrides: Partial<Record<PaymentStageKind, { percentage?: number; dueText?: string }>>;
    draftNotes?: string | null;
  }
) {
  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { inquiry: true }
  });
  const masters = await loadQuoteMasters();
  const inquirySnapshot = serializeInquiryForQuote(quote.inquiry);

  const computation = computeQuoteDraft(
    toQuoteComputationInput(inquirySnapshot, masters, {
      ...input,
      draftNotes: input.draftNotes
    })
  );

  const updated = await persistQuoteComputation(quote.inquiryId, computation, {
    quoteId,
    status: quote.status,
    draftNotes: input.draftNotes
  });

  return serializeQuote(updated);
}

export async function saveQuoteManualEdits(
  quoteId: string,
  input: {
    draftNotes?: string | null;
    specialTerms?: string | null;
    lineItems: Array<{
      id: string;
      label: string;
      description?: string | null;
      amountMin: number;
      amountMax: number;
      sortOrder: number;
    }>;
    adjustments: Array<{
      id: string;
      label: string;
      description?: string | null;
      computedMin: number;
      computedMax: number;
      sortOrder: number;
    }>;
    paymentPlans: Array<{
      id: string;
      percentage: number;
      dueText: string;
      sortOrder: number;
      stageKind: PaymentStageKind;
    }>;
  }
) {
  await getQuoteByIdOrThrow(quoteId);

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: { draftNotes: input.draftNotes ?? null }
    }),
    ...input.lineItems.map((line: ManualQuoteLineInput) =>
      prisma.quoteLineItem.update({
        where: { id: line.id },
        data: {
          label: line.label,
          description: line.description ?? null,
          amountMin: line.amountMin,
          amountMax: line.amountMax,
          sortOrder: line.sortOrder,
          isManual: true
        }
      })
    ),
    ...input.adjustments.map((adjustment: ManualQuoteAdjustmentInput) =>
      prisma.quoteAdjustment.update({
        where: { id: adjustment.id },
        data: {
          label: adjustment.label,
          description: adjustment.description ?? null,
          computedMin: adjustment.computedMin,
          computedMax: adjustment.computedMax,
          sortOrder: adjustment.sortOrder,
          isManual: true
        }
      })
    ),
    ...input.paymentPlans.map((plan: ManualQuotePaymentPlanInput) =>
      prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          percentage: plan.percentage,
          dueText: plan.dueText,
          sortOrder: plan.sortOrder
        }
      })
    )
  ]);

  const refreshed = await getQuoteByIdOrThrow(quoteId);
  const lineItems = refreshed.lineItems.sort(
    (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
  );
  const adjustments = refreshed.adjustments.sort(
    (left: QuoteAdjustmentRecord, right: QuoteAdjustmentRecord) => left.sortOrder - right.sortOrder
  );
  const serviceBaseMin = lineItems
    .filter((line: QuoteLineItemRecord) => line.kind === "SERVICE")
    .reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMin, 0);
  const serviceBaseMax = lineItems
    .filter((line: QuoteLineItemRecord) => line.kind === "SERVICE")
    .reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMax, 0);
  const subtotalMin =
    lineItems.reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMin, 0) +
    adjustments
      .filter((adjustment: QuoteAdjustmentRecord) => !adjustment.isVat)
      .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMin, 0);
  const subtotalMax =
    lineItems.reduce((sum: number, line: QuoteLineItemRecord) => sum + line.amountMax, 0) +
    adjustments
      .filter((adjustment: QuoteAdjustmentRecord) => !adjustment.isVat)
      .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMax, 0);
  const vatAmountMin = adjustments
    .filter((adjustment: QuoteAdjustmentRecord) => adjustment.isVat)
    .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMin, 0);
  const vatAmountMax = adjustments
    .filter((adjustment: QuoteAdjustmentRecord) => adjustment.isVat)
    .reduce((sum: number, adjustment: QuoteAdjustmentRecord) => sum + adjustment.computedMax, 0);
  const totalMin = subtotalMin + vatAmountMin;
  const totalMax = subtotalMax + vatAmountMax;

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        serviceBaseMin,
        serviceBaseMax,
        subtotalMin,
        subtotalMax,
        vatAmountMin,
        vatAmountMax,
        totalMin,
        totalMax,
        calculationSummary: buildManualSummary({
          lineItems: lineItems.map((line: QuoteLineItemRecord) => ({
            label: line.label,
            amountMin: line.amountMin,
            amountMax: line.amountMax
          })),
          adjustments: adjustments.map((adjustment: QuoteAdjustmentRecord) => ({
            label: adjustment.label,
            computedMin: adjustment.computedMin,
            computedMax: adjustment.computedMax,
            isVat: adjustment.isVat
          })),
          consultFee: refreshed.consultFee,
          successFeeRestricted: refreshed.successFeeRestricted
        })
      }
    }),
    ...refreshed.paymentPlans.map((plan: QuotePaymentPlanRecord) => {
      const incoming = input.paymentPlans.find((entry) => entry.id === plan.id);
      const percentage = incoming?.percentage ?? plan.percentage;

      return prisma.paymentPlan.update({
        where: { id: plan.id },
        data: {
          percentage,
          amountMin: Math.round(totalMin * (percentage / 100)),
          amountMax: Math.round(totalMax * (percentage / 100))
        }
      });
    })
  ]);

  if (input.specialTerms !== undefined && refreshed.contractDraft) {
    await prisma.contractDraft.update({
      where: { id: refreshed.contractDraft.id },
      data: {
        specialTerms: input.specialTerms?.trim() ? input.specialTerms.trim() : null
      }
    });
  }

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

async function loadQuoteWithRelations(db: DbClient, quoteId: string) {
  return db.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: {
      inquiry: true,
      lineItems: true,
      adjustments: true,
      paymentPlans: true,
      contractDraft: true,
      caseRecord: true
    }
  });
}

function assertQuoteTransition(currentStatus: QuoteStatus, nextStatus: QuoteStatus) {
  const allowed = quoteTransitionMap[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`견적 상태를 ${currentStatus}에서 ${nextStatus}(으)로 변경할 수 없습니다.`);
  }
}

async function upsertContractDraftFromQuote(db: DbClient, quote: QuoteWithRelations) {
  const warning = quote.successFeeRestricted
    ? ["행정심판/이의신청 계열 업무는 성공보수를 포함하지 않도록 제한합니다."]
    : [];
  const analysisTerms = composeContractAnalysisTerms(quote);
  const mergedSpecialTerms = mergeEditableSpecialTerms(quote.contractDraft?.specialTerms, analysisTerms);
  const draft = buildContractDraftText({
    inquiry: serializeInquiryForQuote(quote.inquiry),
    lineItems: quote.lineItems.sort(
      (left: QuoteLineItemRecord, right: QuoteLineItemRecord) => left.sortOrder - right.sortOrder
    ),
    paymentPlans: quote.paymentPlans.sort(
      (left: QuotePaymentPlanRecord, right: QuotePaymentPlanRecord) => left.sortOrder - right.sortOrder
    ),
    totalMin: quote.totalMin,
    totalMax: quote.totalMax,
    vatAmountMin: quote.vatAmountMin,
    vatAmountMax: quote.vatAmountMax,
    consultFee: quote.consultFee,
    successFeeRestricted: quote.successFeeRestricted,
    warnings: warning,
    draftNotes: quote.draftNotes
  });

  if (quote.contractDraft) {
    return db.contractDraft.update({
      where: { id: quote.contractDraft.id },
      data: {
        title: draft.title,
        bodyText: draft.bodyText,
        scopeText: draft.scopeText,
        paymentSummary: draft.paymentSummary,
        specialTerms: mergedSpecialTerms,
        successFeeRestricted: quote.successFeeRestricted
      }
    });
  }

  return db.contractDraft.create({
    data: {
      inquiryId: quote.inquiryId,
      quoteId: quote.id,
      title: draft.title,
      bodyText: draft.bodyText,
      scopeText: draft.scopeText,
      paymentSummary: draft.paymentSummary,
      specialTerms: mergedSpecialTerms,
      successFeeRestricted: quote.successFeeRestricted
    }
  });
}

async function ensureCaseRecordForQuote(
  db: DbClient,
  quote: QuoteWithRelations,
  input: {
    contractDraftId?: string | null;
    currentStage: CaseStage;
    dueDate?: Date | null;
    internalMemo?: string | null;
  }
) {
  if (quote.caseRecord) {
    return db.caseRecord.update({
      where: { id: quote.caseRecord.id },
      data: {
        contractDraftId: input.contractDraftId ?? quote.caseRecord.contractDraftId,
        currentStage: input.currentStage,
        dueDate: input.dueDate ?? quote.caseRecord.dueDate,
        internalMemo: input.internalMemo ?? quote.caseRecord.internalMemo
      }
    });
  }

  return db.caseRecord.create({
    data: {
      caseNumber: await generateCaseNumber(),
      inquiryId: quote.inquiryId,
      quoteId: quote.id,
      contractDraftId: input.contractDraftId ?? null,
      currentStage: input.currentStage,
      dueDate: input.dueDate ?? quote.inquiry.dueDate,
      internalMemo: input.internalMemo ?? quote.draftNotes
    }
  });
}

async function syncQuoteAnalysisSnapshot(quoteId: string) {
  const quote = await getQuoteByIdOrThrow(quoteId);
  const analysis = analyzeInquiryCase(quote.inquiry);
  const lawbotAnalysis = await getLawbotCaseAnalysis(quote.inquiry);
  const caseStage = quote.caseRecord?.currentStage ? String(quote.caseRecord.currentStage) : null;

  try {
    await syncCaseAnalysisToNotion({
      inquiryId: quote.inquiryId,
      contactName: quote.inquiry.contactName,
      contactPhone: quote.inquiry.phone,
      inquiryTitle: quote.inquiry.title,
      inquiryType: quote.inquiry.inquiryType as InquiryType,
      inquiryStatus: quote.inquiry.status as InquiryStatus,
      urgencyLevel: quote.inquiry.urgencyLevel as UrgencyLevel,
      qualificationScore: quote.inquiry.qualificationScore,
      generatedSummary: quote.inquiry.generatedSummary,
      recommendedNextStep: quote.inquiry.recommendedNextStep,
      classificationReason: quote.inquiry.classificationReason,
      recommendedDocuments: parseStringArray(quote.inquiry.precheckRecommendedDocs),
      serviceTags: parseStringArray(quote.inquiry.serviceTags),
      createdAt: quote.inquiry.createdAt.toISOString(),
      targetAgency: quote.inquiry.targetAgency,
      organizationName: quote.inquiry.organizationName,
      analysis,
      contractTitle: quote.contractDraft?.title,
      draftNotes: quote.draftNotes,
      caseNumber: quote.caseRecord?.caseNumber,
      dueDate: quote.caseRecord?.dueDate?.toISOString() ?? quote.inquiry.dueDate?.toISOString() ?? null,
      compensationStatus:
        quote.status === "ACCEPTED"
          ? "수임 완료"
          : quote.status === "SENT" || quote.status === "READY_TO_SEND"
            ? "견적 단계"
            : quote.status === "REJECTED" || quote.status === "EXPIRED"
              ? "보류"
              : "검토 중",
      lawbotAnalysis,
      workflowStatus:
        caseStage === "CLOSED" || caseStage === "COMPLETED"
          ? "완료"
          : caseStage
            ? "진행 중"
            : "시작 전"
    });
  } catch (error) {
    console.error("Failed to sync quote analysis to Notion", error);
  }
}

async function syncContractDraftAnalysisTerms(quoteId: string) {
  const quote = await getQuoteByIdOrThrow(quoteId);

  if (!quote.contractDraft) {
    return;
  }

  const lawbotAnalysis = await getLawbotCaseAnalysis(quote.inquiry);
  const specialTerms = composeContractAnalysisTerms(quote, lawbotAnalysis);

  await prisma.contractDraft.update({
    where: { id: quote.contractDraft.id },
    data: {
      specialTerms: mergeEditableSpecialTerms(quote.contractDraft.specialTerms, specialTerms)
    }
  });
}

export async function transitionQuoteStatus(
  quoteId: string,
  input: {
    status: QuoteStatus;
    caseDueDate?: Date;
    caseInternalMemo?: string;
  }
) {
  const current = await getQuoteByIdOrThrow(quoteId);
  assertQuoteTransition(current.status, input.status);

  await prisma.$transaction(async (tx) => {
    const db = asDbClient(tx);
    const nextInquiryStatus = quoteStatusToInquiryStatus[input.status as QuoteStatus];

    await db.quote.update({
      where: { id: quoteId },
      data: { status: input.status }
    });

    await db.inquiry.update({
      where: { id: current.inquiryId },
      data: { status: nextInquiryStatus }
    });

    const refreshed = await loadQuoteWithRelations(db, quoteId);

    if (input.status === "ACCEPTED") {
      const contractDraft = await upsertContractDraftFromQuote(db, refreshed);
      await ensureCaseRecordForQuote(db, refreshed, {
        contractDraftId: contractDraft.id,
        currentStage: "CONTRACT_PREPARATION",
        dueDate: input.caseDueDate,
        internalMemo: input.caseInternalMemo
      });
      return;
    }

    if (input.status === "REJECTED" || input.status === "EXPIRED") {
      if (refreshed.caseRecord) {
        await ensureCaseRecordForQuote(db, refreshed, {
          currentStage: "ON_HOLD",
          dueDate: input.caseDueDate,
          internalMemo: input.caseInternalMemo
        });
      }
      return;
    }

    if (refreshed.caseRecord && (input.caseDueDate || input.caseInternalMemo)) {
      await ensureCaseRecordForQuote(db, refreshed, {
        currentStage: refreshed.caseRecord.currentStage,
        dueDate: input.caseDueDate,
        internalMemo: input.caseInternalMemo
      });
    }
  });

  if (input.status === "ACCEPTED") {
    await syncContractDraftAnalysisTerms(quoteId);
    await syncQuoteAnalysisSnapshot(quoteId);
  }

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

export async function createContractDraftFromQuote(quoteId: string) {
  await prisma.$transaction(async (tx) => {
    const db = asDbClient(tx);
    const quote = await loadQuoteWithRelations(db, quoteId);
    const contractDraft = await upsertContractDraftFromQuote(db, quote);
    const nextStatus: QuoteStatus = quote.status === "DRAFT" ? "READY_TO_SEND" : quote.status;
    const nextInquiryStatus = quoteStatusToInquiryStatus[nextStatus];

    if (quote.status !== nextStatus) {
      await db.quote.update({
        where: { id: quote.id },
        data: { status: nextStatus }
      });
    }

    await db.inquiry.update({
      where: { id: quote.inquiryId },
      data: { status: nextInquiryStatus }
    });

    await ensureCaseRecordForQuote(db, quote, {
      contractDraftId: contractDraft.id,
      currentStage: "CONTRACT_PREPARATION",
      dueDate: quote.caseRecord?.dueDate ?? quote.inquiry.dueDate,
      internalMemo: quote.caseRecord?.internalMemo ?? quote.draftNotes
    });
  });

  await syncContractDraftAnalysisTerms(quoteId);
  await syncQuoteAnalysisSnapshot(quoteId);

  return serializeQuote(await getQuoteByIdOrThrow(quoteId));
}

export async function exportContractDraftDocument(quoteId: string) {
  const quote = await getQuoteByIdOrThrow(quoteId);

  if (!quote.contractDraft) {
    throw new Error("계약 초안이 아직 생성되지 않았습니다.");
  }

  const safeTitle = `${quote.inquiry.contactName}-${quote.inquiry.title}`
    .replace(/[\\/:*?\"<>|]/g, "-")
    .slice(0, 80);

  const content = [
    `# ${quote.contractDraft.title}`,
    "",
    quote.contractDraft.bodyText,
    "",
    "## 업무 범위",
    quote.contractDraft.scopeText,
    "",
    "## 결제 안내",
    quote.contractDraft.paymentSummary,
    "",
    "## 특약 및 사건 분석 참고",
    quote.contractDraft.specialTerms ?? "특약 없음"
  ].join("\n");

  return {
    fileName: `${safeTitle || "contract-draft"}.md`,
    content
  };
}



