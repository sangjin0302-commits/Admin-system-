import type { RequiredDocumentStatusValue } from "@/types/case-matter";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CaseMatterDDay = {
  label: string;
  days: number | null;
  state: "none" | "today" | "future" | "overdue";
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function buildCaseMatterDDay(
  targetDate: Date | string | null | undefined,
  now: Date = new Date()
): CaseMatterDDay {
  if (!targetDate) {
    return { label: "D-day 없음", days: null, state: "none" };
  }

  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (!Number.isFinite(target.getTime())) {
    return { label: "D-day 없음", days: null, state: "none" };
  }

  const diffDays = Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (diffDays === 0) return { label: "D-day", days: 0, state: "today" };
  if (diffDays > 0) return { label: `D-${diffDays}`, days: diffDays, state: "future" };
  return { label: `D+${Math.abs(diffDays)}`, days: diffDays, state: "overdue" };
}

export function buildRequiredDocumentStatusCounts(
  documents: Array<{ status: RequiredDocumentStatusValue }>
) {
  const counts: Record<RequiredDocumentStatusValue, number> = {
    NEEDED: 0,
    REQUESTED: 0,
    RECEIVED: 0,
    IN_REVIEW: 0,
    APPROVED: 0,
    NEEDS_FIX: 0,
    REJECTED: 0,
    NOT_APPLICABLE: 0
  };

  for (const document of documents) {
    counts[document.status] += 1;
  }

  return counts;
}

export function isRequiredDocumentBacklog(status: RequiredDocumentStatusValue) {
  return status === "NEEDED" || status === "REQUESTED" || status === "NEEDS_FIX";
}

export function buildTaskDueState(
  dueDate: Date | string | null | undefined,
  now: Date = new Date()
) {
  const dday = buildCaseMatterDDay(dueDate, now);
  if (dday.state === "overdue") return "overdue" as const;
  if (dday.state === "today") return "due_today" as const;
  if (dday.state === "future" && dday.days !== null && dday.days <= 3) return "due_soon" as const;
  return "normal" as const;
}
