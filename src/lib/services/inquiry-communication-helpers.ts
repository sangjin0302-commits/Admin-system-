import type { Prisma } from "@generated/prisma-client/client";

import {
  createLogId,
  type InquiryCommunicationChannel,
  type InquiryCommunicationLogEntry
} from "@/lib/services/inquiry-guard-helpers";

export type AppendInquiryCommunicationPayload = {
  channel: InquiryCommunicationChannel;
  summary: string;
  details?: string;
  responsePending: boolean;
  nextContactAt?: string;
};

export function buildAppendInquiryCommunicationUpdateData(
  payload: AppendInquiryCommunicationPayload,
  currentLogs: InquiryCommunicationLogEntry[]
): Prisma.InquiryUpdateInput {
  const createdAt = new Date();
  const nextContactAt = payload.nextContactAt ? new Date(payload.nextContactAt) : null;
  const nextEntry: InquiryCommunicationLogEntry = {
    id: createLogId(),
    createdAt: createdAt.toISOString(),
    channel: payload.channel,
    summary: payload.summary,
    details: payload.details?.trim() ?? "",
    responsePending: payload.responsePending,
    nextContactAt: nextContactAt?.toISOString() ?? null
  };

  return {
    communicationLogs: JSON.stringify([nextEntry, ...currentLogs]),
    latestContactAt: createdAt,
    latestContactChannel: payload.channel,
    latestContactSummary: payload.summary,
    nextContactAt,
    responsePending: payload.responsePending
  };
}
