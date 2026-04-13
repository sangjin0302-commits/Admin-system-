import type {
  ClientType,
  InquiryStatus,
  InquiryType,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";

export interface IntakeEvaluationInput {
  clientType: ClientType;
  contactName: string;
  email: string;
  organizationName?: string;
  title: string;
  description: string;
  requestedOutcome?: string;
  requestedInquiryType?: InquiryType;
  declaredUrgency?: UrgencyLevel;
  nationality?: string;
  currentStatus?: string;
  documentCountry?: string;
  targetAgency?: string;
  dueDate?: Date;
  preferredLanguage: LanguageCode;
  hasPreparedDocuments: boolean;
  needsTranslation: boolean;
  isCorporateRequest: boolean;
}

export interface IntakeEvaluationResult {
  inquiryType: InquiryType;
  urgencyLevel: UrgencyLevel;
  confidence: number;
  qualificationScore: number;
  consultationRequired: boolean;
  status: InquiryStatus;
  serviceTags: string[];
  classificationReason: string;
  recommendedNextStep: string;
  recommendedDocuments: string[];
  riskComplexityHint: string;
}

export interface IntakeEvaluator {
  evaluate(input: IntakeEvaluationInput): IntakeEvaluationResult;
}
