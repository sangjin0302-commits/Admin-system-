import type { WorkflowStep } from "@/lib/services/inquiry-detail-core-types";
import type { InquiryStatus } from "@/types/inquiry";

export function getWorkflowStep(input: {
  inquiryStatus: InquiryStatus;
  quoteStatus?: string | null;
  caseStage?: string | null;
}): WorkflowStep {
  if (input.inquiryStatus === "CLOSED" || input.caseStage === "CLOSED" || input.caseStage === "COMPLETED") {
    return "CLOSED";
  }

  if (input.caseStage && input.caseStage !== "CONTRACT_PREPARATION" && input.caseStage !== "ON_HOLD") {
    return "CASEWORK";
  }

  if (
    input.inquiryStatus === "WON" ||
    input.quoteStatus === "ACCEPTED" ||
    input.caseStage === "CONTRACT_PREPARATION"
  ) {
    return "CONTRACT";
  }

  if (
    input.inquiryStatus === "QUOTE_DRAFTED" ||
    input.inquiryStatus === "QUOTE_PENDING" ||
    input.inquiryStatus === "QUOTE_SENT" ||
    Boolean(input.quoteStatus)
  ) {
    return "QUOTING";
  }

  if (
    input.inquiryStatus === "PRE_DIAGNOSED" ||
    input.inquiryStatus === "CONSULTATION_REQUIRED" ||
    input.inquiryStatus === "IN_REVIEW" ||
    input.inquiryStatus === "WAITING_CONSULTATION"
  ) {
    return "ANALYZED";
  }

  return "RECEIVED";
}
