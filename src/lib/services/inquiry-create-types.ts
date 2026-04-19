import type { InquiryType } from "@/types/inquiry";
import { getIntakeEvaluator } from "@/lib/intake-evaluator";
import { parseCreateInquiryInput } from "@/lib/validation/inquiry-safe";

export type IntakeEvaluation = ReturnType<ReturnType<typeof getIntakeEvaluator>["evaluate"]>;
export type CreateInquiryInput = ReturnType<typeof parseCreateInquiryInput>;

export type InquiryMessageInputDraft = {
  inquiryId: string;
  contactName: string;
  inquiryType: InquiryType;
  preferredLanguage: CreateInquiryInput["preferredLanguage"];
  urgencyLevel: IntakeEvaluation["urgencyLevel"];
  recommendedNextStep: string;
  recommendedDocumentsOverride: string[];
  dueDate?: Date | undefined;
};

export type EvaluatedCreateInquiry = {
  effectiveClientType: CreateInquiryInput["clientType"];
  evaluation: IntakeEvaluation;
  generatedSummary: string;
  messageInputDraft: InquiryMessageInputDraft;
};
