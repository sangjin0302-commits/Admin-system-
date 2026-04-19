import {
  STRUCTURED_MEMO_END,
  STRUCTURED_MEMO_START
} from "@/lib/services/operations-memo-constants";
import { serializeMemoList } from "@/lib/services/operations-memo-list-helpers";
import type { StructuredOperationsMemo } from "@/lib/services/operations-memo-types";

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

  const priorityMaterials = serializeMemoList(input.priorityMaterials);
  if (priorityMaterials) {
    lines.push(`우선자료=${priorityMaterials}`);
  }

  const riskFlags = serializeMemoList(input.riskFlags);
  if (riskFlags) {
    lines.push(`리스크=${riskFlags}`);
  }

  const nextChecks = serializeMemoList(input.nextChecks);
  if (nextChecks) {
    lines.push(`우선확인=${nextChecks}`);
  }

  lines.push(STRUCTURED_MEMO_END);
  return lines.join("\n");
}
