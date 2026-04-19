import { uniqueChecklistItems } from "@/lib/services/inquiry-checklist-state-list-helpers";
import type { InquiryChecklistStateSnapshot } from "@/lib/services/inquiry-checklist-state-types";

const CHECKLIST_STATE_START = "[CHECKLIST_STATE_START]";
const CHECKLIST_STATE_END = "[CHECKLIST_STATE_END]";

export function parseInquiryChecklistState(raw?: string | null): InquiryChecklistStateSnapshot {
  if (!raw) {
    return {
      memo: "",
      block: null,
      doneIds: []
    };
  }

  const lines = raw.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === CHECKLIST_STATE_START);
  const endIndex =
    startIndex === -1
      ? -1
      : lines.findIndex((line, index) => index > startIndex && line.trim() === CHECKLIST_STATE_END);

  if (startIndex === -1 || endIndex === -1) {
    return {
      memo: raw.trim(),
      block: null,
      doneIds: []
    };
  }

  const block = lines.slice(startIndex, endIndex + 1).join("\n").trim();
  const doneIds = uniqueChecklistItems(
    lines
      .slice(startIndex + 1, endIndex)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("done="))
      .map((line) => line.slice("done=".length))
  );

  const memo = [...lines.slice(0, startIndex), ...lines.slice(endIndex + 1)]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    memo,
    block,
    doneIds
  };
}

export function buildInquiryChecklistStateBlock(doneIds: string[]) {
  const uniqueDoneIds = uniqueChecklistItems(doneIds);
  if (uniqueDoneIds.length === 0) {
    return "";
  }

  return [CHECKLIST_STATE_START, ...uniqueDoneIds.map((id) => `done=${id}`), CHECKLIST_STATE_END].join("\n");
}

export function attachInquiryChecklistStateBlock(
  memo: string | null | undefined,
  block: string | null | undefined
) {
  const baseMemo = (memo ?? "").trim();
  const trimmedBlock = (block ?? "").trim();

  if (baseMemo && trimmedBlock) {
    return `${baseMemo}\n\n${trimmedBlock}`;
  }

  if (baseMemo) {
    return baseMemo;
  }

  if (trimmedBlock) {
    return trimmedBlock;
  }

  return "";
}

export function mergeInquiryChecklistState(
  memo: string | null | undefined,
  doneIds: string[]
) {
  const block = buildInquiryChecklistStateBlock(doneIds);
  return attachInquiryChecklistStateBlock(memo, block);
}

export function stripInquiryChecklistState(raw?: string | null) {
  return parseInquiryChecklistState(raw).memo;
}
