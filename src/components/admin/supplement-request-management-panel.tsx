"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import { parseClientApiError } from "@/lib/http/client-api";
import { formatDate, formatDateTime, stringifyDateForInput } from "@/lib/utils";
import { supplementStatusValues, type SupplementStatusValue } from "@/types/case-matter";

type SupplementRequestItem = {
  id: string;
  title: string;
  description: string | null;
  status: SupplementStatusValue;
  receivedAt: Date;
  dueDate: Date | null;
  respondedAt: Date | null;
  requestedDocsJson: string | null;
  responseNote: string | null;
  updatedAt: string;
};

type SupplementRequestManagementPanelProps = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  supplementRequests: SupplementRequestItem[];
};

type MetadataDraft = {
  title: string;
  description: string;
  receivedAt: string;
  dueDate: string;
  requestedDocsJson: string;
  responseNote: string;
};

type StatusDraft = {
  status: SupplementStatusValue;
  note: string;
  responseNote: string;
  respondedAt: string;
};

const statusLabels: Record<SupplementStatusValue, string> = {
  RECEIVED: "수령",
  ANALYZING: "분석 중",
  DOCS_REQUESTED: "자료 요청",
  CLIENT_WAITING: "고객 대기",
  RESPONSE_DRAFTING: "답변 작성",
  READY_TO_RESPOND: "답변 준비",
  RESPONDED: "답변 완료",
  CLOSED: "종결",
  OVERDUE: "기한 초과",
  CANCELLED: "취소"
};

const defaultMetadataDraft: MetadataDraft = {
  title: "",
  description: "",
  receivedAt: "",
  dueDate: "",
  requestedDocsJson: "",
  responseNote: ""
};

function draftFromRequest(request: SupplementRequestItem): MetadataDraft {
  return {
    title: request.title,
    description: request.description ?? "",
    receivedAt: stringifyDateForInput(request.receivedAt),
    dueDate: stringifyDateForInput(request.dueDate),
    requestedDocsJson: request.requestedDocsJson ?? "",
    responseNote: request.responseNote ?? ""
  };
}

function statusDraftFromRequest(request: SupplementRequestItem): StatusDraft {
  return {
    status: request.status,
    note: "",
    responseNote: request.responseNote ?? "",
    respondedAt: stringifyDateForInput(request.respondedAt)
  };
}

export function SupplementRequestManagementPanel({
  caseMatterId,
  caseMatterUpdatedAt,
  supplementRequests
}: SupplementRequestManagementPanelProps) {
  const router = useRouter();
  const [createDraft, setCreateDraft] = useState<MetadataDraft>(defaultMetadataDraft);
  const [createMessage, setCreateMessage] = useState("");
  const [rowMessages, setRowMessages] = useState<Record<string, string>>({});
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [metadataDraftById, setMetadataDraftById] = useState<Record<string, MetadataDraft>>(() =>
    Object.fromEntries(supplementRequests.map((request) => [request.id, draftFromRequest(request)]))
  );
  const [statusDraftById, setStatusDraftById] = useState<Record<string, StatusDraft>>(() =>
    Object.fromEntries(
      supplementRequests.map((request) => [request.id, statusDraftFromRequest(request)])
    )
  );
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isMetadataPending, startMetadataTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();

  const requestById = useMemo(
    () => Object.fromEntries(supplementRequests.map((request) => [request.id, request])),
    [supplementRequests]
  );

  function setCreateField(next: Partial<MetadataDraft>) {
    setCreateDraft((current) => ({ ...current, ...next }));
  }

  function setRowMessage(requestId: string, message: string) {
    setRowMessages((current) => ({ ...current, [requestId]: message }));
  }

  function setMetadataDraft(requestId: string, next: Partial<MetadataDraft>) {
    setMetadataDraftById((current) => {
      const snapshot = requestById[requestId];
      return {
        ...current,
        [requestId]: {
          ...(current[requestId] ?? (snapshot ? draftFromRequest(snapshot) : defaultMetadataDraft)),
          ...next
        }
      };
    });
  }

  function setStatusDraft(requestId: string, next: Partial<StatusDraft>) {
    setStatusDraftById((current) => {
      const snapshot = requestById[requestId];
      return {
        ...current,
        [requestId]: {
          ...(current[requestId] ??
            (snapshot
              ? statusDraftFromRequest(snapshot)
              : { status: "RECEIVED", note: "", responseNote: "", respondedAt: "" })),
          ...next
        }
      };
    });
  }

  function onCreateSupplementRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = createDraft.title.trim();
    if (!title) {
      setCreateMessage("보완 요청 제목을 입력하세요.");
      return;
    }

    setCreateMessage("");
    startCreateTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/supplement-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description: createDraft.description.trim() || null,
          receivedAt: createDraft.receivedAt || null,
          dueDate: createDraft.dueDate || null,
          requestedDocsJson: createDraft.requestedDocsJson.trim() || null,
          responseNote: createDraft.responseNote.trim() || null,
          expectedCaseUpdatedAt: caseMatterUpdatedAt
        })
      });

      if (!response.ok) {
        setCreateMessage(await parseClientApiError(response, "보완 요청을 생성하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setCreateMessage("보완 요청을 생성했습니다. 최신 상태를 다시 불러옵니다.");
      setCreateDraft(defaultMetadataDraft);
      router.refresh();
    });
  }

  function submitMetadata(requestId: string) {
    const snapshot = requestById[requestId];
    if (!snapshot) return;

    const draft = metadataDraftById[requestId] ?? draftFromRequest(snapshot);
    if (!draft.title.trim()) {
      setRowMessage(requestId, "보완 요청 제목을 입력하세요.");
      return;
    }

    setPendingRequestId(requestId);
    setRowMessage(requestId, "");
    startMetadataTransition(async () => {
      const response = await fetch(
        `/api/admin/case-matters/${caseMatterId}/supplement-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mode: "metadata",
            title: draft.title,
            description: draft.description.trim() || null,
            receivedAt: draft.receivedAt || null,
            dueDate: draft.dueDate || null,
            requestedDocsJson: draft.requestedDocsJson.trim() || null,
            responseNote: draft.responseNote.trim() || null,
            expectedUpdatedAt: snapshot.updatedAt
          })
        }
      );

      if (!response.ok) {
        setRowMessage(
          requestId,
          await parseClientApiError(response, "보완 요청 정보를 수정하지 못했습니다.")
        );
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        setPendingRequestId(null);
        return;
      }

      setRowMessage(requestId, "보완 요청 정보를 수정했습니다. 최신 상태를 다시 불러옵니다.");
      setPendingRequestId(null);
      router.refresh();
    });
  }

  function submitStatus(requestId: string, nextStatus?: SupplementStatusValue) {
    const snapshot = requestById[requestId];
    if (!snapshot) return;

    const draft = statusDraftById[requestId] ?? statusDraftFromRequest(snapshot);
    const status = nextStatus ?? draft.status;
    if (status === snapshot.status && draft.responseNote.trim() === (snapshot.responseNote ?? "")) {
      setRowMessage(requestId, "변경할 상태가 없습니다.");
      return;
    }

    setPendingRequestId(requestId);
    setRowMessage(requestId, "");
    startStatusTransition(async () => {
      const response = await fetch(
        `/api/admin/case-matters/${caseMatterId}/supplement-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mode: "status",
            status,
            statusChangeNote: draft.note.trim() || null,
            responseNote: draft.responseNote.trim() || null,
            respondedAt: draft.respondedAt || null,
            expectedUpdatedAt: snapshot.updatedAt
          })
        }
      );

      if (!response.ok) {
        setRowMessage(
          requestId,
          await parseClientApiError(response, "보완 요청 상태를 변경하지 못했습니다.")
        );
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        setPendingRequestId(null);
        return;
      }

      setRowMessage(requestId, "보완 요청 상태를 변경했습니다. 최신 상태를 다시 불러옵니다.");
      setPendingRequestId(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-muted p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-text-strong">보완 요청 관리</p>
        <p className="mt-1 text-xs text-text-muted">
          기관 보완 요청의 기한, 요청 자료, 답변 상태를 관리합니다. 고객 자동 알림이나
          외부 발송은 하지 않습니다.
        </p>
      </div>

      <form
        onSubmit={onCreateSupplementRequest}
        className="mb-4 space-y-3 rounded-xl border border-line bg-surface p-3"
      >
        <p className="text-sm font-semibold text-text-strong">보완 요청 추가</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
          <input
            value={createDraft.title}
            onChange={(event) => setCreateField({ title: event.target.value })}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            placeholder="보완 요청 제목"
            maxLength={160}
          />
          <input
            value={createDraft.receivedAt}
            onChange={(event) => setCreateField({ receivedAt: event.target.value })}
            type="date"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            aria-label="수령일"
          />
          <input
            value={createDraft.dueDate}
            onChange={(event) => setCreateField({ dueDate: event.target.value })}
            type="date"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            aria-label="보완 기한"
          />
        </div>
        <textarea
          value={createDraft.description}
          onChange={(event) => setCreateField({ description: event.target.value })}
          rows={2}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
          placeholder="보완 요청 설명"
          maxLength={1000}
        />
        <textarea
          value={createDraft.requestedDocsJson}
          onChange={(event) => setCreateField({ requestedDocsJson: event.target.value })}
          rows={2}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
          placeholder="요청 자료 메모"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={isCreatePending}
          className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatePending ? "생성 중..." : "보완 요청 생성"}
        </button>
        {createMessage ? <p className="text-xs text-text-muted">{createMessage}</p> : null}
      </form>

      {supplementRequests.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-sm text-text-muted">등록된 보완 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {supplementRequests.map((request) => {
            const metadataDraft = metadataDraftById[request.id] ?? draftFromRequest(request);
            const statusDraft = statusDraftById[request.id] ?? statusDraftFromRequest(request);
            const rowBusy =
              pendingRequestId === request.id && (isMetadataPending || isStatusPending);
            const statusChanged =
              statusDraft.status !== request.status ||
              statusDraft.responseNote.trim() !== (request.responseNote ?? "");

            return (
              <div key={request.id} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-strong">{request.title}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {statusLabels[request.status]} | 수령 {formatDate(request.receivedAt)} | 기한{" "}
                      {formatDate(request.dueDate)} | 답변 {formatDateTime(request.respondedAt)}
                    </p>
                    {request.description ? (
                      <p className="mt-1 text-xs text-text-muted">{request.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => submitStatus(request.id, "RESPONDED")}
                    disabled={rowBusy || request.status === "RESPONDED"}
                    className="h-9 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    RESPONDED 처리
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-surface-muted p-3">
                  <p className="text-xs font-semibold text-text-strong">보완 요청 정보 수정</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_150px_150px]">
                    <input
                      value={metadataDraft.title}
                      onChange={(event) =>
                        setMetadataDraft(request.id, { title: event.target.value })
                      }
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      maxLength={160}
                      aria-label="보완 요청 제목"
                    />
                    <input
                      value={metadataDraft.receivedAt}
                      onChange={(event) =>
                        setMetadataDraft(request.id, { receivedAt: event.target.value })
                      }
                      type="date"
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      aria-label="수령일"
                    />
                    <input
                      value={metadataDraft.dueDate}
                      onChange={(event) =>
                        setMetadataDraft(request.id, { dueDate: event.target.value })
                      }
                      type="date"
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      aria-label="보완 기한"
                    />
                  </div>
                  <textarea
                    value={metadataDraft.description}
                    onChange={(event) =>
                      setMetadataDraft(request.id, { description: event.target.value })
                    }
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder="보완 요청 설명"
                    maxLength={1000}
                  />
                  <textarea
                    value={metadataDraft.requestedDocsJson}
                    onChange={(event) =>
                      setMetadataDraft(request.id, { requestedDocsJson: event.target.value })
                    }
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder="요청 자료 메모"
                    maxLength={2000}
                  />
                  <textarea
                    value={metadataDraft.responseNote}
                    onChange={(event) =>
                      setMetadataDraft(request.id, { responseNote: event.target.value })
                    }
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder="답변 메모"
                    maxLength={1000}
                  />
                  <button
                    type="button"
                    onClick={() => submitMetadata(request.id)}
                    disabled={rowBusy}
                    className="mt-3 h-9 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rowBusy ? "수정 중..." : "보완 요청 정보 수정"}
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-surface-muted p-3">
                  <p className="text-xs font-semibold text-text-strong">상태 변경</p>
                  <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                    <select
                      value={statusDraft.status}
                      onChange={(event) =>
                        setStatusDraft(request.id, {
                          status: event.target.value as SupplementStatusValue
                        })
                      }
                      className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                    >
                      {supplementStatusValues.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <input
                      value={statusDraft.respondedAt}
                      onChange={(event) =>
                        setStatusDraft(request.id, { respondedAt: event.target.value })
                      }
                      type="date"
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      aria-label="답변일"
                    />
                    <button
                      type="button"
                      onClick={() => submitStatus(request.id)}
                      disabled={rowBusy || !statusChanged}
                      className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {rowBusy ? "변경 중..." : "상태 적용"}
                    </button>
                  </div>
                  <textarea
                    value={statusDraft.responseNote}
                    onChange={(event) =>
                      setStatusDraft(request.id, { responseNote: event.target.value })
                    }
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder="답변 메모"
                    maxLength={1000}
                  />
                  <textarea
                    value={statusDraft.note}
                    onChange={(event) => setStatusDraft(request.id, { note: event.target.value })}
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder="감사 로그 사유(선택)"
                    maxLength={300}
                  />
                </div>

                {rowMessages[request.id] ? (
                  <p className="mt-2 text-xs text-text-muted">{rowMessages[request.id]}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
