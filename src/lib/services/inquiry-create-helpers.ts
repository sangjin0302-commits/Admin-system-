import type { Prisma } from "@generated/prisma-client/client";

import { getIntakeEvaluator } from "@/lib/intake-evaluator";
import {
  buildMessagePreview,
  generatePreparationGuidance,
  generateReceiptMessage
} from "@/lib/message-templates/service";
import { getInquiryReceiptCode } from "@/lib/services/inquiry-receipt-code";
import { buildInquirySummary } from "@/lib/services/inquiry-summary-helpers";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";
import type { InquiryType } from "@/types/inquiry";

type IntakeEvaluation = ReturnType<ReturnType<typeof getIntakeEvaluator>["evaluate"]>;

export type CreateInquiryInput = ReturnType<typeof parseCreateInquiryInput>;

type InquiryMessageInputDraft = {
  inquiryId: string;
  contactName: string;
  inquiryType: InquiryType;
  preferredLanguage: CreateInquiryInput["preferredLanguage"];
  urgencyLevel: IntakeEvaluation["urgencyLevel"];
  recommendedNextStep: string;
  recommendedDocumentsOverride: string[];
  dueDate?: Date | undefined;
};

function toUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export function evaluateCreateInquiryInput(input: CreateInquiryInput) {
  const evaluator = getIntakeEvaluator();
  const effectiveClientType: CreateInquiryInput["clientType"] =
    input.isCorporateRequest || input.clientType === "COMPANY" ? "COMPANY" : "INDIVIDUAL";

  const evaluation = evaluator.evaluate({
    clientType: effectiveClientType,
    contactName: input.contactName,
    email: input.email,
    organizationName: toUndefined(input.organizationName),
    title: input.title,
    description: input.description,
    requestedOutcome: toUndefined(input.requestedOutcome),
    requestedInquiryType: toUndefined(input.requestedInquiryType),
    declaredUrgency: toUndefined(input.declaredUrgency),
    nationality: toUndefined(input.nationality),
    currentStatus: toUndefined(input.currentStatus),
    documentCountry: toUndefined(input.documentCountry),
    targetAgency: toUndefined(input.targetAgency),
    dueDate: toUndefined(input.dueDate),
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
    dueDate: input.dueDate ?? undefined
  });

  const messageInputDraft: InquiryMessageInputDraft = {
    inquiryId: "temporary",
    contactName: input.contactName,
    inquiryType: evaluation.inquiryType,
    preferredLanguage: input.preferredLanguage,
    urgencyLevel: evaluation.urgencyLevel,
    recommendedNextStep: evaluation.recommendedNextStep,
    recommendedDocumentsOverride: evaluation.recommendedDocuments,
    dueDate: input.dueDate ?? undefined
  };

  return {
    effectiveClientType,
    evaluation,
    generatedSummary,
    messageInputDraft
  };
}

export function buildCreateInquiryData(
  input: CreateInquiryInput,
  derived: ReturnType<typeof evaluateCreateInquiryInput>
) {
  const { effectiveClientType, evaluation, generatedSummary } = derived;

  return {
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
  } satisfies Prisma.InquiryCreateInput;
}

export async function buildFinalizedMessageArtifacts(
  created: { id: string; createdAt: Date; inquiryType: string },
  messageInputDraft: InquiryMessageInputDraft
) {
  const finalizedMessageInput = {
    ...messageInputDraft,
    inquiryId: await getInquiryReceiptCode({
      id: created.id,
      createdAt: created.createdAt,
      inquiryType: created.inquiryType as InquiryType
    })
  };

  return {
    guidance: generatePreparationGuidance(finalizedMessageInput),
    receiptMessage: generateReceiptMessage(finalizedMessageInput),
    preview: buildMessagePreview(finalizedMessageInput)
  };
}
