import { prisma } from "@/lib/prisma/client";
import { deriveInquiryScreening } from "@/lib/intake-screening/service";
import { inquiryTypeLabels, screeningGradeLabels, screeningRouteLabels, urgencyLabels } from "@/types/inquiry";

type NotionPage = {
  id: string;
  url?: string;
};

type NotionDatabaseQueryResponse = {
  results: NotionPage[];
};

type NotionSyncConfig = {
  enabled: boolean;
  token?: string;
  consultationDatabaseId?: string;
  caseDatabaseId?: string;
  adminAppUrl?: string;
};

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function getNotionConfig(): NotionSyncConfig {
  return {
    enabled: process.env.NOTION_SYNC_ENABLED?.trim() === "true",
    token: process.env.NOTION_TOKEN?.trim(),
    consultationDatabaseId: process.env.NOTION_CONSULTATION_DATABASE_ID?.trim(),
    caseDatabaseId: process.env.NOTION_CASE_DATABASE_ID?.trim(),
    adminAppUrl: process.env.ADMIN_APP_URL?.trim()
  };
}

function isNotionSyncReady(config = getNotionConfig()) {
  return Boolean(config.enabled && config.token && config.consultationDatabaseId && config.caseDatabaseId);
}

async function notionRequest<T>(path: string, init: RequestInit = {}) {
  const config = getNotionConfig();
  if (!config.enabled || !config.token) {
    return null;
  }

  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion API request failed: ${response.status} ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
}

function sanitizeText(value?: string | null) {
  return value?.trim() ?? "";
}

function richTextProperty(value?: string | null) {
  const content = sanitizeText(value);
  return {
    rich_text: content
      ? [
          {
            type: "text",
            text: { content }
          }
        ]
      : []
  };
}

function titleProperty(value: string) {
  const content = value.trim() || "제목 없음";
  return {
    title: [
      {
        type: "text",
        text: { content }
      }
    ]
  };
}

function selectProperty(value?: string | null) {
  const name = sanitizeText(value);
  return {
    select: name ? { name } : null
  };
}

function multiSelectProperty(values: string[]) {
  return {
    multi_select: values
      .map((value) => value.trim())
      .filter(Boolean)
      .map((name) => ({ name }))
  };
}

function dateProperty(value?: Date | string | null) {
  if (!value) {
    return { date: null };
  }

  const iso = typeof value === "string" ? value : value.toISOString();
  return {
    date: {
      start: iso
    }
  };
}

function phoneProperty(value?: string | null) {
  return {
    phone_number: sanitizeText(value) || null
  };
}

function urlProperty(value?: string | null) {
  const url = sanitizeText(value);
  return {
    url: url || null
  };
}

function relationProperty(pageIds: string[]) {
  return {
    relation: pageIds.map((id) => ({ id }))
  };
}

function buildInquiryUrl(inquiryId: string) {
  const adminAppUrl = getNotionConfig().adminAppUrl;
  if (!adminAppUrl) return "";
  return `${adminAppUrl.replace(/\/$/, "")}/admin/inquiries/${inquiryId}`;
}

function buildCaseUrl(inquiryId: string) {
  const adminAppUrl = getNotionConfig().adminAppUrl;
  if (!adminAppUrl) return "";
  return `${adminAppUrl.replace(/\/$/, "")}/admin/inquiries/${inquiryId}/case`;
}

async function findPageByUrl(databaseId: string, propertyName: string, value: string) {
  const data = await notionRequest<NotionDatabaseQueryResponse>(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: propertyName,
        url: {
          equals: value
        }
      },
      page_size: 1
    })
  });

  return data?.results?.[0] ?? null;
}

async function findPageByRichText(databaseId: string, propertyName: string, value: string) {
  const data = await notionRequest<NotionDatabaseQueryResponse>(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: propertyName,
        rich_text: {
          equals: value
        }
      },
      page_size: 1
    })
  });

  return data?.results?.[0] ?? null;
}

async function upsertPageByProperties(input: {
  databaseId: string;
  pageId?: string | null;
  properties: Record<string, unknown>;
}) {
  if (input.pageId) {
    const updated = await notionRequest<NotionPage>(`/pages/${input.pageId}`, {
      method: "PATCH",
      body: JSON.stringify({
        properties: input.properties
      })
    });

    return updated?.id ?? input.pageId;
  }

  const created = await notionRequest<NotionPage>("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: {
        database_id: input.databaseId
      },
      properties: input.properties
    })
  });

  if (!created?.id) {
    throw new Error("Notion page creation failed without returning a page id.");
  }

  return created.id;
}

function mapConsultationStatus(status: string) {
  switch (status) {
    case "NEW":
      return "신규";
    case "PRE_DIAGNOSED":
    case "IN_REVIEW":
      return "검토중";
    case "WAITING_CONSULTATION":
    case "CONSULTATION_REQUIRED":
    case "QUOTE_DRAFTED":
    case "QUOTE_PENDING":
    case "QUOTE_SENT":
      return "자료요청";
    case "WON":
    case "CLOSED":
      return "종결";
    default:
      return "검토중";
  }
}

function mapCaseProgressStatus(currentStage: string) {
  switch (currentStage) {
    case "COMPLETED":
    case "CLOSED":
      return "완료";
    case "CONTRACT_PREPARATION":
      return "시작 전";
    default:
      return "진행 중";
  }
}

function mapCaseSuccessPotential(score: number) {
  if (score >= 80) return "높음";
  if (score >= 60) return "중간";
  return "검토 필요";
}

function mapCompensationStatus(currentStage: string) {
  switch (currentStage) {
    case "CONTRACT_PREPARATION":
      return "계약 준비";
    case "DOCUMENT_COLLECTION":
      return "착수 후 진행";
    case "COMPLETED":
    case "CLOSED":
      return "정산 완료";
    default:
      return "진행 중";
  }
}

async function upsertConsultationPageByInquiry(inquiryId: string) {
  const config = getNotionConfig();
  if (!isNotionSyncReady(config) || !config.consultationDatabaseId) {
    return null;
  }

  const inquiry = await prisma.inquiry.findUniqueOrThrow({
    where: { id: inquiryId }
  });

  const inquiryUrl = buildInquiryUrl(inquiry.id);
  const existing = inquiryUrl
    ? await findPageByUrl(config.consultationDatabaseId, "참고 자료 ", inquiryUrl)
    : null;

  const screening = deriveInquiryScreening({
    id: inquiry.id,
    qualificationScore: inquiry.qualificationScore,
    classificationConfidence: inquiry.classificationConfidence,
    urgencyLevel: inquiry.urgencyLevel as Parameters<typeof deriveInquiryScreening>[0]["urgencyLevel"],
    consultationRequired: inquiry.consultationRequired,
    hasPreparedDocuments: inquiry.hasPreparedDocuments,
    needsTranslation: inquiry.needsTranslation,
    isCorporateRequest: inquiry.isCorporateRequest,
    dueDate: inquiry.dueDate,
    preferredLanguage: inquiry.preferredLanguage as Parameters<typeof deriveInquiryScreening>[0]["preferredLanguage"],
    status: inquiry.status as Parameters<typeof deriveInquiryScreening>[0]["status"],
    contactName: inquiry.contactName
  });

  const inquiryTypeLabel =
    inquiryTypeLabels[inquiry.inquiryType as keyof typeof inquiryTypeLabels]?.ko ?? inquiry.inquiryType;
  const urgencyLabel =
    urgencyLabels[inquiry.urgencyLevel as keyof typeof urgencyLabels]?.ko ?? inquiry.urgencyLevel;
  const gradeLabel =
    screeningGradeLabels[screening.grade as keyof typeof screeningGradeLabels]?.ko ?? screening.grade;
  const routeLabel =
    screeningRouteLabels[screening.route as keyof typeof screeningRouteLabels]?.ko ?? screening.route;
  const requiredDocuments = (() => {
    try {
      const parsed = JSON.parse(inquiry.precheckRecommendedDocs);
      return Array.isArray(parsed) ? parsed.join(", ") : "";
    } catch {
      return "";
    }
  })();

  const properties = {
    "이름": titleProperty(`${inquiry.contactName} 상담`),
    "고객명": richTextProperty(inquiry.contactName),
    "긴급도": selectProperty(urgencyLabel),
    "다음 액션": richTextProperty(routeLabel),
    "비고": richTextProperty(inquiry.classificationReason),
    "상담요약": richTextProperty(inquiry.generatedSummary || inquiry.description),
    "상담일": dateProperty(inquiry.createdAt),
    "상담주제": multiSelectProperty([inquiryTypeLabel, gradeLabel]),
    "상담채널": selectProperty("웹폼"),
    "상태": selectProperty(mapConsultationStatus(inquiry.status)),
    "수임가능성": selectProperty(gradeLabel),
    "수임전환여부": selectProperty(inquiry.status === "WON" ? "수임" : "미수임"),
    "연락처": phoneProperty(inquiry.phone),
    "의뢰유형": selectProperty(inquiryTypeLabel),
    "참고 자료 ": urlProperty(inquiryUrl),
    "필요한 서류": richTextProperty(requiredDocuments),
    "후속상담일": dateProperty(inquiry.dueDate)
  };

  return upsertPageByProperties({
    databaseId: config.consultationDatabaseId,
    pageId: existing?.id,
    properties
  });
}

export async function syncInquiryToNotion(inquiryId: string) {
  if (!isNotionSyncReady()) {
    return { synced: false, reason: "disabled" as const };
  }

  const pageId = await upsertConsultationPageByInquiry(inquiryId);
  return { synced: Boolean(pageId), pageId: pageId ?? undefined };
}

export async function syncCaseToNotion(caseId: string) {
  const config = getNotionConfig();
  if (!isNotionSyncReady(config) || !config.caseDatabaseId) {
    return { synced: false, reason: "disabled" as const };
  }

  const record = await prisma.caseRecord.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      inquiry: true,
      documents: {
        include: {
          files: true
        }
      }
    }
  });

  const consultationPageId = await upsertConsultationPageByInquiry(record.inquiryId);
  const existing = await findPageByRichText(config.caseDatabaseId, "사건 번호", record.caseNumber);
  const inquiryTypeLabel =
    inquiryTypeLabels[record.inquiry.inquiryType as keyof typeof inquiryTypeLabels]?.ko ??
    record.inquiry.inquiryType;
  const requiredDocuments = record.documents.filter((doc) => doc.isRequired).map((doc) => doc.label);
  const missingDocuments = record.documents
    .filter((doc) => doc.isRequired)
    .filter((doc) => !doc.isReceived && !doc.files.some((file) => file.isCurrentVersion))
    .map((doc) => doc.label);
  const summaryLines = [
    record.inquiry.generatedSummary || record.inquiry.description,
    `현재 단계: ${record.currentStage}`,
    record.inquiry.classificationReason ? `분류 사유: ${record.inquiry.classificationReason}` : "",
    record.nextFollowUpDate ? `다음 후속 일정: ${record.nextFollowUpDate.toISOString().slice(0, 10)}` : ""
  ].filter(Boolean);

  const properties = {
    "이름": titleProperty(`${record.caseNumber} ${record.inquiry.contactName}`),
    "사건 번호": richTextProperty(record.caseNumber),
    "사건 요약": richTextProperty(summaryLines.join("\n")),
    "상담 원천": consultationPageId ? relationProperty([consultationPageId]) : relationProperty([]),
    "의뢰인명": richTextProperty(record.inquiry.contactName),
    "연락처": phoneProperty(record.inquiry.phone),
    "업무 유형": selectProperty(inquiryTypeLabel),
    "분야": multiSelectProperty([inquiryTypeLabel]),
    "진행 상태": { status: { name: mapCaseProgressStatus(record.currentStage) } },
    "보수 상태": selectProperty(mapCompensationStatus(record.currentStage)),
    "수임일": dateProperty(record.createdAt),
    "제출 기한": dateProperty(record.filingDeadline ?? record.dueDate),
    "완료일": dateProperty(record.closedAt),
    "다음조치": richTextProperty(record.internalMemo || record.inquiry.recommendedNextStep),
    "현재 부족 서류": richTextProperty(missingDocuments.join(", ")),
    "필요 서류": richTextProperty(requiredDocuments.join(", ")),
    "성공 가능성": selectProperty(mapCaseSuccessPotential(record.inquiry.qualificationScore)),
    "관할기관": richTextProperty(record.inquiry.targetAgency),
    "상대방 기관": richTextProperty(record.inquiry.targetAgency),
    "참고자료": urlProperty(buildCaseUrl(record.inquiryId)),
    "비고 ": richTextProperty(record.closeReason || record.outcomeSummary || "")
  };

  const pageId = await upsertPageByProperties({
    databaseId: config.caseDatabaseId,
    pageId: existing?.id,
    properties
  });

  return { synced: Boolean(pageId), pageId };
}