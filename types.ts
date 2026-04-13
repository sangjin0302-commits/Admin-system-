import type { InquiryType, LanguageCode, Locale, UrgencyLevel } from "@/types/inquiry";

export interface MessageTemplateSection {
  heading: string;
  body: string;
}

export interface ClientMessagePreview {
  locale: Locale;
  subject: string;
  sections: MessageTemplateSection[];
  recommendedDocuments: string[];
  fullText: string;
  caution: string;
  nextStep: string;
}

export interface BuildMessageInput {
  inquiryId: string;
  contactName: string;
  inquiryType: InquiryType;
  preferredLanguage: LanguageCode;
  urgencyLevel: UrgencyLevel;
  recommendedNextStep: string;
  recommendedDocumentsOverride?: string[];
  dueDate?: Date | null;
}
