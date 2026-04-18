import {
  buildMessagePreview,
  buildMessagePreviewSet
} from "@/lib/message-templates/service";
import { parseJsonArray } from "@/lib/utils";
import type {
  InquiryType,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";
import {
  toLocale,
  type Locale
} from "@/types/inquiry";

export type InquiryMessagePreviewInput = {
  id: string;
  contactName: string;
  inquiryType: InquiryType;
  preferredLanguage: LanguageCode;
  urgencyLevel: UrgencyLevel;
  recommendedNextStep: string;
  precheckRecommendedDocs: string;
  dueDate?: Date | null;
};

function parseStringArray(value: string | null | undefined) {
  return parseJsonArray(value).map((entry) => String(entry));
}

export function buildInquiryMessagePreviewSetForInquiry(
  inquiry: InquiryMessagePreviewInput
) {
  let recommendedDocumentsOverride: string[] | undefined = undefined;

  const parsedDocs = parseStringArray(inquiry.precheckRecommendedDocs);
  recommendedDocumentsOverride = parsedDocs.length > 0 ? parsedDocs : undefined;

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
