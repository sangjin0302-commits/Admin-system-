import { buildCaseMatterDDay } from "@/lib/services/case-matter-card-view-model";

const DAY_MS = 24 * 60 * 60 * 1000;

const terminalCaseStatuses = new Set(["CLOSED", "CANCELLED"]);
const inactiveTaskStatuses = new Set(["DONE", "CANCELLED"]);
const documentBacklogStatuses = new Set(["NEEDED", "REQUESTED", "NEEDS_FIX"]);
const supplementBacklogStatuses = new Set([
  "RECEIVED",
  "ANALYZING",
  "DOCS_REQUESTED",
  "CLIENT_WAITING",
  "RESPONSE_DRAFTING",
  "READY_TO_RESPOND",
  "OVERDUE"
]);
const stalledCaseStatuses = new Set(["WAITING_AGENCY", "SUPPLEMENT_REQUESTED", "ON_HOLD"]);
const waitingAgencySubmissionStatuses = new Set([
  "SUBMITTED",
  "RECEIPTED",
  "UNDER_REVIEW",
  "SUPPLEMENT_REQUESTED"
]);

export type CaseMatterActionTask = {
  status: string;
  priority: string;
  dueDate: Date | string | null;
  assignedTo: string | null;
};

export type CaseMatterActionRequiredDocument = {
  status: string;
  dueDate: Date | string | null;
};

export type CaseMatterActionSupplementRequest = {
  status: string;
  dueDate: Date | string | null;
};

export type CaseMatterActionAgencySubmission = {
  status: string;
  submittedAt: Date | string | null;
  resultReceivedAt: Date | string | null;
};

export type CaseMatterActionSource = {
  id: string;
  caseNo: string | null;
  title: string;
  status: string;
  priority: string;
  riskLevel: string;
  dueDate: Date | string | null;
  nextActionAt: Date | string | null;
  updatedAt: Date | string;
  nextAction?: {
    message: string;
  };
  tasks: CaseMatterActionTask[];
  requiredDocuments: CaseMatterActionRequiredDocument[];
  supplementRequests: CaseMatterActionSupplementRequest[];
  submissions?: CaseMatterActionAgencySubmission[];
};

export type CaseMatterActionItem = {
  id: string;
  href: string;
  caseNo: string | null;
  title: string;
  status: string;
  priority: string;
  riskLevel: string;
  dueDate: Date | string | null;
  nextActionAt: Date | string | null;
  nextActionMessage: string;
  ddayLabel: string;
  tone: "default" | "warning" | "danger";
  reasons: string[];
};

export type CaseMatterActionDashboard = {
  today: CaseMatterActionItem[];
  dueSoon: CaseMatterActionItem[];
  backlog: CaseMatterActionItem[];
  stalled: CaseMatterActionItem[];
};

export type CaseMatterActionSummary = {
  counts: Record<keyof CaseMatterActionDashboard, number>;
  topItems: CaseMatterActionItem[];
  hasImmediateWork: boolean;
  hasOperationalIssues: boolean;
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toValidDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function dayDiff(value: Date | string | null | undefined, now: Date) {
  const date = toValidDate(value);
  if (!date) return null;
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

function isDueTodayOrOverdue(value: Date | string | null | undefined, now: Date) {
  const diff = dayDiff(value, now);
  return diff !== null && diff <= 0;
}

function isDueWithinSevenDays(value: Date | string | null | undefined, now: Date) {
  const diff = dayDiff(value, now);
  return diff !== null && diff >= 1 && diff <= 7;
}

function isStale(value: Date | string | null | undefined, now: Date) {
  const diff = dayDiff(value, now);
  return diff !== null && diff <= -14;
}

function isActiveCase(caseMatter: CaseMatterActionSource) {
  return !terminalCaseStatuses.has(caseMatter.status);
}

function activeTasks(caseMatter: CaseMatterActionSource) {
  return caseMatter.tasks.filter((task) => !inactiveTaskStatuses.has(task.status));
}

function buildItem(
  caseMatter: CaseMatterActionSource,
  reasons: string[],
  now: Date
): CaseMatterActionItem {
  const dueDday = buildCaseMatterDDay(caseMatter.dueDate, now);
  const nextActionDday = buildCaseMatterDDay(caseMatter.nextActionAt, now);
  const overdue = dueDday.state === "overdue" || nextActionDday.state === "overdue";
  const today = dueDday.state === "today" || nextActionDday.state === "today";

  return {
    id: caseMatter.id,
    href: `/admin/cases/${caseMatter.id}`,
    caseNo: caseMatter.caseNo,
    title: caseMatter.title,
    status: caseMatter.status,
    priority: caseMatter.priority,
    riskLevel: caseMatter.riskLevel,
    dueDate: caseMatter.dueDate,
    nextActionAt: caseMatter.nextActionAt,
    nextActionMessage: caseMatter.nextAction?.message ?? "다음 액션을 확인하세요.",
    ddayLabel: dueDday.state !== "none" ? dueDday.label : nextActionDday.label,
    tone: overdue ? "danger" : today ? "warning" : "default",
    reasons
  };
}

function sortActionItems(items: CaseMatterActionItem[]) {
  return [...items].sort((a, b) => {
    const aDue = toValidDate(a.dueDate)?.getTime() ?? toValidDate(a.nextActionAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = toValidDate(b.dueDate)?.getTime() ?? toValidDate(b.nextActionAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aDue - bDue || a.title.localeCompare(b.title);
  });
}

export function buildCaseMatterActionDashboard(
  caseMatters: CaseMatterActionSource[],
  now: Date = new Date()
): CaseMatterActionDashboard {
  const today: CaseMatterActionItem[] = [];
  const dueSoon: CaseMatterActionItem[] = [];
  const backlog: CaseMatterActionItem[] = [];
  const stalled: CaseMatterActionItem[] = [];

  for (const caseMatter of caseMatters) {
    if (!isActiveCase(caseMatter)) continue;

    const todayReasons = [
      isDueTodayOrOverdue(caseMatter.nextActionAt, now) ? "다음 액션일 확인" : null,
      isDueTodayOrOverdue(caseMatter.dueDate, now) ? "사건 기한 확인" : null,
      activeTasks(caseMatter).some((task) => isDueTodayOrOverdue(task.dueDate, now))
        ? "오늘 또는 지연 업무 태스크"
        : null
    ].filter(Boolean) as string[];
    if (todayReasons.length > 0) today.push(buildItem(caseMatter, todayReasons, now));

    const dueSoonReasons = [
      isDueWithinSevenDays(caseMatter.dueDate, now) ? "사건 기한 7일 이내" : null,
      activeTasks(caseMatter).some((task) => isDueWithinSevenDays(task.dueDate, now))
        ? "업무 태스크 기한 7일 이내"
        : null,
      caseMatter.requiredDocuments.some((document) => isDueWithinSevenDays(document.dueDate, now))
        ? "필수자료 기한 7일 이내"
        : null,
      caseMatter.supplementRequests.some((request) => isDueWithinSevenDays(request.dueDate, now))
        ? "보완 요청 기한 7일 이내"
        : null
    ].filter(Boolean) as string[];
    if (dueSoonReasons.length > 0) dueSoon.push(buildItem(caseMatter, dueSoonReasons, now));

    const backlogReasons = [
      caseMatter.requiredDocuments.some((document) => documentBacklogStatuses.has(document.status))
        ? "미제출/보완 필요 자료"
        : null,
      caseMatter.supplementRequests.some((request) => supplementBacklogStatuses.has(request.status))
        ? "보완 응답 필요"
        : null
    ].filter(Boolean) as string[];
    if (backlogReasons.length > 0) backlog.push(buildItem(caseMatter, backlogReasons, now));

    const stalledReasons = [
      stalledCaseStatuses.has(caseMatter.status) ? "대기/보류 상태" : null,
      (caseMatter.submissions ?? []).some(
        (submission) =>
          !submission.resultReceivedAt &&
          waitingAgencySubmissionStatuses.has(submission.status) &&
          isStale(submission.submittedAt, now)
      )
        ? "기관 제출 결과 장기 대기"
        : null,
      isStale(caseMatter.updatedAt, now) ? "14일 이상 업데이트 없음" : null
    ].filter(Boolean) as string[];
    if (stalledReasons.length > 0) stalled.push(buildItem(caseMatter, stalledReasons, now));
  }

  return {
    today: sortActionItems(today),
    dueSoon: sortActionItems(dueSoon),
    backlog: sortActionItems(backlog),
    stalled: sortActionItems(stalled)
  };
}

export function buildCaseMatterActionSummary(
  dashboard: CaseMatterActionDashboard,
  limit = 5
): CaseMatterActionSummary {
  const seen = new Set<string>();
  const topItems: CaseMatterActionItem[] = [];

  for (const item of [
    ...dashboard.today,
    ...dashboard.dueSoon,
    ...dashboard.backlog,
    ...dashboard.stalled
  ]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    topItems.push(item);
    if (topItems.length >= limit) break;
  }

  return {
    counts: {
      today: dashboard.today.length,
      dueSoon: dashboard.dueSoon.length,
      backlog: dashboard.backlog.length,
      stalled: dashboard.stalled.length
    },
    topItems,
    hasImmediateWork: dashboard.today.length > 0,
    hasOperationalIssues:
      dashboard.dueSoon.length + dashboard.backlog.length + dashboard.stalled.length > 0
  };
}
