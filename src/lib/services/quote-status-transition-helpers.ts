import type { InquiryStatus, QuoteStatus } from "@generated/prisma-client/client";

export const quoteStatusToInquiryStatus: Record<QuoteStatus, InquiryStatus> = {
  DRAFT: "QUOTE_DRAFTED",
  READY_TO_SEND: "QUOTE_PENDING",
  SENT: "QUOTE_SENT",
  ACCEPTED: "WON",
  REJECTED: "ON_HOLD",
  EXPIRED: "ON_HOLD"
};

const quoteTransitionMap: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["DRAFT", "READY_TO_SEND", "SENT", "REJECTED", "EXPIRED"],
  READY_TO_SEND: ["READY_TO_SEND", "DRAFT", "SENT", "REJECTED", "EXPIRED"],
  SENT: ["SENT", "READY_TO_SEND", "ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: ["ACCEPTED"],
  REJECTED: ["REJECTED", "READY_TO_SEND", "SENT"],
  EXPIRED: ["EXPIRED", "READY_TO_SEND", "SENT"]
};

export function assertQuoteTransition(currentStatus: QuoteStatus, nextStatus: QuoteStatus) {
  const allowed = quoteTransitionMap[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`견적 상태를 ${currentStatus}에서 ${nextStatus}(으)로 변경할 수 없습니다.`);
  }
}
