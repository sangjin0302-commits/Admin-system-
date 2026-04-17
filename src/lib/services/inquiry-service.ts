import type { Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { syncConsultationToNotion } from "@/lib/integrations/notion";
import { getIntakeEvaluator } from "@/lib/intake-evaluator";
import {
  buildMessagePreview,
  buildMessagePreviewSet,
  generatePreparationGuidance,
  generateReceiptMessage
} from "@/lib/message-templates/service";
import { dispatchInitialClientMessage } from "@/lib/services/client-message-service";
import { getInquiryReceiptCode } from "@/lib/services/inquiry-receipt-code";
import { formatDate } from "@/lib/utils";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry";
import type { AdminSort, InquiryStatus, InquiryType, LanguageCode, UrgencyLevel } from "@/types/inquiry";
import { getUrgencyRank, inquiryTypeLabels, toLocale, type Locale } from "@/types/inquiry";

type InquiryListFilters = {
  q?: string;
  inquiryType?: InquiryType;
  status?: InquiryStatus;
  urgency?: UrgencyLevel;
  language?: LanguageCode;
  assignee?: string;
  retained?: "all" | "won" | "active";
  sort?: AdminSort;
};

type InquiryListRecord = Awaited<ReturnType<typeof prisma.inquiry.findMany>>[number];

type PersistLawbotSnapshotInput = {
  inquiryId: string;
  status: string;
  summary: string;
  payload: {
    input_summary?: string;
    practical_use_status?: string;
    confidence_score?: number;
    confidence_label?: string;
    match_reason?: string;
    research_goal?: string;
    review_required_reasons?: string[];
    critical_missing_facts?: string[];
    priority_actions?: string[];
    risk_flags?: string[];
    practical_checklist?: string[];
    document_checklist?: string[];
  };
};

type StatusTransitionGuardContext = {
  currentStatus: InquiryStatus;
  email: string | null;
  phone: string | null;
  description: string;
  requestedOutcome: string | null;
  hasPreparedDocuments: boolean;
  internalMemo: string | null;
  lawbotSnapshotPayload: string | null;
  quoteCount: number;
};

export type InquiryStatusGuardPreview = {
  status: InquiryStatus;
  allowed: boolean;
  blockers: string[];
};

export class InquiryStatusGuardError extends Error {
  blockers: string[];

  constructor(message: string, blockers: string[]) {
    super(message);
    this.name = "InquiryStatusGuardError";
    this.blockers = blockers;
  }
}

export type InquiryCommunicationChannel = "EMAIL" | "PHONE" | "KAKAO" | "SMS" | "VISIT" | "INTERNAL";

export type InquiryCommunicationLogEntry = {
  id: string;
  createdAt: string;
  channel: InquiryCommunicationChannel;
  summary: string;
  details: string;
  responsePending: boolean;
  nextContactAt: string | null;
};

function createLogId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseLawbotSnapshotPayload(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      review_required_reasons?: string[];
      critical_missing_facts?: string[];
      risk_flags?: string[];
      document_checklist?: string[];
    };
  } catch {
    return null;
  }
}

function getStatusTransitionBlockers(
  context: StatusTransitionGuardContext,
  targetStatus: InquiryStatus,
  nextInternalMemo?: string | null
) {
  const blockers: string[] = [];
  const lawbotPayload = parseLawbotSnapshotPayload(context.lawbotSnapshotPayload);
  const documentChecklist = lawbotPayload?.document_checklist ?? [];
  const missingFacts = lawbotPayload?.critical_missing_facts ?? [];
  const reviewReasons = lawbotPayload?.review_required_reasons ?? [];
  const riskFlags = lawbotPayload?.risk_flags ?? [];
  const memo = (nextInternalMemo ?? context.internalMemo ?? "").trim();

  if (targetStatus === "CONSULTATION_REQUIRED" || targetStatus === "WAITING_CONSULTATION") {
    if (!context.email?.trim() && !context.phone?.trim()) {
      blockers.push("상담 진행 전에는 이메일 또는 전화번호 중 최소 한 가지 연락 수단이 필요합니다.");
    }
    if (context.description.trim().length < 20) {
      blockers.push("상담 진행 전에는 고객 문의 상세 내용이 조금 더 구체적으로 입력되어야 합니다.");
    }
  }

  if (targetStatus === "ON_HOLD") {
    if (memo.length < 12) {
      blockers.push("보류 검토로 전환하려면 내부 메모에 보류 사유를 조금 더 구체적으로 남겨야 합니다.");
    }
  }

  if (targetStatus === "QUOTE_DRAFTED" || targetStatus === "QUOTE_PENDING" || targetStatus === "QUOTE_SENT") {
    if (!context.requestedOutcome?.trim()) {
      blockers.push("견적 단계로 넘기기 전에 고객의 원하는 결과가 정리되어 있어야 합니다.");
    }
    if (!context.hasPreparedDocuments) {
      blockers.push("현재 보유 서류 여부가 미보유로 되어 있어 견적 전환 전 자료 확인이 필요합니다.");
    }
    if (documentChecklist.length > 0) {
      blockers.push("Lawbot 기준 먼저 받아야 할 자료가 남아 있어 견적 전환 전 보완이 필요합니다.");
    }
    if (missingFacts.length > 0 || reviewReasons.length > 0) {
      blockers.push("Lawbot 기준 빠진 핵심 사실 또는 추가 검토 필요 사유가 남아 있습니다.");
    }
  }

  if (targetStatus === "QUOTE_SENT") {
    if (context.quoteCount === 0) {
      blockers.push("견적 발송 상태로 바꾸기 전에 최소 한 건의 견적 초안이 생성되어 있어야 합니다.");
    }
  }

  if (targetStatus === "WON") {
    if (context.quoteCount === 0) {
      blockers.push("수임 상태로 바꾸기 전에 연결된 견적 또는 계약 흐름이 있어야 합니다.");
    }
    if (documentChecklist.length > 0 || missingFacts.length > 0 || riskFlags.length > 0) {
      blockers.push("수임 전환 전에는 남아 있는 자료 부족 또는 리스크 신호를 정리하는 편이 안전합니다.");
    }
  }

  if (targetStatus === "CLOSED") {
    if (memo.length < 12) {
      blockers.push("종결 처리 전에는 내부 메모에 종결 사유 또는 마무리 내용을 남겨 주세요.");
    }
  }

  return blockers;
}

export function buildInquiryStatusGuardPreview(
  context: StatusTransitionGuardContext,
  statuses: InquiryStatus[]
): InquiryStatusGuardPreview[] {
  return statuses.map((status) => {
    const blockers = getStatusTransitionBlockers(context, status);
    return {
      status,
      allowed: blockers.length === 0,
      blockers
    };
  });
}

export function parseInquiryCommunicationLogs(value: string | null | undefined): InquiryCommunicationLogEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry): InquiryCommunicationLogEntry | null => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const record = entry as Partial<InquiryCommunicationLogEntry>;
        if (!record.id || !record.createdAt || !record.channel || !record.summary) {
          return null;
        }

        return {
          id: String(record.id),
          createdAt: String(record.createdAt),
          channel: String(record.channel) as InquiryCommunicationChannel,
          summary: String(record.summary),
          details: String(record.details ?? ""),
          responsePending: Boolean(record.responsePending),
          nextContactAt: record.nextContactAt ? String(record.nextContactAt) : null
        };
      })
      .filter((entry): entry is InquiryCommunicationLogEntry => entry !== null)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  } catch {
    return [];
  }
}

function buildInquirySummary(input: {
  inquiryType: InquiryType;
  preferredLanguage: LanguageCode;
  title: string;
  description: string;
  urgencyLevel: UrgencyLevel;
  qualificationScore: number;
  dueDate?: Date;
}) {
  const locale = toLocale(input.preferredLanguage);
  const clippedDescription =
    input.description.length > 140 ? `${input.description.slice(0, 140)}...` : input.description;
  const deadline = input.dueDate ? formatDate(input.dueDate, locale === "ko" ? "ko-KR" : "en-US") : null;

  if (locale === "ko") {
    return `${inquiryTypeLabels[input.inquiryType][locale]} 문의입니다. 제목은 "${input.title}"이며, 수임 적합도는 ${input.qualificationScore}점입니다.${deadline ? ` 희망 일정은 ${deadline}입니다.` : ""} 상담 내용: ${clippedDescription}`;
  }

  return `${inquiryTypeLabels[input.inquiryType][locale]} inquiry. Title: "${input.title}". Qualification score: ${input.qualificationScore}.${deadline ? ` Target date: ${deadline}.` : ""} Summary: ${clippedDescription}`;
}

export async function createInquiry(payload: unknown) {
  const input = parseCreateInquiryInput(payload);
  const evaluator = getIntakeEvaluator();
  const effectiveClientType =
    input.isCorporateRequest || input.clientType === "COMPANY" ? "COMPANY" : "INDIVIDUAL";

  const evaluation = evaluator.evaluate({
    clientType: effectiveClientType,
    contactName: input.contactName,
    email: input.email,
    organizationName: input.organizationName,
    title: input.title,
    description: input.description,
    requestedOutcome: input.requestedOutcome,
    requestedInquiryType: input.requestedInquiryType,
    declaredUrgency: input.declaredUrgency,
    nationality: input.nationality,
    currentStatus: input.currentStatus,
    documentCountry: input.documentCountry,
    targetAgency: input.targetAgency,
    dueDate: input.dueDate,
    preferredLanguage: input.preferredLanguage,
    hasPreparedDocuments: input.hasPreparedDocuments,
    needsTranslation: input.needsTranslation,
    isCorporateRequest: input.isCorporateRequest
  });

  const generatedSummary = buildInquirySummary({
    inquiryType: evaluation.inquiryType,
    preferredLanguage: input.preferredLanguage,
    title: input.title,
    description: input.requestedOutcome
      ? `${input.description} / 희망 결과: ${input.requestedOutcome}`
      : input.description,
    urgencyLevel: evaluation.urgencyLevel,
    qualificationScore: evaluation.qualificationScore,
    dueDate: input.dueDate
  });

  const messageInput = {
    inquiryId: "temporary",
    contactName: input.contactName,
    inquiryType: evaluation.inquiryType,
    preferredLanguage: input.preferredLanguage,
    urgencyLevel: evaluation.urgencyLevel,
    recommendedNextStep: evaluation.recommendedNextStep,
    recommendedDocumentsOverride: evaluation.recommendedDocuments,
    dueDate: input.dueDate
  };

  const created = await prisma.inquiry.create({
    data: {
      status: evaluation.status,
      contactName: input.contactName,
      organizationName: input.organizationName,
      email: input.email,
      phone: input.phone,
      preferredLanguage: input.preferredLanguage,
      clientType: effectiveClientType,
      title: input.title,
      description: input.description,
      requestedOutcome: input.requestedOutcome,
      requestedInquiryType: input.requestedInquiryType,
      declaredUrgency: input.declaredUrgency,
      nationality: input.nationality,
      currentStatus: input.currentStatus,
      documentCountry: input.documentCountry,
      targetAgency: input.targetAgency,
      hasPreparedDocuments: input.hasPreparedDocuments,
      needsTranslation: input.needsTranslation,
      isCorporateRequest: input.isCorporateRequest,
      dueDate: input.dueDate,
      wantsCallback: input.wantsCallback,
      consentToPrivacy: input.consentToPrivacy,
      inquiryType: evaluation.inquiryType,
      urgencyLevel: evaluation.urgencyLevel,
      classificationConfidence: evaluation.confidence,
      qualificationScore: evaluation.qualificationScore,
      consultationRequired: evaluation.consultationRequired,
      classificationReason: evaluation.classificationReason,
      recommendedNextStep: evaluation.recommendedNextStep,
      riskComplexityHint: evaluation.riskComplexityHint,
      precheckRecommendedDocs: JSON.stringify(evaluation.recommendedDocuments),
      serviceTags: JSON.stringify(evaluation.serviceTags),
      generatedSummary,
      generatedGuidance: "",
      generatedReceiptMessage: ""
    }
  });

  const finalizedMessageInput = {
    ...messageInput,
    inquiryId: await getInquiryReceiptCode({
      id: created.id,
      createdAt: created.createdAt,
      inquiryType: created.inquiryType as InquiryType
    })
  };

  const guidance = generatePreparationGuidance(finalizedMessageInput);
  const receiptMessage = generateReceiptMessage(finalizedMessageInput);

  const updated = await prisma.inquiry.update({
    where: { id: created.id },
    data: {
      generatedGuidance: guidance,
      generatedReceiptMessage: receiptMessage
    }
  });

  await dispatchInitialClientMessage({
    inquiryId: updated.id,
    preview: buildMessagePreview(finalizedMessageInput)
  });

  try {
    await syncConsultationToNotion({
      inquiryId: updated.id,
      contactName: updated.contactName,
      contactPhone: updated.phone,
      inquiryTitle: updated.title,
      inquiryType: updated.inquiryType as InquiryType,
      inquiryStatus: updated.status as InquiryStatus,
      urgencyLevel: updated.urgencyLevel as UrgencyLevel,
      qualificationScore: updated.qualificationScore,
      generatedSummary: updated.generatedSummary,
      recommendedNextStep: updated.recommendedNextStep,
      classificationReason: updated.classificationReason,
      recommendedDocuments: JSON.parse(updated.precheckRecommendedDocs || "[]"),
      serviceTags: JSON.parse(updated.serviceTags || "[]"),
      createdAt: updated.createdAt.toISOString(),
      dueDate: updated.dueDate?.toISOString() ?? null
    });
  } catch (error) {
    console.error("Failed to sync consultation to Notion", error);
  }

  return updated;
}

export async function listInquiries(filters: InquiryListFilters = {}) {
  const statusFilter: Prisma.InquiryWhereInput["status"] =
    filters.status ??
    (filters.retained === "won"
      ? "WON"
      : filters.retained === "active"
        ? { notIn: ["WON", "CLOSED"] }
        : undefined);

  const where: Prisma.InquiryWhereInput = {
    inquiryType: filters.inquiryType,
    status: statusFilter,
    urgencyLevel: filters.urgency,
    preferredLanguage: filters.language,
    ...(filters.assignee
      ? {
          assignee: { contains: filters.assignee }
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q } },
            { description: { contains: filters.q } },
            { contactName: { contains: filters.q } },
            { organizationName: { contains: filters.q } },
            { email: { contains: filters.q } }
          ]
        }
      : {})
  };

  const inquiries = await prisma.inquiry.findMany({
    where,
    orderBy: [{ createdAt: "desc" }]
  });

  if (filters.sort === "urgency") {
    return inquiries.sort((a: InquiryListRecord, b: InquiryListRecord) => {
      const urgencyDiff = getUrgencyRank(b.urgencyLevel) - getUrgencyRank(a.urgencyLevel);
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  return inquiries;
}

export async function getInquiryById(id: string) {
  return prisma.inquiry.findUnique({
    where: { id }
  });
}

export async function persistLawbotSnapshot(input: PersistLawbotSnapshotInput) {
  return prisma.inquiry.update({
    where: { id: input.inquiryId },
    data: {
      lawbotLastAnalyzedAt: new Date(),
      lawbotSnapshotVersion: 1,
      lawbotSnapshotStatus: input.status,
      lawbotSnapshotSummary: input.summary,
      lawbotSnapshotPayload: JSON.stringify(input.payload)
    }
  });
}

export async function updateInquiryAdminFields(
  id: string,
  payload: {
    status?: InquiryStatus;
    assignee?: string;
    internalMemo?: string;
  }
) {
  const current = await prisma.inquiry.findUnique({
    where: { id },
    select: {
      status: true,
      email: true,
      phone: true,
      description: true,
      requestedOutcome: true,
      hasPreparedDocuments: true,
      internalMemo: true,
      lawbotSnapshotPayload: true,
      _count: {
        select: {
          quotes: true
        }
      }
    }
  });

  if (!current) {
    throw new Error("Inquiry not found.");
  }

  if (payload.status !== undefined && payload.status !== current.status) {
    const blockers = getStatusTransitionBlockers(
      {
        currentStatus: current.status as InquiryStatus,
        email: current.email,
        phone: current.phone,
        description: current.description,
        requestedOutcome: current.requestedOutcome,
        hasPreparedDocuments: current.hasPreparedDocuments,
        internalMemo: current.internalMemo,
        lawbotSnapshotPayload: current.lawbotSnapshotPayload,
        quoteCount: current._count.quotes
      },
      payload.status,
      payload.internalMemo
    );

    if (blockers.length > 0) {
      throw new InquiryStatusGuardError("상태 전환 전에 확인해야 할 항목이 남아 있습니다.", blockers);
    }
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: {
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.assignee !== undefined ? { assignee: payload.assignee.trim() || null } : {}),
      ...(payload.internalMemo !== undefined
        ? { internalMemo: payload.internalMemo.trim() || null }
        : {})
    }
  });

  try {
    await syncConsultationToNotion({
      inquiryId: updated.id,
      contactName: updated.contactName,
      contactPhone: updated.phone,
      inquiryTitle: updated.title,
      inquiryType: updated.inquiryType as InquiryType,
      inquiryStatus: updated.status as InquiryStatus,
      urgencyLevel: updated.urgencyLevel as UrgencyLevel,
      qualificationScore: updated.qualificationScore,
      generatedSummary: updated.generatedSummary,
      recommendedNextStep: updated.recommendedNextStep,
      classificationReason: updated.internalMemo ?? updated.classificationReason,
      recommendedDocuments: JSON.parse(updated.precheckRecommendedDocs || "[]"),
      serviceTags: JSON.parse(updated.serviceTags || "[]"),
      createdAt: updated.createdAt.toISOString(),
      dueDate: updated.dueDate?.toISOString() ?? null
    });
  } catch (error) {
    console.error("Failed to refresh consultation Notion sync", error);
  }

  return updated;
}

export async function appendInquiryCommunicationLog(
  id: string,
  payload: {
    channel: InquiryCommunicationChannel;
    summary: string;
    details?: string;
    responsePending: boolean;
    nextContactAt?: string;
  }
) {
  const existing = await prisma.inquiry.findUniqueOrThrow({
    where: { id }
  });

  const currentLogs = parseInquiryCommunicationLogs(existing.communicationLogs);
  const createdAt = new Date();
  const nextContactAt = payload.nextContactAt ? new Date(payload.nextContactAt) : null;
  const nextEntry: InquiryCommunicationLogEntry = {
    id: createLogId(),
    createdAt: createdAt.toISOString(),
    channel: payload.channel,
    summary: payload.summary,
    details: payload.details?.trim() ?? "",
    responsePending: payload.responsePending,
    nextContactAt: nextContactAt?.toISOString() ?? null
  };

  const updated = await prisma.inquiry.update({
    where: { id },
    data: {
      communicationLogs: JSON.stringify([nextEntry, ...currentLogs]),
      latestContactAt: createdAt,
      latestContactChannel: payload.channel,
      latestContactSummary: payload.summary,
      nextContactAt,
      responsePending: payload.responsePending
    }
  });

  try {
    await syncConsultationToNotion({
      inquiryId: updated.id,
      contactName: updated.contactName,
      contactPhone: updated.phone,
      inquiryTitle: updated.title,
      inquiryType: updated.inquiryType as InquiryType,
      inquiryStatus: updated.status as InquiryStatus,
      urgencyLevel: updated.urgencyLevel as UrgencyLevel,
      qualificationScore: updated.qualificationScore,
      generatedSummary: updated.generatedSummary,
      recommendedNextStep: updated.recommendedNextStep,
      classificationReason: updated.internalMemo ?? updated.classificationReason,
      recommendedDocuments: JSON.parse(updated.precheckRecommendedDocs || "[]"),
      serviceTags: JSON.parse(updated.serviceTags || "[]"),
      createdAt: updated.createdAt.toISOString(),
      dueDate: updated.dueDate?.toISOString() ?? null
    });
  } catch (error) {
    console.error("Failed to refresh consultation Notion sync after communication log append", error);
  }

  return updated;
}

export function getInquiryMessagePreviewSet(inquiry: {
  id: string;
  contactName: string;
  inquiryType: InquiryType;
  preferredLanguage: LanguageCode;
  urgencyLevel: UrgencyLevel;
  recommendedNextStep: string;
  precheckRecommendedDocs: string;
  dueDate?: Date | null;
}) {
  let recommendedDocumentsOverride: string[] | undefined = undefined;

  try {
    const parsed = JSON.parse(inquiry.precheckRecommendedDocs);
    recommendedDocumentsOverride = Array.isArray(parsed)
      ? parsed.map((entry) => String(entry))
      : undefined;
  } catch {
    recommendedDocumentsOverride = undefined;
  }

  const previews = buildMessagePreviewSet({
    inquiryId: inquiry.id,
    contactName: inquiry.contactName,
    inquiryType: inquiry.inquiryType,
    preferredLanguage: inquiry.preferredLanguage,
    urgencyLevel: inquiry.urgencyLevel,
    recommendedNextStep: inquiry.recommendedNextStep,
    dueDate: inquiry.dueDate
  });

  if (recommendedDocumentsOverride && recommendedDocumentsOverride.length > 0) {
    const locale = toLocale(inquiry.preferredLanguage) as Locale;
    previews[locale] = buildMessagePreview({
      inquiryId: inquiry.id,
      contactName: inquiry.contactName,
      inquiryType: inquiry.inquiryType,
      preferredLanguage: inquiry.preferredLanguage,
      urgencyLevel: inquiry.urgencyLevel,
      recommendedNextStep: inquiry.recommendedNextStep,
      recommendedDocumentsOverride,
      dueDate: inquiry.dueDate
    });
  }

  return previews;
}

export type InquiryRecord = Awaited<ReturnType<typeof getInquiryById>>;

