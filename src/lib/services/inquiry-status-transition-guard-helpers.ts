import type { InquiryStatus } from "@/types/inquiry";
import type {
  InquiryStatusGuardPreview,
  StatusTransitionGuardContext
} from "@/lib/services/inquiry-guard-types";

function parseLawbotSnapshotPayload(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      review_required_reasons?: string[];
      critical_missing_facts?: string[];
      risk_flags?: string[];
      document_checklist?: string[];
    };
  } catch {
    return null;
  }
}

export function getStatusTransitionBlockers(
  context: StatusTransitionGuardContext,
  targetStatus: InquiryStatus,
  nextInternalMemo?: string | null,
  statusChangeNote?: string
) {
  const blockers: string[] = [];
  const lawbotPayload = parseLawbotSnapshotPayload(context.lawbotSnapshotPayload);
  const documentChecklist = lawbotPayload?.document_checklist ?? [];
  const missingFacts = lawbotPayload?.critical_missing_facts ?? [];
  const reviewReasons = lawbotPayload?.review_required_reasons ?? [];
  const riskFlags = lawbotPayload?.risk_flags ?? [];
  const memo = (nextInternalMemo ?? context.internalMemo ?? "").trim();
  const transitionNote = statusChangeNote?.trim() ?? "";

  if (targetStatus === "CONSULTATION_REQUIRED" || targetStatus === "WAITING_CONSULTATION") {
    if (!context.email?.trim() && !context.phone?.trim()) {
      blockers.push("상담 진행 전에는 이메일 또는 전화번호 중 최소 한 가지 연락 수단이 필요합니다.");
    }
    if (context.description.trim().length < 20) {
      blockers.push("상담 진행 전에는 고객 문의의 상세 내용을 조금 더 구체적으로 입력해 주세요.");
    }
  }

  if (targetStatus === "ON_HOLD") {
    if (memo.length < 12) {
      blockers.push("보류 상태로 전환하려면 내부 메모에 보류 사유를 조금 더 구체적으로 남겨 주세요.");
    }
  }

  if (targetStatus === "QUOTE_DRAFTED" || targetStatus === "QUOTE_PENDING" || targetStatus === "QUOTE_SENT") {
    if (!context.requestedOutcome?.trim()) {
      blockers.push("견적 단계로 넘어가기 전에 고객이 원하는 결과를 먼저 정리해 주세요.");
    }
    if (!context.hasPreparedDocuments) {
      blockers.push("보유 서류 여부가 미확인 상태입니다. 견적 전환 전에 자료 확인이 필요합니다.");
    }
    if (documentChecklist.length > 0) {
      blockers.push("Lawbot 기준 추가로 받아야 할 준비 자료가 남아 있어 견적 전환 전 보완이 필요합니다.");
    }
    if (missingFacts.length > 0 || reviewReasons.length > 0) {
      blockers.push("Lawbot 기준 누락 사실 또는 추가 검토 사유가 남아 있습니다.");
    }
  }

  if (targetStatus === "QUOTE_SENT") {
    if (context.quoteCount === 0) {
      blockers.push("견적 발송 상태로 변경하기 전 최소 1건의 견적 초안을 먼저 생성해 주세요.");
    }
  }

  if (targetStatus === "WON") {
    if (context.quoteCount === 0) {
      blockers.push("수임 상태 전환 전에는 확정된 견적 또는 계약 흐름이 필요합니다.");
    }
    if (documentChecklist.length > 0 || missingFacts.length > 0 || riskFlags.length > 0) {
      blockers.push("수임 전환 전에 남아 있는 자료 부족 또는 리스크 신호를 먼저 정리해 주세요.");
    }
    if (transitionNote.length < 6 && memo.length < 12) {
      blockers.push("수임 전환 전에는 내부 메모 또는 상태 변경 사유를 충분히 남겨 주세요.");
    }
  }

  if (targetStatus === "CLOSED") {
    if (memo.length < 12) {
      blockers.push("종결 처리 전에는 내부 메모에 종결 사유 또는 마무리 내용을 남겨 주세요.");
    }
  }

  return blockers;
}

export function buildInquiryStatusGuardPreview(
  context: StatusTransitionGuardContext,
  statuses: InquiryStatus[]
): InquiryStatusGuardPreview[] {
  return statuses.map((status) => {
    const blockers = getStatusTransitionBlockers(context, status);
    return {
      status,
      allowed: blockers.length === 0,
      blockers
    };
  });
}
