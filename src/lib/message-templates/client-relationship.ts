import type {
  ClientRelationshipStatus,
  FollowUpActionType
} from "@/types/case";

type RelationshipMessageInput = {
  contactName: string;
  caseNumber: string;
  closeReason?: string | null;
  outcomeSummary?: string | null;
  nextFollowUpDate?: string | null;
  clientRelationshipStatus?: ClientRelationshipStatus;
};

function formatDate(value?: string | null) {
  if (!value) return "추후 일정 미정";
  return new Date(value).toLocaleDateString("ko-KR");
}

function summaryLine(summary?: string | null) {
  return summary?.trim() ? `진행 결과 요약: ${summary.trim()}` : "진행 결과 요약은 관리자 메모를 참고해 주세요.";
}

export function buildCaseClosureNoticeKo(input: RelationshipMessageInput) {
  return [
    `${input.contactName}님, 안녕하세요.`,
    "",
    `${input.caseNumber} 건의 주요 절차가 마무리되어 종결 안내드립니다.`,
    input.closeReason?.trim() ? `종결 사유: ${input.closeReason.trim()}` : null,
    summaryLine(input.outcomeSummary),
    input.nextFollowUpDate
      ? `후속 확인 예정일: ${formatDate(input.nextFollowUpDate)}`
      : "추가 확인이 필요한 사항이 생기면 언제든 다시 말씀 주세요.",
    "",
    "도움이 필요하시면 같은 창구로 편하게 연락 부탁드립니다.",
    "감사합니다."
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildReviewRequestKo(input: RelationshipMessageInput) {
  return [
    `${input.contactName}님, 안녕하세요.`,
    "",
    `${input.caseNumber} 건이 마무리되어 짧은 후기나 리뷰를 남겨주실 수 있는지 여쭙습니다.`,
    summaryLine(input.outcomeSummary),
    "진행 과정에서 도움이 되었던 점이나 아쉬웠던 점을 편하게 남겨주시면 운영 개선에도 큰 도움이 됩니다.",
    "",
    "가능하실 때 간단히 회신 부탁드립니다. 감사합니다."
  ].join("\n");
}

export function buildReferralRequestKo(input: RelationshipMessageInput) {
  return [
    `${input.contactName}님, 안녕하세요.`,
    "",
    `${input.caseNumber} 건을 함께 진행해 주셔서 감사합니다.`,
    "주변에 비슷한 행정/비자/서류 업무로 도움이 필요한 분이 있다면 편하게 소개해 주세요.",
    summaryLine(input.outcomeSummary),
    "",
    "소개 전 간단히 상황만 알려주셔도 적합한 진행 방향을 먼저 안내드리겠습니다."
  ].join("\n");
}

export function buildReengagementMessageKo(input: RelationshipMessageInput) {
  return [
    `${input.contactName}님, 안녕하세요.`,
    "",
    `${input.caseNumber} 건 이후 추가로 도와드릴 일이 없는지 안부차 연락드립니다.`,
    input.nextFollowUpDate
      ? `후속 확인 기준일은 ${formatDate(input.nextFollowUpDate)}로 보고 있습니다.`
      : "필요 시 바로 검토할 수 있도록 현재 상황만 간단히 알려주셔도 됩니다.",
    "체류, 서류 갱신, 추가 행정절차 등 이어지는 업무가 있으면 부담 없이 말씀 주세요.",
    "",
    "편하신 시간에 회신 주시면 이어서 도와드리겠습니다."
  ].join("\n");
}

export function buildRelationshipFollowUpDraftKo(
  type: FollowUpActionType,
  input: RelationshipMessageInput
) {
  if (type === "REVIEW_REQUEST") {
    return buildReviewRequestKo(input);
  }

  if (type === "REFERRAL_CHECK") {
    return buildReferralRequestKo(input);
  }

  return buildReengagementMessageKo(input);
}
