import type { Prisma } from "@generated/prisma-client/client";

import { prisma } from "@/lib/prisma/client";
import { getIntakeEvaluator } from "@/lib/intake-evaluator";
import {
  buildMessagePreview,
  buildMessagePreviewSet,
  generatePreparationGuidance,
  generateReceiptMessage
} from "@/lib/message-templates/service";
import { dispatchInitialClientMessage } from "@/lib/services/client-message-service";
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
  sort?: AdminSort;
};

type InquiryListItem = Awaited<ReturnType<typeof prisma.inquiry.findMany>>[number];

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
    return `${inquiryTypeLabels[input.inquiryType][locale]} 문의입니다. 제목은 "${input.title}"이며, 수임 적합도는 ${input.qualificationScore}점입니다.${deadline ? ` 희망 일정은 ${deadline}입니다.` : ""} 핵심 내용: ${clippedDescription}`;
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
    inquiryId: created.id
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

  return updated;
}

export async function listInquiries(filters: InquiryListFilters = {}) {
  const where: Prisma.InquiryWhereInput = {
    inquiryType: filters.inquiryType,
    status: filters.status,
    urgencyLevel: filters.urgency,
    preferredLanguage: filters.language,
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
    return inquiries.sort((a: InquiryListItem, b: InquiryListItem) => {
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

export async function updateInquiryAdminFields(
  id: string,
  payload: {
    status?: InquiryStatus;
    assignee?: string;
    internalMemo?: string;
  }
) {
  return prisma.inquiry.update({
    where: { id },
    data: {
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.assignee !== undefined ? { assignee: payload.assignee.trim() || null } : {}),
      ...(payload.internalMemo !== undefined
        ? { internalMemo: payload.internalMemo.trim() || null }
        : {})
    }
  });
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
