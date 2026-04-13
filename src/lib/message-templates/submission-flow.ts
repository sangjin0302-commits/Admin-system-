import { caseStageLabels, type CaseStage } from "@/types/case";

type SubmissionMessageInput = {
  contactName: string;
  caseNumber: string;
  currentStage: CaseStage;
  packageNumber?: string;
  submittedTo?: string;
  supplementSummary?: string;
  missingDocuments: string[];
  nextDeadlineLabel?: string;
  nextDeadlineDate?: string;
};

function formatDateKo(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function buildSubmissionCompletedKo(input: SubmissionMessageInput) {
  return [
    `${input.contactName}님, 서류 제출이 완료되었습니다.`,
    `사건번호: ${input.caseNumber}`,
    `제출 패키지: ${input.packageNumber ?? "-"}`,
    `제출처: ${input.submittedTo ?? "관계기관"}`,
    "",
    "접수 결과 확인 후 다음 절차를 안내드리겠습니다."
  ].join("\n");
}

export function buildSupplementReceivedKo(input: SubmissionMessageInput) {
  return [
    `${input.contactName}님, 보완 요청이 접수되었습니다.`,
    `사건번호: ${input.caseNumber}`,
    input.supplementSummary ? `요청 요약: ${input.supplementSummary}` : "요청 요약: 보완 요청 내역 확인 중",
    "",
    "필요 자료를 정리해 순차적으로 안내드리겠습니다."
  ].join("\n");
}

export function buildSupplementResubmissionKo(input: SubmissionMessageInput) {
  const missing =
    input.missingDocuments.length > 0 ? input.missingDocuments.join(", ") : "요청된 보완 항목";
  return [
    `${input.contactName}님, 보완 서류 재제출 안내드립니다.`,
    `사건번호: ${input.caseNumber}`,
    `재제출 필요 항목: ${missing}`,
    "",
    "자료 수령 후 재제출 패키지를 준비하겠습니다."
  ].join("\n");
}

export function buildDeadlineInternalAlertKo(input: SubmissionMessageInput) {
  return [
    `[내부 기한 알림] ${input.caseNumber}`,
    `현재 단계: ${caseStageLabels[input.currentStage]}`,
    `다음 기한: ${input.nextDeadlineLabel ?? "미설정"} (${formatDateKo(input.nextDeadlineDate)})`,
    input.supplementSummary ? `보완 메모: ${input.supplementSummary}` : "보완 메모: 없음",
    "",
    "마감 전 제출/보완 진행 상황을 점검하세요."
  ].join("\n");
}
