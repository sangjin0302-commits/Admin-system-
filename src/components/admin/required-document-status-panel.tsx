"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import { parseClientApiError } from "@/lib/http/client-api";
import { formatDate } from "@/lib/utils";
import {
  getRequiredDocumentStatusLabel,
  requiredDocumentStatusValues,
  type RequiredDocumentStatusValue
} from "@/types/case-matter";

type RequiredDocumentItem = {
  id: string;
  name: string;
  required: boolean;
  status: RequiredDocumentStatusValue;
  dueDate: Date | null;
  updatedAt: string;
};

type RequiredDocumentStatusPanelProps = {
  caseMatterId: string;
  caseMatterUpdatedAt: string;
  documents: RequiredDocumentItem[];
  allowedTransitionsByDocumentId: Record<string, readonly RequiredDocumentStatusValue[]>;
};

type DraftState = {
  status: RequiredDocumentStatusValue;
  note: string;
};

export function RequiredDocumentStatusPanel({
  caseMatterId,
  caseMatterUpdatedAt,
  documents,
  allowedTransitionsByDocumentId
}: RequiredDocumentStatusPanelProps) {
  const router = useRouter();
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createRequired, setCreateRequired] = useState(true);
  const [createMessage, setCreateMessage] = useState("");
  const [rowMessages, setRowMessages] = useState<Record<string, string>>({});
  const [draftById, setDraftById] = useState<Record<string, DraftState>>(() =>
    Object.fromEntries(
      documents.map((document) => [
        document.id,
        {
          status: document.status,
          note: ""
        }
      ])
    )
  );
  const [isRowPending, startRowTransition] = useTransition();
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isStarterPending, startStarterTransition] = useTransition();

  const documentById = useMemo(
    () => Object.fromEntries(documents.map((document) => [document.id, document])),
    [documents]
  );

  function setRowDraft(documentId: string, nextDraft: Partial<DraftState>) {
    setDraftById((current) => ({
      ...current,
      [documentId]: {
        ...(current[documentId] ?? {
          status: documentById[documentId]?.status ?? "NEEDED",
          note: ""
        }),
        ...nextDraft
      }
    }));
  }

  function setRowMessage(documentId: string, message: string) {
    setRowMessages((current) => ({
      ...current,
      [documentId]: message
    }));
  }

  function submitRow(documentId: string) {
    const snapshot = documentById[documentId];
    if (!snapshot) return;

    const draft = draftById[documentId] ?? {
      status: snapshot.status,
      note: ""
    };
    const statusChanged = draft.status !== snapshot.status;
    if (!statusChanged) {
      setRowMessage(documentId, "변경할 상태가 없습니다.");
      return;
    }

    setPendingDocumentId(documentId);
    setRowMessage(documentId, "");

    const statusChangeNote = draft.note.trim();

    startRowTransition(async () => {
      const response = await fetch(
        `/api/admin/case-matters/${caseMatterId}/required-documents/${documentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: draft.status,
            statusChangeNote: statusChangeNote || undefined,
            expectedUpdatedAt: snapshot.updatedAt
          })
        }
      );

      if (!response.ok) {
        setRowMessage(documentId, await parseClientApiError(response, "문서 상태를 변경하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        setPendingDocumentId(null);
        return;
      }

      setRowMessage(documentId, "문서 상태가 변경되었습니다. 최신 상태를 다시 불러옵니다...");
      setPendingDocumentId(null);
      router.refresh();
    });
  }

  function onCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = createName.trim();
    if (!name) {
      setCreateMessage("필수서류 이름은 반드시 입력해야 합니다.");
      return;
    }

    setCreateMessage("");
    startCreateTransition(async () => {
      const response = await fetch(`/api/admin/case-matters/${caseMatterId}/required-documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description: createDescription.trim() || undefined,
          required: createRequired,
          dueDate: createDueDate || undefined,
          expectedCaseUpdatedAt: caseMatterUpdatedAt
        })
      });

      if (!response.ok) {
        setCreateMessage(await parseClientApiError(response, "필수서류를 생성하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setCreateMessage("필수서류가 생성되었습니다. 최신 상태를 다시 불러옵니다...");
      setCreateName("");
      setCreateDescription("");
      setCreateDueDate("");
      router.refresh();
    });
  }

  function onStartChecklistStarter() {
    setCreateMessage("");
    startStarterTransition(async () => {
      const response = await fetch(
        `/api/admin/case-matters/${caseMatterId}/required-documents/starter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            expectedCaseUpdatedAt: caseMatterUpdatedAt
          })
        }
      );

      if (!response.ok) {
        setCreateMessage(await parseClientApiError(response, "체크리스트 스타터를 실행하지 못했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { createdCount?: number; skippedCount?: number }
        | null;
      const createdCount = payload?.createdCount ?? 0;
      const skippedCount = payload?.skippedCount ?? 0;
      setCreateMessage(
        `체크리스트 스타터를 적용했습니다. ${createdCount}건 생성, 기존 ${skippedCount}건은 건너뛰었습니다.`
      );
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-muted p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-text-strong">필수서류</p>
        <p className="mt-1 text-xs text-text-muted">
          모든 상태 변경은 결정적 전이 규칙과 감사 이벤트를 거칩니다.
        </p>
      </div>

      <form
        onSubmit={onCreateDocument}
        className="mb-4 space-y-3 rounded-xl border border-line bg-surface p-3"
      >
        <p className="text-sm font-semibold text-text-strong">체크리스트 항목 추가</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <input
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            placeholder="서류명"
            maxLength={120}
          />
          <input
            value={createDueDate}
            onChange={(event) => setCreateDueDate(event.target.value)}
            type="date"
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
          />
        </div>
        <textarea
          value={createDescription}
          onChange={(event) => setCreateDescription(event.target.value)}
          rows={2}
          className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
          placeholder="문서 메모(선택)"
          maxLength={300}
        />
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={createRequired}
            onChange={(event) => setCreateRequired(event.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          필수 항목
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isCreatePending}
            className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatePending ? "생성 중..." : "항목 생성"}
          </button>
          <button
            type="button"
            onClick={onStartChecklistStarter}
            disabled={isStarterPending}
            className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarterPending ? "적용 중..." : "체크리스트 스타터로 시작"}
          </button>
        </div>
        {createMessage ? <p className="text-xs text-text-muted">{createMessage}</p> : null}
      </form>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-sm text-text-muted">
            아직 필수서류 항목이 없습니다. 직접 항목을 추가하거나 체크리스트 스타터로 시작하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => {
            const draft = draftById[document.id] ?? { status: document.status, note: "" };
            const rowBusy = isRowPending && pendingDocumentId === document.id;
            const allowedTargets =
              allowedTransitionsByDocumentId[document.id]?.length
                ? allowedTransitionsByDocumentId[document.id]
                : requiredDocumentStatusValues;
            const changed = draft.status !== document.status;

            return (
              <div key={document.id} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-strong">{document.name}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {document.required ? "필수" : "선택"} | 현재 상태:{" "}
                      <span className="font-medium text-text-strong">
                        {getRequiredDocumentStatusLabel(document.status)}
                      </span>{" "}
                      | 마감: {formatDate(document.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-3 lg:flex-row">
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setRowDraft(document.id, {
                        status: event.target.value as RequiredDocumentStatusValue
                      })
                    }
                    className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                  >
                    {allowedTargets.map((value) => (
                      <option key={value} value={value}>
                        {getRequiredDocumentStatusLabel(value)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => submitRow(document.id)}
                    disabled={!changed || rowBusy}
                    className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rowBusy ? "변경 중..." : "적용"}
                  </button>
                </div>

                <textarea
                  value={draft.note}
                  onChange={(event) => setRowDraft(document.id, { note: event.target.value })}
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                  placeholder="감사 로그용 사유(선택)"
                />

                {rowMessages[document.id] ? (
                  <p className="mt-2 text-xs text-text-muted">{rowMessages[document.id]}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
