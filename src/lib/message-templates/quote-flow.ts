import { inquiryTypeLabels, type InquiryType } from "@/types/inquiry";
import { formatCurrency } from "@/lib/quote-engine/utils";

type QuoteMessageInput = {
  contactName: string;
  inquiryType: InquiryType;
  totalMin: number;
  totalMax: number;
  paymentSummary: string;
  caseNumber?: string | null;
};

function rangeText(min: number, max: number) {
  if (min === max) return `${formatCurrency(min)}원`;
  return `${formatCurrency(min)}원 ~ ${formatCurrency(max)}원`;
}

export function buildQuoteSendDraftKo(input: QuoteMessageInput) {
  return [
    `${input.contactName}님, 문의 주신 건의 견적 초안을 안내드립니다.`,
    `분류 유형: ${inquiryTypeLabels[input.inquiryType].ko}`,
    `예상 보수 범위: ${rangeText(input.totalMin, input.totalMax)}`,
    "",
    "[납입 구조]",
    input.paymentSummary,
    "",
    "상기 금액은 제출처와 서류 확인에 따라 일부 조정될 수 있습니다.",
    "검토 후 진행 의사를 회신해 주시면 계약 준비 단계로 안내드리겠습니다."
  ].join("\n");
}

export function buildQuoteSendDraftEn(input: QuoteMessageInput) {
  return [
    `Dear ${input.contactName}, your quote draft is ready.`,
    `Classified type: ${inquiryTypeLabels[input.inquiryType].en}`,
    `Estimated fee range: ${rangeText(input.totalMin, input.totalMax)}`,
    "",
    "[Payment Structure]",
    input.paymentSummary,
    "",
    "The amount may be adjusted after final document and filing authority checks.",
    "If you accept the quote, we will proceed to the contract preparation step."
  ].join("\n");
}

export function buildAcceptedNoticeDraftKo(input: QuoteMessageInput) {
  return [
    `${input.contactName}님, 견적 수락이 확인되었습니다.`,
    `분류 유형: ${inquiryTypeLabels[input.inquiryType].ko}`,
    input.caseNumber ? `사건번호: ${input.caseNumber}` : "",
    "",
    "계약 초안 준비를 시작하며, 세부 특약 및 일정은 관리자 검토 후 최종 확정됩니다.",
    "개별 사안은 서류 검토 결과에 따라 절차가 달라질 수 있습니다."
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAcceptedNoticeDraftEn(input: QuoteMessageInput) {
  return [
    `Dear ${input.contactName}, your quote acceptance has been recorded.`,
    `Classified type: ${inquiryTypeLabels[input.inquiryType].en}`,
    input.caseNumber ? `Case number: ${input.caseNumber}` : "",
    "",
    "We are preparing the contract draft and internal case handoff.",
    "The final process may vary after document-level review."
  ]
    .filter(Boolean)
    .join("\n");
}
