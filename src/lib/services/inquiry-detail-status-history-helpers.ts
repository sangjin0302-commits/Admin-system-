import type {
  CommunicationLogLike,
  StatusHistoryItem
} from "@/lib/services/inquiry-detail-core-types";

function isStatusChangeSummary(summary: string) {
  const normalized = summary.trim().toLowerCase();
  return normalized.startsWith("status change") || normalized.startsWith("status updated");
}

function parseStatusTransition(summary: string) {
  let summaryValue = summary.trim();
  if (summaryValue.toLowerCase().startsWith("status change")) {
    summaryValue = summaryValue.replace(/status change[:\s-]*/i, "").trim();
  } else if (summaryValue.toLowerCase().startsWith("status updated")) {
    summaryValue = summaryValue.replace(/status updated[:\s-]*/i, "").trim();
  }

  const [previousStatusLabel, nextStatusLabel] = summaryValue.includes(" -> ")
    ? summaryValue.split(" -> ", 2)
    : ["-", "-"];

  return { previousStatusLabel, nextStatusLabel };
}

export function buildStatusHistoryFromLogs(logs: CommunicationLogLike[]): StatusHistoryItem[] {
  return logs
    .filter((entry) => entry.channel === "INTERNAL" && isStatusChangeSummary(entry.summary))
    .slice(0, 10)
    .map((entry) => {
      const detailLines = entry.details
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const reasonLine = detailLines.find((line) => line.toLowerCase().startsWith("reason:"));
      const sourceLine = detailLines.find((line) => line.toLowerCase().startsWith("source:"));

      const { previousStatusLabel, nextStatusLabel } = parseStatusTransition(entry.summary);

      return {
        id: entry.id,
        createdAt: entry.createdAt,
        previousStatusLabel,
        nextStatusLabel,
        reason: reasonLine ? reasonLine.split(":").slice(1).join(":").trim() || null : null,
        source: sourceLine ? sourceLine.split(":").slice(1).join(":").trim() || null : null
      };
    });
}
