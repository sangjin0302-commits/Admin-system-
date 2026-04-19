import { getIntakeEvaluator } from "@/lib/intake-evaluator";
import { buildInquirySummary } from "@/lib/services/inquiry-summary-helpers";
import type {
  CreateInquiryInput,
  EvaluatedCreateInquiry,
  InquiryMessageInputDraft
} from "@/lib/services/inquiry-create-types";

export type {
  CreateInquiryInput,
  EvaluatedCreateInquiry,
  InquiryMessageInputDraft,
  IntakeEvaluation
} from "@/lib/services/inquiry-create-types";
export { buildCreateInquiryData } from "@/lib/services/inquiry-create-data-helpers";
export { buildFinalizedMessageArtifacts } from "@/lib/services/inquiry-create-message-artifact-helpers";

function toUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export function evaluateCreateInquiryInput(input: CreateInquiryInput): EvaluatedCreateInquiry {
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
