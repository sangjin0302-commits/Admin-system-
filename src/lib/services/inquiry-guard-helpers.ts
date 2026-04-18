import type { InquiryStatus } from "@/types/inquiry";
import { getInquiryStatusLabel } from "@/types/inquiry";

export type StatusTransitionGuardContext = {
  currentStatus: InquiryStatus;
  email: string | null;
  phone: string | null;
  description: string;
  requestedOutcome: string | null;
  hasPreparedDocuments: boolean;
  internalMemo: string | null;
  lawbotSnapshotPayload: string | null;
  quoteCount: number;
};

export type StatusChangeSource = "management_form" | "status_panel" | "automation" | "api" | "unknown";

export type InquiryStatusGuardPreview = {
  status: InquiryStatus;
  allowed: boolean;
  blockers: string[];
};

export class InquiryStatusGuardError extends Error {
  blockers: string[];

  constructor(message: string, blockers: string[]) {
    super(message);
    this.name = "InquiryStatusGuardError";
    this.blockers = blockers;
  }
}

export type InquiryCommunicationChannel = "EMAIL" | "PHONE" | "KAKAO" | "SMS" | "VISIT" | "INTERNAL";

export type InquiryCommunicationLogEntry = {
  id: string;
  createdAt: string;
  channel: InquiryCommunicationChannel;
  summary: string;
  details: string;
  responsePending: boolean;
  nextContactAt: string | null;
};

export function createLogId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildStatusTransitionLogEntry(input: {
  previousStatus: InquiryStatus;
  nextStatus: InquiryStatus;
  statusChangeNote?: string;
  statusChangeSource: StatusChangeSource;
}) {
  if (input.previousStatus === input.nextStatus) {
    return null;
  }

  const note = input.statusChangeNote?.trim() ?? "";
  const details = [
    `이전 상태: ${getInquiryStatusLabel(input.previousStatus)}`,
    `변경 상태: ${getInquiryStatusLabel(input.nextStatus)}`,
    note ? `변경 사유: ${note}` : null,
    `변경 출처: ${input.statusChangeSource}`
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  return {
    id: createLogId(),
    createdAt: new Date().toISOString(),
    channel: "INTERNAL" as const,
    summary: `상태 변경 · ${getInquiryStatusLabel(input.previousStatus)} -> ${getInquiryStatusLabel(input.nextStatus)}`,
    details,
    responsePending: false,
    nextContactAt: null
  };
}

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
      blockers.push("상담 진행 전에는 고객 문의 상세 내용이 조금 더 구체적으로 입력되어야 합니다.");
    }
  }

  if (targetStatus === "ON_HOLD") {
    if (memo.length < 12) {
      blockers.push("보류 검토로 전환하려면 내부 메모에 보류 사유를 조금 더 구체적으로 남겨야 합니다.");
    }
  }

  if (targetStatus === "QUOTE_DRAFTED" || targetStatus === "QUOTE_PENDING" || targetStatus === "QUOTE_SENT") {
    if (!context.requestedOutcome?.trim()) {
      blockers.push("견적 단계로 넘기기 전에 고객의 원하는 결과가 정리되어 있어야 합니다.");
    }
    if (!context.hasPreparedDocuments) {
      blockers.push("현재 보유 서류 여부가 미보유로 되어 있어 견적 전환 전 자료 확인이 필요합니다.");
    }
    if (documentChecklist.length > 0) {
      blockers.push("Lawbot 기준 먼저 받아야 할 자료가 남아 있어 견적 전환 전 보완이 필요합니다.");
    }
    if (missingFacts.length > 0 || reviewReasons.length > 0) {
      blockers.push("Lawbot 기준 빠진 핵심 사실 또는 추가 검토 필요 사유가 남아 있습니다.");
    }
  }

  if (targetStatus === "QUOTE_SENT") {
    if (context.quoteCount === 0) {
      blockers.push("견적 발송 상태로 바꾸기 전에 최소 한 건의 견적 초안이 생성되어 있어야 합니다.");
    }
  }

  if (targetStatus === "WON") {
    if (context.quoteCount === 0) {
      blockers.push("수임 상태로 바꾸기 전에 연결된 견적 또는 계약 흐름이 있어야 합니다.");
    }
    if (documentChecklist.length > 0 || missingFacts.length > 0 || riskFlags.length > 0) {
      blockers.push("수임 전환 전에는 남아 있는 자료 부족 또는 리스크 신호를 정리하는 편이 안전합니다.");
    }
    if (transitionNote.length < 6 && memo.length < 12) {
      blockers.push("수임 전환 전에는 내부 메모 또는 변경 사유를 남겨 주세요.");
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

export function parseInquiryCommunicationLogs(value: string | null | undefined): InquiryCommunicationLogEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry): InquiryCommunicationLogEntry | null => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const record = entry as Partial<InquiryCommunicationLogEntry>;
        if (!record.id || !record.createdAt || !record.channel || !record.summary) {
          return null;
        }

        return {
          id: String(record.id),
          createdAt: String(record.createdAt),
          channel: String(record.channel) as InquiryCommunicationChannel,
          summary: String(record.summary),
          details: String(record.details ?? ""),
          responsePending: Boolean(record.responsePending),
          nextContactAt: record.nextContactAt ? String(record.nextContactAt) : null
        };
      })
      .filter((entry): entry is InquiryCommunicationLogEntry => entry !== null)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  } catch {
    return [];
  }
}
