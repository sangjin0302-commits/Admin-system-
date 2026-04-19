import {
  STRUCTURED_MEMO_END,
  STRUCTURED_MEMO_START
} from "@/lib/services/operations-memo-constants";
import { parseMemoList } from "@/lib/services/operations-memo-list-helpers";
import type {
  ParsedStructuredOperationsMemo,
  StructuredOperationsMemo
} from "@/lib/services/operations-memo-types";

export function parseStructuredOperationsMemo(raw?: string | null): ParsedStructuredOperationsMemo | null {
  if (!raw) {
    return null;
  }

  const lines = raw.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === STRUCTURED_MEMO_START);

  if (startIndex === -1) {
    return null;
  }

  const endIndex = lines.findIndex((line, index) => index > startIndex && line.trim() === STRUCTURED_MEMO_END);
  const safeEndIndex = endIndex === -1 ? lines.length : endIndex;
  const metadataLines = lines.slice(startIndex + 1, safeEndIndex);
  const body = lines
    .filter((_, index) => index < startIndex || index > safeEndIndex)
    .join("\n")
    .trim();

  const metadata: StructuredOperationsMemo = {
    priorityMaterials: [],
    riskFlags: [],
    nextChecks: []
  };

  for (const line of metadataLines) {
    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    switch (key) {
      case "유형":
        metadata.memoType = value;
        break;
      case "추천상태":
        metadata.recommendedStatus = value;
        break;
      case "추천경로":
        metadata.recommendationLabel = value;
        break;
      case "추천근거":
        metadata.recommendationReason = value;
        break;
      case "혼합신호":
        metadata.signalSummary = value;
        break;
      case "실전사용상태":
        metadata.practicalUseStatus = value;
        break;
      case "핵심요약":
        metadata.summary = value;
        break;
      case "우선자료":
        metadata.priorityMaterials = parseMemoList(value);
        break;
      case "리스크":
        metadata.riskFlags = parseMemoList(value);
        break;
      case "우선확인":
        metadata.nextChecks = parseMemoList(value);
        break;
      default:
        break;
    }
  }

  return {
    body,
    metadata
  };
}

export function stripStructuredOperationsMemo(raw?: string | null) {
  if (!raw) {
    return "";
  }

  return parseStructuredOperationsMemo(raw)?.body ?? raw;
}
