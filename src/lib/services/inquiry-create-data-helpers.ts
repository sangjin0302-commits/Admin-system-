import type { Prisma } from "@generated/prisma-client/client";
import type {
  CreateInquiryInput,
  EvaluatedCreateInquiry
} from "@/lib/services/inquiry-create-types";

export function buildCreateInquiryData(
  input: CreateInquiryInput,
  derived: EvaluatedCreateInquiry
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
