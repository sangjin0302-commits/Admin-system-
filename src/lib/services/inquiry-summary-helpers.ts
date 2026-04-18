import { formatDate } from "@/lib/utils";
import type {
  InquiryType,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";
import {
  inquiryTypeLabels,
  toLocale
} from "@/types/inquiry";

export function buildInquirySummary(input: {
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
    return `${inquiryTypeLabels[input.inquiryType][locale]} 문의입니다. 제목은 "${input.title}"이며, 수임 적합도는 ${input.qualificationScore}점입니다.${deadline ? ` 희망 일정은 ${deadline}입니다.` : ""} 상담 내용: ${clippedDescription}`;
  }

  return `${inquiryTypeLabels[input.inquiryType][locale]} inquiry. Title: "${input.title}". Qualification score: ${input.qualificationScore}.${deadline ? ` Target date: ${deadline}.` : ""} Summary: ${clippedDescription}`;
}
