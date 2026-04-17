export type StructuredOperationsMemo = {
  memoType?: string;
  recommendationLabel?: string;
  recommendationReason?: string;
  recommendedStatus?: string;
  signalSummary?: string;
  practicalUseStatus?: string;
  summary?: string;
  priorityMaterials?: string[];
  riskFlags?: string[];
  nextChecks?: string[];
};

type ParsedStructuredOperationsMemo = {
  body: string;
  metadata: StructuredOperationsMemo;
};

const STRUCTURED_MEMO_START = "[운영 메모 구조화]";
const STRUCTURED_MEMO_END = "[운영 메모 구조화 끝]";

function parseList(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeList(items?: string[]) {
  if (!items || items.length === 0) {
    return "";
  }

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" | ");
}

export function serializeStructuredOperationsMemo(input: StructuredOperationsMemo) {
  const lines = [STRUCTURED_MEMO_START];

  if (input.memoType) {
    lines.push(`유형=${input.memoType}`);
  }

  if (input.recommendedStatus) {
    lines.push(`추천상태=${input.recommendedStatus}`);
  }

  if (input.recommendationLabel) {
    lines.push(`추천경로=${input.recommendationLabel}`);
  }

  if (input.recommendationReason) {
    lines.push(`추천근거=${input.recommendationReason}`);
  }

  if (input.signalSummary) {
    lines.push(`혼합신호=${input.signalSummary}`);
  }

  if (input.practicalUseStatus) {
    lines.push(`실전사용상태=${input.practicalUseStatus}`);
  }

  if (input.summary) {
    lines.push(`핵심요약=${input.summary}`);
  }

  const priorityMaterials = serializeList(input.priorityMaterials);
  if (priorityMaterials) {
    lines.push(`우선자료=${priorityMaterials}`);
  }

  const riskFlags = serializeList(input.riskFlags);
  if (riskFlags) {
    lines.push(`리스크=${riskFlags}`);
  }

  const nextChecks = serializeList(input.nextChecks);
  if (nextChecks) {
    lines.push(`우선확인=${nextChecks}`);
  }

  lines.push(STRUCTURED_MEMO_END);
  return lines.join("\n");
}

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
        metadata.priorityMaterials = parseList(value);
        break;
      case "리스크":
        metadata.riskFlags = parseList(value);
        break;
      case "우선확인":
        metadata.nextChecks = parseList(value);
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
