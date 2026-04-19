import type { InquiryStatus } from "@/types/inquiry";
import { getInquiryStatusLabel } from "@/types/inquiry";
import type { StatusChangeSource } from "@/lib/services/inquiry-guard-types";

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
    summary: `상태 변경: ${getInquiryStatusLabel(input.previousStatus)} -> ${getInquiryStatusLabel(input.nextStatus)}`,
    details,
    responsePending: false,
    nextContactAt: null
  };
}
