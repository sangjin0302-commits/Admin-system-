import {
  loadInquiryDetailPageContext,
  type InquiryDetailPageContext
} from "@/lib/services/inquiry-detail-page-data-context-helpers";
import { buildInquiryDetailPageResult } from "@/lib/services/inquiry-detail-page-data-result-helpers";
import type { InquiryDetailRecord } from "@/lib/services/inquiry-detail-page-data-shared-types";

export async function buildInquiryDetailPageData(inquiry: InquiryDetailRecord) {
  const context = await loadInquiryDetailPageContext(inquiry);
  return buildInquiryDetailPageResult(context);
}

export type { InquiryDetailPageContext };
