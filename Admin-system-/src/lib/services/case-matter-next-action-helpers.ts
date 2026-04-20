import type {
  AgencySubmissionStatus,
  CaseMatterStatus,
  CaseTaskPriority,
  CaseTaskStatus,
  RequiredDocumentStatus,
  SupplementStatus
} from "@generated/prisma-client/client";

export type CaseMatterNextActionPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type CaseMatterNextAction = {
  priority: CaseMatterNextActionPriority;
  actionType: string;
  message: string;
  reasons: string[];
};

type CaseTaskSnapshot = {
  title: string;
  status: CaseTaskStatus;
  priority: CaseTaskPriority;
  dueDate: Date | null;
};

type RequiredDocumentSnapshot = {
  name: string;
  required: boolean;
  status: RequiredDocumentStatus;
  dueDate: Date | null;
};

type SubmissionSnapshot = {
  status: AgencySubmissionStatus;
  submittedAt: Date | null;
};

type SupplementRequestSnapshot = {
  title: string;
  status: SupplementStatus;
  dueDate: Date | null;
};

export type CaseMatterOperationalSnapshot = {
  status: CaseMatterStatus;
  dueDate: Date | null;
  nextActionAt: Date | null;
  tasks: CaseTaskSnapshot[];
  requiredDocuments: RequiredDocumentSnapshot[];
  submissions: SubmissionSnapshot[];
  supplementRequests: SupplementRequestSnapshot[];
};

const CLOSED_SUPPLEMENT_STATUSES: SupplementStatus[] = ["RESPONDED", "CLOSED", "CANCELLED"];
const CLOSED_TASK_STATUSES: CaseTaskStatus[] = ["DONE", "CANCELLED"];

function isOverdue(date: Date | null, now: Date) {
  return Boolean(date && date.getTime() < now.getTime());
}

function isOpenTask(status: CaseTaskStatus) {
  return !CLOSED_TASK_STATUSES.includes(status);
}

function hasPendingSubmission(submissions: SubmissionSnapshot[]) {
  return submissions.some((submission) =>
    ["READY", "SUBMITTED", "RECEIPTED", "UNDER_REVIEW", "SUPPLEMENT_REQUESTED"].includes(
      submission.status
    )
  );
}

export function deriveCaseMatterNextAction(
  snapshot: CaseMatterOperationalSnapshot,
  now = new Date()
): CaseMatterNextAction {
  const overdueSupplement = snapshot.supplementRequests.find(
    (supplement) =>
      !CLOSED_SUPPLEMENT_STATUSES.includes(supplement.status) && isOverdue(supplement.dueDate, now)
  );

  if (overdueSupplement) {
    return {
      priority: "URGENT",
      actionType: "SUPPLEMENT_OVERDUE",
      message: `Overdue supplement response: ${overdueSupplement.title}`,
      reasons: ["Supplement request due date has passed."]
    };
  }

  const overdueTask = snapshot.tasks.find(
    (task) => isOpenTask(task.status) && isOverdue(task.dueDate, now)
  );
  if (overdueTask) {
    return {
      priority: "HIGH",
      actionType: "TASK_OVERDUE",
      message: `Complete overdue task: ${overdueTask.title}`,
      reasons: ["Open task due date has passed."]
    };
  }

  const pendingClientDocs = snapshot.requiredDocuments.filter(
    (document) =>
      document.required && ["NEEDED", "REQUESTED", "NEEDS_FIX"].includes(document.status)
  );
  if (pendingClientDocs.length > 0) {
    return {
      priority: pendingClientDocs.some((document) => isOverdue(document.dueDate, now))
        ? "HIGH"
        : "NORMAL",
      actionType: "FOLLOW_UP_DOCUMENTS",
      message: `Follow up required documents (${pendingClientDocs.length})`,
      reasons: ["Some required documents are still not ready."]
    };
  }

  const reviewPendingDocs = snapshot.requiredDocuments.filter((document) =>
    ["RECEIVED", "IN_REVIEW"].includes(document.status)
  );
  if (reviewPendingDocs.length > 0) {
    return {
      priority: "NORMAL",
      actionType: "DOCUMENT_REVIEW",
      message: `Review received documents (${reviewPendingDocs.length})`,
      reasons: ["Received documents are waiting for review approval."]
    };
  }

  if (snapshot.status === "READY_TO_SUBMIT" && !hasPendingSubmission(snapshot.submissions)) {
    return {
      priority: "HIGH",
      actionType: "PREPARE_SUBMISSION",
      message: "Create and submit agency package",
      reasons: ["Case is ready to submit but no submission record exists."]
    };
  }

  if (
    ["SUBMITTED", "WAITING_AGENCY"].includes(snapshot.status) &&
    hasPendingSubmission(snapshot.submissions)
  ) {
    return {
      priority: "NORMAL",
      actionType: "MONITOR_AGENCY",
      message: "Monitor agency response",
      reasons: ["Agency submission is in progress."]
    };
  }

  if (snapshot.status === "RESULT_RECEIVED" || snapshot.status === "CLOSING") {
    return {
      priority: "NORMAL",
      actionType: "CLOSE_CASE",
      message: "Finalize closure checklist",
      reasons: ["Result is already received and closure steps are pending."]
    };
  }

  if (isOverdue(snapshot.nextActionAt, now) || isOverdue(snapshot.dueDate, now)) {
    return {
      priority: "HIGH",
      actionType: "REVIEW_TIMELINE",
      message: "Review timeline and update next action",
      reasons: ["Next action or due date is overdue."]
    };
  }

  return {
    priority: "LOW",
    actionType: "MONITOR",
    message: "No urgent blockers",
    reasons: ["Operational snapshot has no immediate risk signal."]
  };
}
