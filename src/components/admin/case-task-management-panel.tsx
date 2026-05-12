"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import { parseClientApiError } from "@/lib/http/client-api";
import { formatDate, formatDateTime, stringifyDateForInput } from "@/lib/utils";
import {
  caseTaskPriorityValues,
  caseTaskStatusValues,
  type CaseTaskPriorityValue,
  type CaseTaskStatusValue
} from "@/types/case-matter";

type CaseTaskItem = {
  id: string;
  title: string;
  details: string | null;
  description: string | null;
  status: CaseTaskStatusValue;
  priority: CaseTaskPriorityValue;
  dueDate: Date | null;
  assignedTo: string | null;
  completedAt: Date | null;
  updatedAt: string;
};

type CaseTaskManagementPanelProps = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  tasks: CaseTaskItem[];
};

type CreateDraft = {
  title: string;
  details: string;
  description: string;
  priority: CaseTaskPriorityValue;
  dueDate: string;
  assignedTo: string;
};

type MetadataDraft = CreateDraft;

type StatusDraft = {
  status: CaseTaskStatusValue;
  note: string;
};

const taskStatusLabels: Record<CaseTaskStatusValue, string> = {
  OPEN: "열림",
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  BLOCKED: "막힘",
  DONE: "완료",
  CANCELLED: "취소"
};

const taskPriorityLabels: Record<CaseTaskPriorityValue, string> = {
  LOW: "낮음",
  NORMAL: "보통",
  HIGH: "높음",
  URGENT: "긴급"
};

const defaultCreateDraft: CreateDraft = {
  title: "",
  details: "",
  description: "",
  priority: "NORMAL",
  dueDate: "",
  assignedTo: ""
};

function draftFromTask(task: CaseTaskItem): MetadataDraft {
  return {
    title: task.title,
    details: task.details ?? "",
    description: task.description ?? "",
    priority: task.priority,
    dueDate: stringifyDateForInput(task.dueDate),
    assignedTo: task.assignedTo ?? ""
  };
}

export function CaseTaskManagementPanel({
  caseMatterId,
  caseMatterUpdatedAt,
  tasks
}: CaseTaskManagementPanelProps) {
  const router = useRouter();
  const [createDraft, setCreateDraft] = useState<CreateDraft>(defaultCreateDraft);
  const [createMessage, setCreateMessage] = useState("");
  const [rowMessages, setRowMessages] = useState<Record<string, string>>({});
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [metadataDraftById, setMetadataDraftById] = useState<Record<string, MetadataDraft>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, draftFromTask(task)]))
  );
  const [statusDraftById, setStatusDraftById] = useState<Record<string, StatusDraft>>(() =>
    Object.fromEntries(
      tasks.map((task) => [
        task.id,
        {
          status: task.status,
          note: ""
        }
      ])
    )
  );
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isMetadataPending, startMetadataTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();

  const taskById = useMemo(() => Object.fromEntries(tasks.map((task) => [task.id, task])), [tasks]);

  function setCreateField(next: Partial<CreateDraft>) {
    setCreateDraft((current) => ({ ...current, ...next }));
  }

  function setRowMessage(taskId: string, message: string) {
    setRowMessages((current) => ({ ...current, [taskId]: message }));
  }

  function setMetadataDraft(taskId: string, next: Partial<MetadataDraft>) {
    setMetadataDraftById((current) => {
      const snapshot = taskById[taskId];
      return {
        ...current,
        [taskId]: {
          ...(current[taskId] ?? (snapshot ? draftFromTask(snapshot) : defaultCreateDraft)),
          ...next
        }
      };
    });
  }

  function setStatusDraft(taskId: string, next: Partial<StatusDraft>) {
    setStatusDraftById((current) => {
      const snapshot = taskById[taskId];
      return {
        ...current,
        [taskId]: {
          ...(current[taskId] ?? {
            status: snapshot?.status ?? "TODO",
            note: ""
          }),
          ...next
        }
      };
    });
  }

  function onCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = createDraft.title.trim();
    if (!title) {
      setCreateMessage("업무 제목을 입력하세요.");
      return;
    }

    setCreateMessage("");
    startCreateTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          details: createDraft.details.trim() || null,
          description: createDraft.description.trim() || null,
          priority: createDraft.priority,
          dueDate: createDraft.dueDate || null,
          assignedTo: createDraft.assignedTo.trim() || null,
          expectedCaseUpdatedAt: caseMatterUpdatedAt
        })
      });

      if (!response.ok) {
        setCreateMessage(await parseClientApiError(response, "업무 태스크를 생성하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setCreateMessage("업무 태스크가 생성되었습니다. 최신 상태를 다시 불러옵니다.");
      setCreateDraft(defaultCreateDraft);
      router.refresh();
    });
  }

  function submitMetadata(taskId: string) {
    const snapshot = taskById[taskId];
    if (!snapshot) return;

    const draft = metadataDraftById[taskId] ?? draftFromTask(snapshot);
    if (!draft.title.trim()) {
      setRowMessage(taskId, "업무 제목을 입력하세요.");
      return;
    }

    setPendingTaskId(taskId);
    setRowMessage(taskId, "");
    startMetadataTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "metadata",
          title: draft.title,
          details: draft.details.trim() || null,
          description: draft.description.trim() || null,
          priority: draft.priority,
          dueDate: draft.dueDate || null,
          assignedTo: draft.assignedTo.trim() || null,
          expectedUpdatedAt: snapshot.updatedAt
        })
      });

      if (!response.ok) {
        setRowMessage(taskId, await parseClientApiError(response, "업무 정보를 수정하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        setPendingTaskId(null);
        return;
      }

      setRowMessage(taskId, "업무 정보가 수정되었습니다. 최신 상태를 다시 불러옵니다.");
      setPendingTaskId(null);
      router.refresh();
    });
  }

  function submitStatus(taskId: string, nextStatus?: CaseTaskStatusValue) {
    const snapshot = taskById[taskId];
    if (!snapshot) return;
    const draft = statusDraftById[taskId] ?? { status: snapshot.status, note: "" };
    const status = nextStatus ?? draft.status;
    if (status === snapshot.status) {
      setRowMessage(taskId, "변경할 상태가 없습니다.");
      return;
    }

    setPendingTaskId(taskId);
    setRowMessage(taskId, "");
    startStatusTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "status",
          status,
          statusChangeNote: draft.note.trim() || null,
          expectedUpdatedAt: snapshot.updatedAt
        })
      });

      if (!response.ok) {
        setRowMessage(taskId, await parseClientApiError(response, "업무 상태를 변경하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        setPendingTaskId(null);
        return;
      }

      setRowMessage(taskId, "업무 상태가 변경되었습니다. 최신 상태를 다시 불러옵니다.");
      setPendingTaskId(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-muted p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-text-strong">업무 태스크 관리</p>
        <p className="mt-1 text-xs text-text-muted">
          사건별 할 일, 기한, 담당자, 완료 상태를 관리합니다. 변경 내역은 사건 이벤트로 남습니다.
        </p>
      </div>

      <form onSubmit={onCreateTask} className="mb-4 space-y-3 rounded-xl border border-line bg-surface p-3">
        <p className="text-sm font-semibold text-text-strong">업무 태스크 추가</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
          <input
            value={createDraft.title}
            onChange={(event) => setCreateField({ title: event.target.value })}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            placeholder="업무 제목"
            maxLength={160}
          />
          <select
            value={createDraft.priority}
            onChange={(event) =>
              setCreateField({ priority: event.target.value as CaseTaskPriorityValue })
            }
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
          >
            {caseTaskPriorityValues.map((priority) => (
              <option key={priority} value={priority}>
                {taskPriorityLabels[priority]}
              </option>
            ))}
          </select>
          <input
            value={createDraft.dueDate}
            onChange={(event) => setCreateField({ dueDate: event.target.value })}
            type="date"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <textarea
            value={createDraft.details}
            onChange={(event) => setCreateField({ details: event.target.value })}
            rows={2}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
            placeholder="업무 상세 메모"
            maxLength={500}
          />
          <input
            value={createDraft.assignedTo}
            onChange={(event) => setCreateField({ assignedTo: event.target.value })}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            placeholder="담당자"
            maxLength={80}
          />
        </div>
        <textarea
          value={createDraft.description}
          onChange={(event) => setCreateField({ description: event.target.value })}
          rows={2}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
          placeholder="설명 또는 처리 기준"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isCreatePending}
          className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatePending ? "생성 중..." : "업무 태스크 생성"}
        </button>
        {createMessage ? <p className="text-xs text-text-muted">{createMessage}</p> : null}
      </form>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-sm text-text-muted">등록된 업무 태스크가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const metadataDraft = metadataDraftById[task.id] ?? draftFromTask(task);
            const statusDraft = statusDraftById[task.id] ?? { status: task.status, note: "" };
            const rowBusy =
              pendingTaskId === task.id && (isMetadataPending || isStatusPending);
            return (
              <div key={task.id} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-strong">{task.title}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {taskStatusLabels[task.status]} | {taskPriorityLabels[task.priority]} | 기한{" "}
                      {formatDate(task.dueDate)} | 담당 {task.assignedTo || "-"}
                    </p>
                    {task.completedAt ? (
                      <p className="mt-1 text-xs text-text-muted">
                        완료: {formatDateTime(task.completedAt)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => submitStatus(task.id, "DONE")}
                    disabled={rowBusy || task.status === "DONE"}
                    className="h-9 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    DONE 처리
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-surface-muted p-3">
                  <p className="text-xs font-semibold text-text-strong">업무 정보 수정</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_150px_150px]">
                    <input
                      value={metadataDraft.title}
                      onChange={(event) => setMetadataDraft(task.id, { title: event.target.value })}
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      maxLength={160}
                      aria-label="업무 제목"
                    />
                    <select
                      value={metadataDraft.priority}
                      onChange={(event) =>
                        setMetadataDraft(task.id, {
                          priority: event.target.value as CaseTaskPriorityValue
                        })
                      }
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      aria-label="업무 우선순위"
                    >
                      {caseTaskPriorityValues.map((priority) => (
                        <option key={priority} value={priority}>
                          {taskPriorityLabels[priority]}
                        </option>
                      ))}
                    </select>
                    <input
                      value={metadataDraft.dueDate}
                      onChange={(event) => setMetadataDraft(task.id, { dueDate: event.target.value })}
                      type="date"
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      aria-label="업무 기한"
                    />
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_220px]">
                    <textarea
                      value={metadataDraft.details}
                      onChange={(event) => setMetadataDraft(task.id, { details: event.target.value })}
                      rows={2}
                      className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                      placeholder="업무 상세 메모"
                      maxLength={500}
                      aria-label="업무 상세 메모"
                    />
                    <input
                      value={metadataDraft.assignedTo}
                      onChange={(event) =>
                        setMetadataDraft(task.id, { assignedTo: event.target.value })
                      }
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      placeholder="담당자"
                      maxLength={80}
                      aria-label="담당자"
                    />
                  </div>
                  <textarea
                    value={metadataDraft.description}
                    onChange={(event) =>
                      setMetadataDraft(task.id, { description: event.target.value })
                    }
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder="설명 또는 처리 기준"
                    maxLength={500}
                    aria-label="업무 설명"
                  />
                  <button
                    type="button"
                    onClick={() => submitMetadata(task.id)}
                    disabled={rowBusy}
                    className="mt-3 h-9 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rowBusy ? "수정 중..." : "업무 정보 수정"}
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-surface-muted p-3">
                  <p className="text-xs font-semibold text-text-strong">상태 변경</p>
                  <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                    <select
                      value={statusDraft.status}
                      onChange={(event) =>
                        setStatusDraft(task.id, {
                          status: event.target.value as CaseTaskStatusValue
                        })
                      }
                      className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                    >
                      {caseTaskStatusValues.map((status) => (
                        <option key={status} value={status}>
                          {taskStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => submitStatus(task.id)}
                      disabled={rowBusy || statusDraft.status === task.status}
                      className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {rowBusy ? "변경 중..." : "상태 적용"}
                    </button>
                  </div>
                  <textarea
                    value={statusDraft.note}
                    onChange={(event) => setStatusDraft(task.id, { note: event.target.value })}
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder="감사 로그 사유(선택)"
                    maxLength={300}
                  />
                </div>

                {rowMessages[task.id] ? (
                  <p className="mt-2 text-xs text-text-muted">{rowMessages[task.id]}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
