import type { WorkQueueType } from "@/lib/work-queue/types";

type WorkQueueDraftInput = {
  contactName: string;
  inquiryTitle: string;
  caseNumber?: string;
  dueLabel?: string;
  dueDate?: string;
  missingDocuments?: string[];
  supplementSummary?: string;
  quoteRangeText?: string;
};

function formatDateKo(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

export function buildWorkQueueMessageDraft(type: WorkQueueType, input: WorkQueueDraftInput) {
  switch (type) {
    case "DEADLINE_DUE_SOON":
      return [
        `[내부 알림] ${input.caseNumber ?? "사건"} 기한 임박`,
        `고객: ${input.contactName}`,
        `사안: ${input.inquiryTitle}`,
        `기한: ${input.dueLabel ?? "주요 기한"} (${formatDateKo(input.dueDate)})`,
        "",
        "오늘 중 진행상태와 제출 준비 여부를 확인하세요."
      ].join("\n");

    case "DEADLINE_OVERDUE":
      return [
        `[내부 긴급] ${input.caseNumber ?? "사건"} 기한 경과`,
        `고객: ${input.contactName}`,
        `사안: ${input.inquiryTitle}`,
        `경과 기한: ${input.dueLabel ?? "주요 기한"} (${formatDateKo(input.dueDate)})`,
        "",
        "즉시 보완/제출 대응 방안을 확인하고 내부 메모를 갱신하세요."
      ].join("\n");

    case "SUPPLEMENT_PENDING":
      return [
        `${input.contactName}님, 보완 요청 건 진행 안내드립니다.`,
        `사건번호: ${input.caseNumber ?? "-"}`,
        input.supplementSummary
          ? `요청 요약: ${input.supplementSummary}`
          : "요청 요약: 보완 항목 확인이 필요합니다.",
        input.dueDate ? `보완 마감: ${formatDateKo(input.dueDate)}` : "",
        "",
        "요청 항목 확인 후 제출 가능한 서류를 우선 정리해 회신드리겠습니다."
      ]
        .filter(Boolean)
        .join("\n");

    case "MISSING_DOCUMENTS":
      return [
        `${input.contactName}님, 서류 보완 요청드립니다.`,
        `사안: ${input.inquiryTitle}`,
        input.missingDocuments && input.missingDocuments.length > 0
          ? `누락 서류: ${input.missingDocuments.join(", ")}`
          : "누락 서류: 확인 필요",
        "",
        "서류 수령 즉시 다음 절차를 진행하겠습니다."
      ].join("\n");

    case "QUOTE_FOLLOW_UP":
      return [
        `${input.contactName}님, 견적 후속 안내드립니다.`,
        `사안: ${input.inquiryTitle}`,
        input.quoteRangeText ? `견적 범위: ${input.quoteRangeText}` : "",
        "",
        "검토 결과와 진행 의사를 알려주시면 계약 준비를 도와드리겠습니다."
      ]
        .filter(Boolean)
        .join("\n");

    case "CONTRACT_PENDING":
      return [
        `[내부 체크] 수락건 후속조치 필요`,
        `고객: ${input.contactName}`,
        `사안: ${input.inquiryTitle}`,
        "",
        "계약 초안/사건 생성/다음 단계 진행 여부를 확인해 주세요."
      ].join("\n");

    default:
      return null;
  }
}
