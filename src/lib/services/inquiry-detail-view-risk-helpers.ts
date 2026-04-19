import type { InquiryStatus } from "@/types/inquiry";
import type {
  DetailRiskHighlight,
  StrengthLabel
} from "@/lib/services/inquiry-detail-view-types";

function isWithinDays(date: Date | null | undefined, days: number) {
  if (!date) return false;
  const now = new Date();
  const distance = date.getTime() - now.getTime();
  return distance >= 0 && distance <= days * 24 * 60 * 60 * 1000;
}

export function getQuickStatuses(strengthLabel: StrengthLabel): InquiryStatus[] {
  if (strengthLabel === "강함") {
    return ["QUOTE_DRAFTED", "QUOTE_PENDING", "IN_REVIEW"];
  }

  if (strengthLabel === "보통") {
    return ["CONSULTATION_REQUIRED", "IN_REVIEW", "QUOTE_DRAFTED"];
  }

  if (strengthLabel === "주의") {
    return ["IN_REVIEW", "WAITING_CONSULTATION", "ON_HOLD"];
  }

  return ["IN_REVIEW", "ON_HOLD"];
}

export function buildDetailRiskHighlights(input: {
  dueDate?: Date | null;
  responsePending: boolean;
  missingFacts: string[];
  documentChecklist: string[];
  reviewReasons: string[];
  riskFlags: string[];
}): DetailRiskHighlight[] {
  const highlights: DetailRiskHighlight[] = [];
  const now = Date.now();
  const dueDateTime = input.dueDate?.getTime() ?? null;

  if (dueDateTime !== null && dueDateTime < now) {
    highlights.push({
      title: "일정 초과",
      description: "희망 일정이 지났습니다. 고객 안내와 내부 우선순위 재정렬이 필요합니다.",
      tone: "danger"
    });
  } else if (isWithinDays(input.dueDate, 1)) {
    highlights.push({
      title: "당일 일정",
      description: "24시간 이내 일정입니다. 사실관계 확인과 다음 액션 확정이 우선입니다.",
      tone: "danger"
    });
  }

  if (input.responsePending) {
    highlights.push({
      title: "응답 대기",
      description: "고객 회신 또는 자료 회신이 대기 중입니다. 연락 후속을 먼저 점검하세요.",
      tone: "warning"
    });
  }

  if (input.missingFacts.length > 0) {
    highlights.push({
      title: "핵심 사실 누락",
      description: `누락된 핵심 사실 ${input.missingFacts.length}건이 있어 판단 오차 위험이 있습니다.`,
      tone: "danger"
    });
  }

  if (input.documentChecklist.length > 0) {
    highlights.push({
      title: "필수 자료 미확보",
      description: `Lawbot 기준 준비 자료 ${input.documentChecklist.length}건이 남아 있습니다.`,
      tone: "warning"
    });
  }

  if (input.reviewReasons.length > 0 || input.riskFlags.length > 0) {
    highlights.push({
      title: "추가 검토 신호",
      description: `추가 검토 사유 ${input.reviewReasons.length}건 / 리스크 플래그 ${input.riskFlags.length}건`,
      tone: "info"
    });
  }

  return highlights.slice(0, 4);
}

export function buildDetailImmediateActions(input: {
  dueDate?: Date | null;
  responsePending: boolean;
  missingFacts: string[];
  documentChecklist: string[];
  reviewReasons: string[];
  routeRecommendationLabel: string;
}) {
  const actions: string[] = [];
  const now = Date.now();
  const dueDateTime = input.dueDate?.getTime() ?? null;

  if (dueDateTime !== null && dueDateTime < now) {
    actions.push("기한 초과 안내 여부를 먼저 확인하고 고객 커뮤니케이션 로그를 즉시 업데이트하세요.");
  } else if (isWithinDays(input.dueDate, 1)) {
    actions.push("당일 일정 건이므로 상담/서류 확인 우선순위를 최상단으로 올리세요.");
  }

  if (input.responsePending) {
    actions.push("응답 대기 상태를 해소할 다음 연락 일정을 확정해 로그에 남기세요.");
  }

  if (input.missingFacts.length > 0) {
    actions.push(`빠진 핵심 사실(${input.missingFacts.length}건)을 기준으로 추가 질문을 먼저 보내세요.`);
  }

  if (input.documentChecklist.length > 0) {
    actions.push(`준비 자료 체크리스트(${input.documentChecklist.length}건) 요청 문안을 바로 발송하세요.`);
  }

  if (input.reviewReasons.length > 0) {
    actions.push("추가 검토 필요 사유를 내부 메모에 구조화해 상태 전환 근거를 남기세요.");
  }

  actions.push(`현재 추천 경로(${input.routeRecommendationLabel}) 기준으로 상태와 후속 액션을 맞추세요.`);

  return actions.slice(0, 5);
}

export function detailRiskToneClass(tone: DetailRiskHighlight["tone"]) {
  if (tone === "danger") return "border-danger/30 bg-danger/10 text-danger";
  if (tone === "warning") return "border-warning/30 bg-warning/10 text-warning";
  return "border-info/30 bg-info/10 text-info";
}
