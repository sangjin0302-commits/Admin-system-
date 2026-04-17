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
  if (min === max) {
    return formatCurrency(min);
  }

  return `${formatCurrency(min)} ~ ${formatCurrency(max)}`;
}

export function buildQuoteSendDraftKo(input: QuoteMessageInput) {
  return [
    `${input.contactName}님, 문의하신 건의 견적 초안을 안내드립니다.`,
    `분야: ${inquiryTypeLabels[input.inquiryType].ko}`,
    `예상 보수 범위: ${rangeText(input.totalMin, input.totalMax)}`,
    "",
    "[결제 구조]",
    input.paymentSummary,
    "",
    "최종 금액은 서류 검토 결과와 제출 기관 요구사항에 따라 일부 조정될 수 있습니다.",
    "진행 의사가 있으시면 계약 준비 단계로 이어서 안내드리겠습니다.",
  ].join("\n");
}

export function buildQuoteSendDraftEn(input: QuoteMessageInput) {
  return [
    `Dear ${input.contactName}, your quote draft is ready.`,
    `Category: ${inquiryTypeLabels[input.inquiryType].en}`,
    `Estimated fee range: ${rangeText(input.totalMin, input.totalMax)}`,
    "",
    "[Payment Structure]",
    input.paymentSummary,
    "",
    "The final amount may change after document review and filing authority checks.",
    "If you would like to proceed, we will guide you to the contract preparation step.",
  ].join("\n");
}

export function buildAcceptedNoticeDraftKo(input: QuoteMessageInput) {
  return [
    `${input.contactName}님, 견적 수락이 확인되었습니다.`,
    `분야: ${inquiryTypeLabels[input.inquiryType].ko}`,
    input.caseNumber ? `사건 번호: ${input.caseNumber}` : "",
    "",
    "계약 초안과 내부 사건 인계 준비를 순차적으로 진행하겠습니다.",
    "세부 절차와 일정은 서류 검토 결과에 따라 확정됩니다.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAcceptedNoticeDraftEn(input: QuoteMessageInput) {
  return [
    `Dear ${input.contactName}, your quote acceptance has been recorded.`,
    `Category: ${inquiryTypeLabels[input.inquiryType].en}`,
    input.caseNumber ? `Case number: ${input.caseNumber}` : "",
    "",
    "We are preparing the contract draft and internal case handoff.",
    "The detailed process and timeline will be confirmed after document review.",
  ]
    .filter(Boolean)
    .join("\n");
}
