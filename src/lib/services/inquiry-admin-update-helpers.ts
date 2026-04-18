import {
  InquiryStatusGuardError,
  buildStatusTransitionLogEntry,
  getStatusTransitionBlockers,
  parseInquiryCommunicationLogs,
  type InquiryCommunicationLogEntry,
  type StatusChangeSource
} from "@/lib/services/inquiry-guard-helpers";
import type { InquiryStatus } from "@/types/inquiry";

export type UpdateInquiryAdminPayload = {
  status?: InquiryStatus;
  assignee?: string;
  internalMemo?: string;
  statusChangeNote?: string;
  statusChangeSource?: StatusChangeSource;
  expectedUpdatedAt?: string;
};

export type InquiryAdminCurrentSnapshot = {
  updatedAt: Date;
  status: InquiryStatus;
  email: string | null;
  phone: string | null;
  description: string;
  requestedOutcome: string | null;
  hasPreparedDocuments: boolean;
  internalMemo: string | null;
  communicationLogs: string | null;
  lawbotSnapshotPayload: string | null;
  _count: {
    quotes: number;
  };
};

export class InquiryConcurrentUpdateError extends Error {
  currentUpdatedAt: string;

  constructor(message: string, currentUpdatedAt: string) {
    super(message);
    this.name = "InquiryConcurrentUpdateError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
}

export function validateAndPrepareInquiryAdminUpdate(
  current: InquiryAdminCurrentSnapshot,
  payload: UpdateInquiryAdminPayload
) {
  if (payload.expectedUpdatedAt?.trim()) {
    const expectedDate = new Date(payload.expectedUpdatedAt);
    const expectedMs = expectedDate.getTime();
    const currentMs = current.updatedAt.getTime();
    if (!Number.isFinite(expectedMs) || expectedMs !== currentMs) {
      throw new InquiryConcurrentUpdateError(
        "다른 화면에서 먼저 수정되어 최신 상태와 충돌했습니다. 새로고침 후 다시 시도해 주세요.",
        current.updatedAt.toISOString()
      );
    }
  }

  if (payload.status !== undefined && payload.status !== current.status) {
    const blockers = getStatusTransitionBlockers(
      {
        currentStatus: current.status,
        email: current.email,
        phone: current.phone,
        description: current.description,
        requestedOutcome: current.requestedOutcome,
        hasPreparedDocuments: current.hasPreparedDocuments,
        internalMemo: current.internalMemo,
        lawbotSnapshotPayload: current.lawbotSnapshotPayload,
        quoteCount: current._count.quotes
      },
      payload.status,
      payload.internalMemo,
      payload.statusChangeNote
    );

    if (blockers.length > 0) {
      throw new InquiryStatusGuardError("상태 전환 전에 확인해야 할 항목이 남아 있습니다.", blockers);
    }
  }

  const currentLogs = parseInquiryCommunicationLogs(current.communicationLogs);
  const statusChangeEntry =
    payload.status !== undefined && payload.status !== current.status
      ? buildStatusTransitionLogEntry({
          previousStatus: current.status,
          nextStatus: payload.status,
          statusChangeNote: payload.statusChangeNote,
          statusChangeSource: payload.statusChangeSource ?? "unknown"
        })
      : null;

  return { currentLogs, statusChangeEntry };
}

export function buildInquiryAdminUpdateData(
  payload: UpdateInquiryAdminPayload,
  currentLogs: InquiryCommunicationLogEntry[],
  statusChangeEntry: InquiryCommunicationLogEntry | null
) {
  return {
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.assignee !== undefined ? { assignee: payload.assignee.trim() || null } : {}),
    ...(payload.internalMemo !== undefined
      ? { internalMemo: payload.internalMemo.trim() || null }
      : {}),
    ...(statusChangeEntry
      ? { communicationLogs: JSON.stringify([statusChangeEntry, ...currentLogs]) }
      : {})
  };
}
