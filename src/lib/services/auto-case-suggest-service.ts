/**
 * 문의 → 사건 전환 자동 제안 서비스.
 *
 * 견적 수락 후 사건 미생성, 또는 대화 3회+ 진행 시 사건 전환 제안.
 * Feature flag: `auto_case_suggest`
 */

import { prisma } from "@/lib/prisma/client";
import { InquiryStatus } from "@generated/prisma-client/client";

export async function shouldSuggestCaseCreation(inquiryId: string): Promise<{
  suggest: boolean;
  reason: string;
  suggestedCategory?: string;
}> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      status: true,
      inquiryType: true,
      caseMatters: {
        select: { id: true },
      },
    },
  });

  if (!inquiry) {
    return { suggest: false, reason: "문의를 찾을 수 없습니다." };
  }

  // Already linked to a case
  if (inquiry.caseMatters.length > 0) {
    return { suggest: false, reason: "이미 사건이 연결되어 있습니다." };
  }

  // Rule 1: QUOTE_SENT or WON without linked case
  if (
    inquiry.status === InquiryStatus.QUOTE_SENT ||
    inquiry.status === InquiryStatus.WON
  ) {
    return {
      suggest: true,
      reason: "견적 발송/수임 후 사건 미생성",
      suggestedCategory: inquiry.inquiryType ?? undefined,
    };
  }

  // Rule 2: 3+ events (messages/interactions) and not WON/CLOSED
  if (
    inquiry.status !== InquiryStatus.CLOSED
  ) {
    // CaseEvent doesn't have inquiryId — count via related caseMatters
    const eventCount = await prisma.caseEvent.count({
      where: {
        caseMatter: {
          inquiryId,
        },
      },
    });

    if (eventCount >= 3) {
      return {
        suggest: true,
        reason: "대화 3회+ 진행 중",
        suggestedCategory: inquiry.inquiryType ?? undefined,
      };
    }
  }

  return { suggest: false, reason: "전환 조건 미충족" };
}
