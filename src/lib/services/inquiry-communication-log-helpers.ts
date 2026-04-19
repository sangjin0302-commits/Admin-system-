import type {
  InquiryCommunicationChannel,
  InquiryCommunicationLogEntry
} from "@/lib/services/inquiry-guard-types";

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
