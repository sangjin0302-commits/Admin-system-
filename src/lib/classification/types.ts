import type {
  ClientType,
  InquiryType,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";

export interface ClassificationInput {
  clientType: ClientType;
  contactName: string;
  email: string;
  organizationName?: string;
  title: string;
  description: string;
  nationality?: string;
  currentStatus?: string;
  documentCountry?: string;
  targetAgency?: string;
  dueDate?: Date;
  preferredLanguage: LanguageCode;
}

export interface ClassificationResult {
  inquiryType: InquiryType;
  urgencyLevel: UrgencyLevel;
  confidence: number;
  qualificationScore: number;
  serviceTags: string[];
  classificationReason: string;
  recommendedNextStep: string;
}

export interface InquiryClassifier {
  classify(input: ClassificationInput): ClassificationResult;
}
