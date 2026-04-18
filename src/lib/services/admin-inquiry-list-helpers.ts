export type InquiryViewMode = "list" | "board";

export type InquiryListScoringSource = {
  status: string;
  urgencyLevel: string;
  dueDate?: Date | null;
  nextContactAt?: Date | null;
  responsePending?: boolean;
  hasPreparedDocuments?: boolean;
};

export function isWithinDays(date: Date | null | undefined, days: number) {
  if (!date) return false;
  const now = new Date();
  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= days * 24 * 60 * 60 * 1000;
}

export function getInquiryActionScore(item: InquiryListScoringSource) {
  let score = 0;

  if (item.urgencyLevel === "CRITICAL") score += 100;
  if (item.responsePending) score += 35;
  if (isWithinDays(item.dueDate, 1)) score += 30;
  if (isWithinDays(item.nextContactAt, 1)) score += 26;
  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)) score += 22;
  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)) score += 18;
  if (!item.hasPreparedDocuments && item.status !== "WON" && item.status !== "CLOSED") score += 16;
  if (item.status === "IN_REVIEW") score += 8;

  return score;
}

export function buildQueueDescription(item: InquiryListScoringSource) {
  if (item.urgencyLevel === "CRITICAL" || isWithinDays(item.dueDate, 1)) {
    return "긴급도나 일정 기준으로 가장 먼저 확인할 건입니다.";
  }

  if (!item.hasPreparedDocuments && item.status !== "WON" && item.status !== "CLOSED") {
    return "기본 서류 보유 여부부터 먼저 확인하는 흐름이 좋습니다.";
  }

  if (["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"].includes(item.status)) {
    return "견적 작성 또는 발송 후속조치를 이어가야 합니다.";
  }

  if (["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"].includes(item.status)) {
    return "상담 연결 또는 후속 응답이 필요한 상태입니다.";
  }

  if (item.responsePending) {
    return "고객 회신이나 다음 연락 시점 확인이 필요합니다.";
  }

  return "운영 우선순위 기준으로 상단에 배치된 건입니다.";
}

export function getPriorityScoreTone(score: number) {
  if (score >= 100) return "urgent" as const;
  if (score >= 60) return "quote" as const;
  if (score >= 35) return "consult" as const;
  return "default" as const;
}

export function getLawbotConnectionStatus() {
  const hasAnalyzeUrl = Boolean(process.env.LAWBOT_ANALYZE_URL?.trim());
  const hasAnalyzeToken = Boolean(process.env.LAWBOT_ANALYZE_TOKEN?.trim());

  if (hasAnalyzeUrl && hasAnalyzeToken) {
    return {
      label: "실제 분석 연결 가능",
      toneClassName: "bg-success/10 text-success",
      detail: "사건 상세에서 Lawbot 분석 호출과 결과 스냅샷 갱신을 바로 시도할 수 있습니다."
    };
  }

  if (hasAnalyzeUrl) {
    return {
      label: "주소만 연결됨",
      toneClassName: "bg-warning/10 text-warning",
      detail: "분석 주소는 등록되어 있지만 토큰이 없어서 운영 환경에서는 안정적인 호출이 어렵습니다."
    };
  }

  return {
    label: "아직 미연결",
    toneClassName: "bg-danger/10 text-danger",
    detail: "Lawbot UI와 저장 구조는 준비되어 있지만 API 호출은 아직 비활성 상태입니다."
  };
}

export function parseInquiryViewMode(value: string | undefined): InquiryViewMode {
  return value === "board" ? "board" : "list";
}

export function buildInquiryListHref(
  params: Record<string, string | string[] | undefined>,
  viewMode: InquiryViewMode
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "view") continue;
    if (typeof value === "string" && value.trim().length > 0) {
      query.set(key, value);
    }
  }

  query.set("view", viewMode);
  return `/admin/inquiries?${query.toString()}`;
}

export function buildInquiryPresetHref(
  viewMode: InquiryViewMode,
  params: Record<string, string>
) {
  const query = new URLSearchParams({ ...params, view: viewMode });
  return `/admin/inquiries?${query.toString()}`;
}
