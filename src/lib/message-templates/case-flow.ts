import type { CaseStage } from "@/types/case";
import { caseStageLabels } from "@/types/case";
import { inquiryTypeLabels, type InquiryType } from "@/types/inquiry";

type CaseMessageInput = {
  contactName: string;
  caseNumber: string;
  inquiryType: InquiryType;
  currentStage: CaseStage;
  requiredCount: number;
  receivedCount: number;
  missingDocuments: string[];
  latestPackageNumber?: string;
  latestSubmissionTarget?: string;
  openSupplementSummary?: string;
  nextDeadlineLabel?: string;
  nextDeadlineDate?: string;
};

function formatDateKo(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function buildContractDocumentGuideKo(input: CaseMessageInput) {
  return [
    `${input.contactName}님, 계약 준비 단계 안내드립니다.`,
    `사건번호: ${input.caseNumber}`,
    `업무 유형: ${inquiryTypeLabels[input.inquiryType].ko}`,
    "",
    "아래 필요서류를 순차적으로 전달해 주시면 검토 후 접수 준비를 진행하겠습니다.",
    `현재 수령 현황: ${input.receivedCount}/${input.requiredCount}`
  ].join("\n");
}

export function buildMissingDocumentsRequestKo(input: CaseMessageInput) {
  const missing = input.missingDocuments.length > 0 ? input.missingDocuments.join(", ") : "누락 서류 없음";
  return [
    `${input.contactName}님, 누락 서류 보완 요청드립니다.`,
    `사건번호: ${input.caseNumber}`,
    "",
    `현재 누락: ${missing}`,
    "서류 수령 후 즉시 다음 단계로 진행하겠습니다."
  ].join("\n");
}

export function buildCaseStatusUpdateKo(input: CaseMessageInput) {
  return [
    `${input.contactName}님, 사건 진행상태가 업데이트되었습니다.`,
    `사건번호: ${input.caseNumber}`,
    `현재 단계: ${caseStageLabels[input.currentStage]}`,
    "",
    "세부 검토 결과에 따라 추가 안내를 드리겠습니다."
  ].join("\n");
}

export function buildSupplementRequestKo(input: CaseMessageInput) {
  const missing = input.missingDocuments.length > 0 ? input.missingDocuments.join(", ") : "추가 확인 필요 항목";
  return [
    `${input.contactName}님, 보완 요청 사항 안내드립니다.`,
    `사건번호: ${input.caseNumber}`,
    "",
    `보완 필요 항목: ${missing}`,
    "보완 자료 확인 후 재심사 및 제출 절차를 이어가겠습니다."
  ].join("\n");
}

export function buildSubmissionCompletedNoticeKo(input: CaseMessageInput) {
  return [
    `${input.contactName}님, 제출이 완료되었습니다.`,
    `사건번호: ${input.caseNumber}`,
    `제출 패키지: ${input.latestPackageNumber ?? "-"}`,
    `제출처: ${input.latestSubmissionTarget ?? "관계기관"}`,
    "",
    "접수 결과 및 추가 보완 필요 여부를 확인하여 다음 안내를 드리겠습니다."
  ].join("\n");
}

export function buildSupplementReceivedNoticeKo(input: CaseMessageInput) {
  return [
    `${input.contactName}님, 보완 요청이 접수되었습니다.`,
    `사건번호: ${input.caseNumber}`,
    input.openSupplementSummary ? `요청 요약: ${input.openSupplementSummary}` : "요청 요약: 보완 요청 확인 필요",
    "",
    "요청 항목을 정리해 필요한 자료를 다시 안내드리겠습니다."
  ].join("\n");
}

export function buildSupplementResubmissionRequestKo(input: CaseMessageInput) {
  const missing = input.missingDocuments.length > 0 ? input.missingDocuments.join(", ") : "보완 요청 항목";
  return [
    `${input.contactName}님, 보완 서류 재제출 안내드립니다.`,
    `사건번호: ${input.caseNumber}`,
    `재제출 필요 항목: ${missing}`,
    "",
    "보완 자료 수령 즉시 재제출 패키지를 준비하겠습니다."
  ].join("\n");
}

export function buildDeadlineAlertInternalKo(input: CaseMessageInput) {
  return [
    `[내부 알림] 사건 ${input.caseNumber}`,
    `현재 단계: ${caseStageLabels[input.currentStage]}`,
    `다음 핵심 기한: ${input.nextDeadlineLabel ?? "미설정"} / ${formatDateKo(input.nextDeadlineDate)}`,
    input.openSupplementSummary ? `진행 메모: ${input.openSupplementSummary}` : "진행 메모: 보완 요청 여부 확인 필요",
    "",
    "기한 임박 전 제출/보완 패키지 준비 상태를 점검하세요."
  ].join("\n");
}
