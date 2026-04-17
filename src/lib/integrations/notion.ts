import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-service";
import type { LawbotCaseAnalysisResult } from "@/lib/services/lawbot-case-analysis-service";
import {
  inquiryTypeLabels,
  type InquiryStatus,
  type InquiryType,
  type UrgencyLevel,
  urgencyLabels,
} from "@/types/inquiry";

type SyncConsultationInput = {
  inquiryId: string;
  contactName: string;
  contactPhone?: string | null;
  inquiryTitle: string;
  inquiryType: InquiryType;
  inquiryStatus: InquiryStatus;
  urgencyLevel: UrgencyLevel;
  qualificationScore: number;
  generatedSummary: string;
  recommendedNextStep: string;
  classificationReason?: string | null;
  recommendedDocuments?: string[];
  serviceTags?: string[];
  createdAt?: string | null;
  dueDate?: string | null;
  referenceUrl?: string | null;
};

type SyncCaseAnalysisInput = {
  inquiryId: string;
  contactName: string;
  contactPhone?: string | null;
  inquiryTitle: string;
  inquiryType: InquiryType;
  inquiryStatus?: InquiryStatus;
  urgencyLevel?: UrgencyLevel;
  qualificationScore?: number;
  generatedSummary?: string | null;
  recommendedNextStep?: string | null;
  classificationReason?: string | null;
  recommendedDocuments?: string[];
  serviceTags?: string[];
  createdAt?: string | null;
  targetAgency?: string | null;
  organizationName?: string | null;
  analysis: InquiryCaseAnalysis;
  contractTitle?: string | null;
  draftNotes?: string | null;
  caseNumber?: string | null;
  dueDate?: string | null;
  workflowStatus?: "시작 전" | "진행 중" | "완료";
  compensationStatus?: string | null;
  lawbotAnalysis?: LawbotCaseAnalysisResult;
};

export type NotionReferenceMaterial = {
  id: string;
  title: string;
  category: string | null;
  resourceType: string | null;
  summary: string | null;
  source: string | null;
  citationUrl: string | null;
  publishedYear: number | null;
  status: string | null;
  score: number;
};

export type NotionReferenceWebsite = {
  id: string;
  title: string;
  organization: string | null;
  fields: string[];
  description: string | null;
  url: string | null;
  score: number;
};

export type NotionReferenceRecommendations = {
  keywords: string[];
  materials: NotionReferenceMaterial[];
  websites: NotionReferenceWebsite[];
};

const NOTION_VERSION = "2022-06-28";

function isNotionSyncEnabled() {
  return process.env.NOTION_SYNC_ENABLED === "true";
}

function getNotionToken() {
  const token = process.env.NOTION_TOKEN?.trim();
  return isNotionSyncEnabled() && token ? token : null;
}

function getCaseDatabaseId() {
  return process.env.NOTION_CASE_DATABASE_ID?.trim() || null;
}

function getConsultationDatabaseId() {
  return process.env.NOTION_CONSULTATION_DATABASE_ID?.trim() || null;
}

function getReferenceArchiveDatabaseId() {
  return process.env.NOTION_REFERENCE_ARCHIVE_DATABASE_ID?.trim() || null;
}

function getReferenceWebsiteDatabaseId() {
  return process.env.NOTION_REFERENCE_WEBSITE_DATABASE_ID?.trim() || null;
}

async function notionRequest(path: string, init: RequestInit, token: string) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion request failed (${response.status}): ${text}`);
  }

  return response.json();
}

function buildRichText(content: string) {
  return [
    {
      type: "text",
      text: { content: content.slice(0, 1900) },
    },
  ];
}

function buildDateProperty(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return {
    date: {
      start: value.slice(0, 10),
    },
  };
}

function compactProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined));
}

function buildAdminReferenceUrl(inquiryId: string) {
  const appUrl = process.env.ADMIN_APP_URL?.trim();
  if (!appUrl) return null;
  return `${appUrl.replace(/\/$/, "")}/admin/inquiries/${inquiryId}`;
}

function buildSharedPageTitle(contactName: string, inquiryTitle: string) {
  return `${contactName} - ${inquiryTitle}`.slice(0, 120);
}

async function findExistingPageIdByTitle(databaseId: string, title: string, token: string) {
  const payload = (await notionRequest(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "이름",
        title: { equals: title },
      },
      page_size: 1,
    }),
  }, token)) as { results?: Array<{ id: string }> };

  return payload.results?.[0]?.id ?? null;
}

async function findExistingPageIdByUrl(databaseId: string, propertyName: string, value: string, token: string) {
  const payload = (await notionRequest(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: propertyName,
        url: { equals: value },
      },
      page_size: 1,
    }),
  }, token)) as { results?: Array<{ id: string }> };

  return payload.results?.[0]?.id ?? null;
}

async function listChildBlockIds(blockId: string, token: string) {
  const payload = (await notionRequest(`/blocks/${blockId}/children?page_size=100`, {
    method: "GET",
  }, token)) as { results?: Array<{ id: string }> };

  return payload.results?.map((result) => result.id) ?? [];
}

async function archiveChildBlocks(blockId: string, token: string) {
  const childIds = await listChildBlockIds(blockId, token);

  if (childIds.length === 0) {
    return;
  }

  await Promise.all(
    childIds.map((childId) =>
      notionRequest(`/blocks/${childId}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      }, token)
    )
  );
}

function mapConsultationStatus(status: InquiryStatus) {
  if (status === "NEW") return "신규";
  if (status === "ON_HOLD") return "자료요청";
  if (status === "WON" || status === "CLOSED" || status === "QUOTE_SENT") return "종결";
  return "검토중";
}

function mapQualificationLabel(score: number) {
  if (score >= 75) return "높음";
  if (score >= 50) return "보통";
  return "낮음";
}

function mapConversionLabel(status: InquiryStatus) {
  return status === "WON" || status === "CLOSED" ? "수임" : "미전환";
}

function mapCaseSuccessLabel(analysis: InquiryCaseAnalysis) {
  if (analysis.strengthLabel === "강함") return "높음";
  if (analysis.strengthLabel === "보통") return "보통";
  if (analysis.strengthLabel === "주의") return "주의";
  return "낮음";
}

function buildConsultationBlocks(input: SyncConsultationInput) {
  const sections = [
    ["상담 요약", input.generatedSummary || "원문 명시 없음"],
    ["다음 액션", input.recommendedNextStep || "원문 명시 없음"],
    ["필요한 서류", input.recommendedDocuments?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["진단 근거", input.classificationReason || "원문 명시 없음"],
    ["상담 주제 태그", input.serviceTags?.join(", ") || "원문 명시 없음"],
  ] as const;

  return sections.flatMap(([heading, body]) => [
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
}

function buildConsultationProperties(input: SyncConsultationInput) {
  const referenceUrl = input.referenceUrl ?? buildAdminReferenceUrl(input.inquiryId);
  const topicValues = [...new Set([inquiryTypeLabels[input.inquiryType].ko, ...(input.serviceTags ?? [])])];

  return compactProperties({
    이름: { title: buildRichText(buildSharedPageTitle(input.contactName, input.inquiryTitle)) },
    고객명: { rich_text: buildRichText(input.contactName) },
    연락처: input.contactPhone ? { phone_number: input.contactPhone } : undefined,
    상담채널: { select: { name: "웹접수" } },
    상담주제: topicValues.length > 0 ? { multi_select: topicValues.map((name) => ({ name })) } : undefined,
    상담요약: { rich_text: buildRichText(input.generatedSummary || "원문 명시 없음") },
    "필요한 서류": { rich_text: buildRichText(input.recommendedDocuments?.join(", ") || "원문 명시 없음") },
    "참고 자료 ": referenceUrl ? { url: referenceUrl } : undefined,
    "다음 액션": { rich_text: buildRichText(input.recommendedNextStep || "원문 명시 없음") },
    상태: { select: { name: mapConsultationStatus(input.inquiryStatus) } },
    수임가능성: { select: { name: mapQualificationLabel(input.qualificationScore) } },
    수임전환여부: { select: { name: mapConversionLabel(input.inquiryStatus) } },
    의뢰유형: { select: { name: inquiryTypeLabels[input.inquiryType].ko } },
    긴급도: { select: { name: urgencyLabels[input.urgencyLevel].ko } },
    비고: { rich_text: buildRichText(input.classificationReason || "자동 상담 기록 동기화") },
    상담일: buildDateProperty(input.createdAt ?? new Date().toISOString()),
    후속상담일: buildDateProperty(input.dueDate),
  });
}

function buildCaseSummary(input: SyncCaseAnalysisInput) {
  const lawbotSummary =
    input.lawbotAnalysis?.status === "available"
      ? [
          input.lawbotAnalysis.data.practical_use_status
            ? `실전 사용 상태: ${input.lawbotAnalysis.data.practical_use_status}`
            : null,
          input.lawbotAnalysis.data.research_goal
            ? `조사 목표: ${input.lawbotAnalysis.data.research_goal}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : null;

  return [
    input.analysis.summary,
    `사건 강도: ${input.analysis.strengthLabel} (${input.analysis.strengthScore}점)`,
    `핵심 쟁점: ${input.analysis.issues.slice(0, 2).join(", ") || "추가 확인 필요"}`,
    lawbotSummary,
  ].join("\n");
}

function buildNeededDocuments(input: SyncCaseAnalysisInput) {
  const lawDocs = input.analysis.lawReferences.map((item) => item.title);
  const recommendedDocs = input.recommendedDocuments ?? [];
  const lawbotDocs =
    input.lawbotAnalysis?.status === "available" ? (input.lawbotAnalysis.data.document_checklist ?? []) : [];

  return [...new Set([...recommendedDocs, ...lawDocs, ...lawbotDocs])].join(", ") || "추가 검토 필요";
}

function buildMissingDocuments(input: SyncCaseAnalysisInput) {
  const lawbotMissing =
    input.lawbotAnalysis?.status === "available" ? (input.lawbotAnalysis.data.critical_missing_facts ?? []) : [];

  return [...new Set([...input.analysis.missingFacts, ...lawbotMissing])].join(", ") || "원문 명시 없음";
}

function buildNextAction(input: SyncCaseAnalysisInput) {
  const lawbotPriorityAction =
    input.lawbotAnalysis?.status === "available" ? input.lawbotAnalysis.data.priority_actions?.[0] : null;
  const lawbotCheckpoint =
    input.lawbotAnalysis?.status === "available" ? input.lawbotAnalysis.data.practical_checklist?.[0] : null;

  return (
    lawbotPriorityAction ||
    lawbotCheckpoint ||
    input.analysis.recommendedAction ||
    input.analysis.issues[0] ||
    "사건 검토 후 다음 조치 확정"
  );
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

function bulletList(items?: string[] | null) {
  return items?.length ? items.map((item) => `- ${item}`).join("\n") : "원문 명시 없음";
}

function formatDomainRoutes(
  items?: Array<{ label: string; score?: number; why?: string; priority_sources?: string[] }> | null
) {
  return bulletList(
    items?.map((item) =>
      [
        item.label,
        item.score !== undefined ? `${Math.round(item.score)}점` : null,
        item.why,
        item.priority_sources?.length ? `우선 자료: ${item.priority_sources.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join(" / ")
    )
  );
}

function formatResearchSubtypes(
  items?: Array<{ label: string; domain_key: string; score?: number; note?: string }> | null
) {
  return bulletList(
    items?.map((item) =>
      [item.label, item.domain_key, item.score !== undefined ? `${Math.round(item.score)}점` : null, item.note]
        .filter(Boolean)
        .join(" / ")
    )
  );
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
  const lawbotSections = [
    ["Lawbot 입력 요약", data.input_summary],
    [
      "Lawbot 신뢰도",
      data.confidence_score !== undefined
        ? `${Math.round(data.confidence_score)}점${data.confidence_label ? ` (${data.confidence_label})` : ""}`
        : "원문 명시 없음",
    ],
    ["Lawbot 매칭 근거", data.match_reason || "원문 명시 없음"],
    ["Lawbot 실전 사용 상태", data.practical_use_status || "원문 명시 없음"],
    ["Lawbot 추가 검토 필요 사유", bulletList(data.review_required_reasons)],
    ["Lawbot 빠진 핵심 사실", bulletList(data.critical_missing_facts)],
    ["Lawbot 조사 목표", data.research_goal || "원문 명시 없음"],
    ["Lawbot 분야 라우팅", formatDomainRoutes(data.domain_routes)],
    ["Lawbot 세부 유형 라우팅", formatResearchSubtypes(data.research_subtypes)],
    ["Lawbot 실무 체크리스트", bulletList(data.practical_checklist)],
    ["Lawbot 준비 자료 체크리스트", bulletList(data.document_checklist)],
    ["Lawbot 비자 세부 대응 포인트", bulletList(data.visa_scenario_guidance)],
    ["Lawbot 행정심판 기간·집행정지 포인트", bulletList(data.admin_appeal_timeline_guidance)],
    ["Lawbot 업종별 인허가 심화 체크", bulletList(data.licensing_sector_deep_guidance)],
    [
      "Lawbot 정확 매칭 법령",
      data.matched_laws?.map((item) =>
        `- ${item.law}${item.match_type ? ` / ${item.match_type}` : ""}${item.score !== undefined ? ` / ${Math.round(item.score)}점` : ""}${item.reason ? ` / ${item.reason}` : ""}`
      ).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 정확 매칭 조문",
      data.matched_articles?.map((item) =>
        `- ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}${item.summary ?? item.article_text ? ` / ${item.summary ?? item.article_text}` : ""}${item.full_text ? `\n  ${item.full_text}` : ""}${item.match_reason ? `\n  근거: ${item.match_reason}` : ""}`
      ).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 우선 액션",
      data.priority_actions?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 리스크 플래그",
      data.risk_flags?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 실무자용 메모",
      data.practitioner_brief?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 교육용 설명",
      data.training_notes?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 고객 설명 초안",
      data.client_ready_summary?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 사건 유형별 플레이북",
      data.practice_playbook?.map((item) => `- ${item}`).join("\n") || "원문 명시 없음",
    ],
    ["Lawbot 핵심 쟁점", data.key_issues.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["Lawbot 추가 확인 사실", data.followup_facts.map((item) => `- ${item}`).join("\n") || "원문 명시 없음"],
    ["Lawbot 참고 법령", data.applicable_laws.map((item) => `- ${item.law}: ${item.summary}`).join("\n") || "원문 명시 없음"],
    [
      "Lawbot 참고 판례",
      data.related_precedents?.map((item) =>
        `- ${item.case_name} / ${item.case_number}${item.court_name ? ` / ${item.court_name}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}\n  ${item.reason}`
      ).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 참고 해석례",
      data.related_interpretations?.map((item) =>
        `- ${item.title}${item.number ? ` / ${item.number}` : ""}${item.agency ? ` / ${item.agency}` : ""}${item.decision_date ? ` / ${item.decision_date}` : ""}\n  ${item.reason}`
      ).join("\n") || "원문 명시 없음",
    ],
    [
      "Lawbot 보조 참고 자료",
      data.supplemental_sources
        ? Object.entries(data.supplemental_sources)
            .flatMap(([category, items]) =>
              items.map((item) =>
                `- ${category}: ${String(item.title ?? item.query ?? "참고 자료")}${item.snippet ? ` / ${String(item.snippet)}` : ""}`
              )
            )
            .join("\n") || "원문 명시 없음"
        : "원문 명시 없음",
    ],
    ["Lawbot 보조 자료 하이라이트", bulletList(data.supplemental_source_highlights)],
    [
      "Lawbot 동기화 요약",
      data.sync_payload
        ? [
            data.sync_payload.confidence_score !== undefined
              ? `- 신뢰도: ${Math.round(data.sync_payload.confidence_score)}점${data.sync_payload.confidence_label ? ` (${data.sync_payload.confidence_label})` : ""}`
              : null,
            data.sync_payload.match_reason ? `- 근거: ${data.sync_payload.match_reason}` : null,
            ...(data.sync_payload.priority_actions?.map((item) => `- 우선 액션: ${item}`) ?? []),
            ...(data.sync_payload.risk_flags?.map((item) => `- 리스크: ${item}`) ?? []),
            ...(data.sync_payload.primary_law ? [`- 대표 법령: ${data.sync_payload.primary_law}`] : []),
            ...(data.sync_payload.primary_article ? [`- 대표 조문: ${data.sync_payload.primary_article}`] : []),
            ...(data.sync_payload.primary_precedent ? [`- 대표 판례: ${data.sync_payload.primary_precedent}`] : []),
            ...(data.sync_payload.matched_laws?.map((item) => `- 법령: ${item.law}`) ?? []),
            ...(data.sync_payload.matched_articles?.map((item) => `- 조문: ${(item.law_name ?? item.law ?? "").trim()} ${(item.article_label ?? item.article ?? "").trim()}`) ?? []),
            ...(data.sync_payload.matched_precedents?.map((item) => `- 판례: ${item.case_name}`) ?? []),
            ...(data.sync_payload.matched_interpretations?.map((item) => `- 해석례: ${item.title}`) ?? []),
            ...(data.sync_payload.supplemental_sources?.map((item) => `- 보조 자료: ${item}`) ?? []),
          ]
            .filter(Boolean)
            .join("\n")
        : "원문 명시 없음",
    ],
  ] as const;

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

async function upsertPage(input: {
  databaseId: string;
  token: string;
  title: string;
  fallbackUrl?: { propertyName: string; value: string | null };
  properties: Record<string, unknown>;
  children: object[];
}) {
  const existingByUrl =
    input.fallbackUrl?.value
      ? await findExistingPageIdByUrl(input.databaseId, input.fallbackUrl.propertyName, input.fallbackUrl.value, input.token)
      : null;
  const existingPageId = existingByUrl ?? (await findExistingPageIdByTitle(input.databaseId, input.title, input.token));

  if (!existingPageId) {
    const created = (await notionRequest("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { type: "database_id", database_id: input.databaseId },
        properties: input.properties,
        children: input.children,
      }),
    }, input.token)) as { id: string };

    return { status: "created" as const, pageId: created.id };
  }

  await notionRequest(`/pages/${existingPageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: input.properties }),
  }, input.token);

  await archiveChildBlocks(existingPageId, input.token);

  await notionRequest(`/blocks/${existingPageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({ children: input.children }),
  }, input.token);

  return { status: "updated" as const, pageId: existingPageId };
}

export async function syncConsultationToNotion(input: SyncConsultationInput) {
  const token = getNotionToken();
  const consultationDatabaseId = getConsultationDatabaseId();

  if (!token || !consultationDatabaseId) {
    return { status: "disabled" as const, pageId: null };
  }

  const title = buildSharedPageTitle(input.contactName, input.inquiryTitle);
  const referenceUrl = input.referenceUrl ?? buildAdminReferenceUrl(input.inquiryId);

  return upsertPage({
    databaseId: consultationDatabaseId,
    token,
    title,
    fallbackUrl: { propertyName: "참고 자료 ", value: referenceUrl },
    properties: buildConsultationProperties({ ...input, referenceUrl }),
    children: buildConsultationBlocks(input),
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

function readPlainTextProperty(property: any): string | null {
  if (!property) return null;

  if (property.type === "title" || property.type === "rich_text") {
    const items = property[property.type] ?? [];
    return items.map((item: any) => item?.plain_text ?? "").join("").trim() || null;
  }

  if (property.type === "select") {
    return property.select?.name ?? null;
  }

  if (property.type === "url") {
    return property.url ?? null;
  }

  if (property.type === "number") {
    return typeof property.number === "number" ? String(property.number) : null;
  }

  return null;
}

function readMultiSelectNames(property: any): string[] {
  if (!property?.multi_select) return [];
  return property.multi_select.map((item: any) => item?.name).filter(Boolean);
}

function readTitle(propertyMap: Record<string, any>, key: string) {
  return readPlainTextProperty(propertyMap[key]) ?? "제목 없음";
}

function buildReferenceKeywords(input: {
  inquiryType: InquiryType;
  serviceTags?: string[];
  inquiryTitle?: string;
}) {
  const baseMap: Record<InquiryType, string[]> = {
    FOREIGNER_VISA: ["비자", "출입국", "행정사"],
    IMMIGRATION_STAY: ["출입국", "비자", "행정사"],
    APOSTILLE_CONSULAR: ["행정사", "계약", "일반"],
    TRANSLATION_NOTARY: ["행정사", "계약", "일반"],
    GENERAL_ADMIN_CIVIL: ["민원", "행정사", "일반"],
    CORPORATE_REQUEST: ["기업행정", "계약", "행정사"],
    UNKNOWN: ["행정사", "일반"],
  };

  const extractedTitleKeywords = (input.inquiryTitle ?? "")
    .split(/[\s,·/()]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 6);

  return [...new Set([...(baseMap[input.inquiryType] ?? []), ...(input.serviceTags ?? []), ...extractedTitleKeywords])];
}

function scoreTextAgainstKeywords(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.reduce((score, keyword) => {
    const token = keyword.toLowerCase();
    return normalized.includes(token) ? score + 1 : score;
  }, 0);
}

export async function syncCaseToNotion(_caseId: string) {
  return { synced: false, reason: "case-analysis-sync-only" as const };
}

export async function getNotionReferenceRecommendations(input: {
  inquiryType: InquiryType;
  serviceTags?: string[];
  inquiryTitle?: string;
}) {
  const token = getNotionToken();
  const archiveDatabaseId = getReferenceArchiveDatabaseId();
  const websiteDatabaseId = getReferenceWebsiteDatabaseId();

  if (!token || (!archiveDatabaseId && !websiteDatabaseId)) {
    return {
      keywords: buildReferenceKeywords(input),
      materials: [],
      websites: [],
    } satisfies NotionReferenceRecommendations;
  }

  const keywords = buildReferenceKeywords(input);

  let archivePayload: unknown = { results: [] };
  let websitePayload: unknown = { results: [] };

  try {
    [archivePayload, websitePayload] = await Promise.all([
      archiveDatabaseId
        ? notionRequest(`/databases/${archiveDatabaseId}/query`, {
            method: "POST",
            body: JSON.stringify({ page_size: 50 }),
          }, token)
        : Promise.resolve({ results: [] }),
      websiteDatabaseId
        ? notionRequest(`/databases/${websiteDatabaseId}/query`, {
            method: "POST",
            body: JSON.stringify({ page_size: 50 }),
          }, token)
        : Promise.resolve({ results: [] }),
    ]);
  } catch (error) {
    console.error("Failed to load Notion reference recommendations", error);
    return {
      keywords,
      materials: [],
      websites: [],
    } satisfies NotionReferenceRecommendations;
  }

  const materials = ((archivePayload as any).results ?? [])
    .map((page: any) => {
      const properties = page.properties ?? {};
      const title = readTitle(properties, "자료 제목");
      const category = readPlainTextProperty(properties["분야"]);
      const resourceType = readPlainTextProperty(properties["종류"]);
      const summary = readPlainTextProperty(properties["주요내용 요약"]);
      const source = readPlainTextProperty(properties["출처"]);
      const citationUrl = readPlainTextProperty(properties["PDF/Citation"]);
      const status = readPlainTextProperty(properties["요약여부"]);
      const yearValue = readPlainTextProperty(properties["출판연도"]);
      const publishedYear = yearValue ? Number(yearValue) : null;
      const score =
        (category && keywords.includes(category) ? 8 : 0) +
        (status === "완료" ? 4 : 0) +
        scoreTextAgainstKeywords([title, summary, source, category, resourceType].filter(Boolean).join(" "), keywords) * 2;

      return {
        id: page.id,
        title,
        category,
        resourceType,
        summary,
        source,
        citationUrl,
        publishedYear: Number.isFinite(publishedYear) ? publishedYear : null,
        status,
        score,
      } satisfies NotionReferenceMaterial;
    })
    .filter((item: NotionReferenceMaterial) => item.score > 0)
    .sort((left: NotionReferenceMaterial, right: NotionReferenceMaterial) => right.score - left.score || (right.publishedYear ?? 0) - (left.publishedYear ?? 0))
    .slice(0, 4);

  const websites = ((websitePayload as any).results ?? [])
    .map((page: any) => {
      const properties = page.properties ?? {};
      const title = readTitle(properties, "이름");
      const organization = readPlainTextProperty(properties["관련 기관"]);
      const fields = readMultiSelectNames(properties["분야"]);
      const description = readPlainTextProperty(properties["용도 설명"]);
      const url = readPlainTextProperty(properties["URL"]) ?? readPlainTextProperty(properties["userDefined:URL"]);
      const score =
        fields.reduce((sum, field) => sum + (keywords.includes(field) ? 8 : 0), 0) +
        scoreTextAgainstKeywords([title, organization, description, ...fields].filter(Boolean).join(" "), keywords) * 2;

      return {
        id: page.id,
        title,
        organization,
        fields,
        description,
        url,
        score,
      } satisfies NotionReferenceWebsite;
    })
    .filter((item: NotionReferenceWebsite) => item.score > 0)
    .sort((left: NotionReferenceWebsite, right: NotionReferenceWebsite) => right.score - left.score)
    .slice(0, 5);

  return {
    keywords,
    materials,
    websites,
  } satisfies NotionReferenceRecommendations;
}
