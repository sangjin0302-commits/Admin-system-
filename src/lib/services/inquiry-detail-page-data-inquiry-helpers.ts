import { parseJsonArray } from "@/lib/utils";
import {
  normalizeClientType,
  normalizeInquiryStatus,
  normalizeInquiryType,
  normalizeLanguageCode,
  normalizeUrgencyLevel
} from "@/types/inquiry";
import type { InquiryDetailRecord } from "@/lib/services/inquiry-detail-page-data-shared-types";

export function extractInquiryTagLists(inquiry: InquiryDetailRecord) {
  const tags = parseJsonArray(inquiry.serviceTags)
    .map((entry) => String(entry).trim())
    .filter(Boolean);
  const precheckDocs = parseJsonArray(inquiry.precheckRecommendedDocs)
    .map((entry) => String(entry).trim())
    .filter(Boolean);

  return { tags, precheckDocs };
}

export function buildInquiryNormalizedMeta(inquiry: InquiryDetailRecord) {
  const inquiryStatus = normalizeInquiryStatus(inquiry.status);
  const inquiryUrgency = normalizeUrgencyLevel(inquiry.urgencyLevel);

  return {
    inquiryStatus,
    inquiryUrgency,
    inquiryType: normalizeInquiryType(inquiry.inquiryType),
    inquiryLanguage: normalizeLanguageCode(inquiry.preferredLanguage),
    inquiryClientType: normalizeClientType(inquiry.clientType),
    requestedInquiryType: normalizeInquiryType(inquiry.requestedInquiryType ?? "UNKNOWN"),
    declaredUrgency: normalizeUrgencyLevel(inquiry.declaredUrgency ?? "MEDIUM")
  };
}
