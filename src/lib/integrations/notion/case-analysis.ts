import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";
import {
  buildCaseSummary,
  buildMissingDocuments,
  buildNeededDocuments,
  buildNextAction,
} from "@/lib/integrations/notion-case-analysis-helpers";
import { buildLawbotCaseSectionTuples } from "@/lib/integrations/notion-lawbot-sections";
import { inquiryTypeLabels } from "@/types/inquiry";

import {
  buildAdminReferenceUrl,
  buildDateProperty,
  buildRichText,
  buildSharedPageTitle,
  compactProperties,
  getCaseDatabaseId,
  getNotionToken,
  upsertPage,
} from "./client";
import { syncConsultationToNotion } from "./consultation";
import type { SyncCaseAnalysisInput } from "./types";

function mapCaseSuccessLabel(analysis: InquiryCaseAnalysis) {
  if (analysis.strengthLabel === "강함") return "높음";
  if (analysis.strengthLabel === "보통") return "보통";
  if (analysis.strengthLabel === "주의") return "주의";
  return "낮음";
}

function buildLawbotSection(heading: string, body: string) {
  return [
    {
      object: "block",
      type: "heading_2",
      heading_2: { rich_text: buildRichText(heading) },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: buildRichText(body || "원문 명시 없음") },
    },
  ];
}

function buildCaseBlocks(input: SyncCaseAnalysisInput) {
  const sections = [
    ["사건 분석 요약", input.analysis.summary],
    ["사건 강도", `${input.analysis.strengthLabel} (${input.analysis.strengthScore}점)`],
    ["핵심 쟁점", input.analysis.issues.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["유리 요소", input.analysis.favorableFactors.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["불리 요소", input.analysis.riskFactors.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["추가 확인 필요 사실", input.analysis.missingFacts.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["참고 법령", input.analysis.lawReferences.map((item) => `- ${item.title}: ${item.summary}`).join("\n") || "원문 명시 없음"],
    ["판례 검색어", input.analysis.precedentReferences.map((item) => `- ${item.query}`).join("\n") || "원문 명시 없음"],
    ["계약 초안", input.contractTitle ?? "계약 초안 생성 전"],
    ["견적 메모", input.draftNotes?.trim() || "저장된 메모 없음"],
  ] as const;

  const baseBlocks = sections.flatMap(([heading, body]) => [
    {
      object: "block",
      type: "heading_2",
      heading_2: { rich_text: buildRichText(heading) },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: buildRichText(body) },
    },
  ]);

  if (input.lawbotAnalysis?.status !== "available") {
    return baseBlocks;
  }

  const data = input.lawbotAnalysis.data;
  const lawbotSections = buildLawbotCaseSectionTuples(data);

  return [
    ...baseBlocks,
    ...lawbotSections.flatMap(([heading, body]) => buildLawbotSection(heading, body)),
  ];
}

function buildCaseProperties(input: SyncCaseAnalysisInput, consultationPageId: string | null) {
  const referenceUrl = buildAdminReferenceUrl(input.inquiryId);
  const fieldTags = [...new Set([inquiryTypeLabels[input.inquiryType].ko, ...(input.serviceTags ?? [])])];

  return compactProperties({
    이름: { title: buildRichText(buildSharedPageTitle(input.contactName, input.inquiryTitle)) },
    의뢰인명: { rich_text: buildRichText(input.contactName) },
    연락처: input.contactPhone ? { phone_number: input.contactPhone } : undefined,
    "사건 번호": input.caseNumber ? { rich_text: buildRichText(input.caseNumber) } : undefined,
    "사건 요약": { rich_text: buildRichText(buildCaseSummary(input)) },
    다음조치: { rich_text: buildRichText(buildNextAction(input)) },
    "필요 서류": { rich_text: buildRichText(buildNeededDocuments(input)) },
    "현재 부족 서류": { rich_text: buildRichText(buildMissingDocuments(input)) },
    "비고 ": {
      rich_text: buildRichText((input.contractTitle ?? input.draftNotes?.trim() ?? input.classificationReason) || "사건 분석 자동 동기화"),
    },
    참고자료: referenceUrl ? { url: referenceUrl } : undefined,
    분야: fieldTags.length > 0 ? { multi_select: fieldTags.map((name) => ({ name })) } : undefined,
    "업무 유형": { select: { name: inquiryTypeLabels[input.inquiryType].ko } },
    "진행 상태": input.workflowStatus ? { status: { name: input.workflowStatus } } : undefined,
    "성공 가능성": { select: { name: mapCaseSuccessLabel(input.analysis) } },
    관할기관: input.targetAgency ? { rich_text: buildRichText(input.targetAgency) } : undefined,
    "상대방 기관": input.organizationName ? { rich_text: buildRichText(input.organizationName) } : undefined,
    "보수 상태": input.compensationStatus ? { select: { name: input.compensationStatus } } : undefined,
    "상담 원천": consultationPageId ? { relation: [{ id: consultationPageId }] } : undefined,
    수임일: buildDateProperty(new Date().toISOString()),
    "제출 기한": buildDateProperty(input.dueDate),
    완료일: input.workflowStatus === "완료" ? buildDateProperty(new Date().toISOString()) : undefined,
  });
}

export async function syncCaseAnalysisToNotion(input: SyncCaseAnalysisInput) {
  const token = getNotionToken();
  const caseDatabaseId = getCaseDatabaseId();

  if (!token || !caseDatabaseId) {
    return { status: "disabled" as const };
  }

  const referenceUrl = buildAdminReferenceUrl(input.inquiryId);
  const consultationSync =
    input.inquiryStatus && input.urgencyLevel !== undefined && input.qualificationScore !== undefined
      ? await syncConsultationToNotion({
          inquiryId: input.inquiryId,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          inquiryTitle: input.inquiryTitle,
          inquiryType: input.inquiryType,
          inquiryStatus: input.inquiryStatus,
          urgencyLevel: input.urgencyLevel,
          qualificationScore: input.qualificationScore,
          generatedSummary: input.generatedSummary || buildCaseSummary(input),
          recommendedNextStep: input.recommendedNextStep || buildNextAction(input),
          classificationReason: input.classificationReason,
          recommendedDocuments: input.recommendedDocuments,
          serviceTags: input.serviceTags,
          createdAt: input.createdAt,
          dueDate: input.dueDate,
          referenceUrl,
        })
      : { pageId: null };

  return upsertPage({
    databaseId: caseDatabaseId,
    token,
    title: buildSharedPageTitle(input.contactName, input.inquiryTitle),
    fallbackUrl: { propertyName: "참고자료", value: referenceUrl },
    properties: buildCaseProperties(input, consultationSync.pageId),
    children: buildCaseBlocks(input),
  });
}

export async function syncCaseToNotion(_caseId: string) {
  return { synced: false, reason: "case-analysis-sync-only" as const };
}
