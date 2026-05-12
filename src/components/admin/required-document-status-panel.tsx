"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import { adminCasesMessages } from "@/i18n/locales/admin-cases";
import { createTranslator, type UiLocale } from "@/i18n/shared";
import { parseClientApiError } from "@/lib/http/client-api";
import { formatDate, stringifyDateForInput } from "@/lib/utils";
import {
  getRequiredDocumentStatusLabel,
  requiredDocumentStatusValues,
  type RequiredDocumentStatusValue
} from "@/types/case-matter";

type RequiredDocumentItem = {
  id: string;
  name: string;
  description: string | null;
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
  locale?: UiLocale;
};

type DraftState = {
  status: RequiredDocumentStatusValue;
  note: string;
};

type MetadataDraftState = {
  name: string;
  description: string;
  dueDate: string;
  required: boolean;
};

export function RequiredDocumentStatusPanel({
  caseMatterId,
  caseMatterUpdatedAt,
  documents,
  allowedTransitionsByDocumentId,
  locale = "ko"
}: RequiredDocumentStatusPanelProps) {
  const router = useRouter();
  const t = createTranslator(adminCasesMessages, locale);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [pendingMetadataDocumentId, setPendingMetadataDocumentId] = useState<string | null>(null);
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
  const [metadataDraftById, setMetadataDraftById] = useState<Record<string, MetadataDraftState>>(() =>
    Object.fromEntries(
      documents.map((document) => [
        document.id,
        {
          name: document.name,
          description: document.description ?? "",
          dueDate: stringifyDateForInput(document.dueDate),
          required: document.required
        }
      ])
    )
  );
  const [isRowPending, startRowTransition] = useTransition();
  const [isMetadataPending, startMetadataTransition] = useTransition();
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

  function setMetadataDraft(documentId: string, nextDraft: Partial<MetadataDraftState>) {
    setMetadataDraftById((current) => {
      const snapshot = documentById[documentId];
      return {
        ...current,
        [documentId]: {
          ...(current[documentId] ??
            (snapshot
              ? {
                  name: snapshot.name,
                  description: snapshot.description ?? "",
                  dueDate: stringifyDateForInput(snapshot.dueDate),
                  required: snapshot.required
                }
              : {
                  name: "",
                  description: "",
                  dueDate: "",
                  required: true
                })),
          ...nextDraft
        }
      };
    });
  }

  function submitMetadata(documentId: string) {
    const snapshot = documentById[documentId];
    if (!snapshot) return;

    const draft =
      metadataDraftById[documentId] ??
      ({
        name: snapshot.name,
        description: snapshot.description ?? "",
        dueDate: stringifyDateForInput(snapshot.dueDate),
        required: snapshot.required
      } satisfies MetadataDraftState);

    if (!draft.name.trim()) {
      setRowMessage(documentId, t("metadataNameRequired"));
      return;
    }

    setPendingMetadataDocumentId(documentId);
    setRowMessage(documentId, "");

    startMetadataTransition(async () => {
      const response = await fetch(
        `/api/admin/case-matters/${caseMatterId}/required-documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: draft.name,
            description: draft.description.trim() || null,
            required: draft.required,
            dueDate: draft.dueDate || null,
            expectedUpdatedAt: snapshot.updatedAt,
            expectedCaseUpdatedAt: caseMatterUpdatedAt
          })
        }
      );

      if (!response.ok) {
        setRowMessage(documentId, await parseClientApiError(response, t("metadataUpdateFailed")));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        setPendingMetadataDocumentId(null);
        return;
      }

      setRowMessage(documentId, t("metadataUpdateSuccess"));
      setPendingMetadataDocumentId(null);
      router.refresh();
    });
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
      setRowMessage(documentId, t("documentNoStatusChange"));
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
        setRowMessage(documentId, await parseClientApiError(response, t("documentUpdateFailed")));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        setPendingDocumentId(null);
        return;
      }

      setRowMessage(documentId, t("documentUpdateSuccess"));
      setPendingDocumentId(null);
      router.refresh();
    });
  }

  function onCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = createName.trim();
    if (!name) {
      setCreateMessage(t("createNameRequired"));
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
        setCreateMessage(await parseClientApiError(response, t("createFailed")));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setCreateMessage(t("createSuccess"));
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
        setCreateMessage(await parseClientApiError(response, t("starterFailed")));
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
        `${t("starterSuccessPrefix")} ${t("starterCreatedCount")} ${createdCount}, ${t("starterSkippedCount")} ${skippedCount}`
      );
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-muted p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-text-strong">{t("requiredDocPanelTitle")}</p>
        <p className="mt-1 text-xs text-text-muted">{t("requiredDocPanelDescription")}</p>
      </div>

      <form
        onSubmit={onCreateDocument}
        className="mb-4 space-y-3 rounded-xl border border-line bg-surface p-3"
      >
        <p className="text-sm font-semibold text-text-strong">{t("checklistCreateTitle")}</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <input
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
            placeholder={t("createNamePlaceholder")}
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
          placeholder={t("createDescriptionPlaceholder")}
          maxLength={300}
        />
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={createRequired}
            onChange={(event) => setCreateRequired(event.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          {t("requiredFlagLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isCreatePending}
            className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatePending ? t("creatingItem") : t("createItem")}
          </button>
          <button
            type="button"
            onClick={onStartChecklistStarter}
            disabled={isStarterPending}
            className="h-10 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarterPending ? t("startingStarterChecklist") : t("startStarterChecklist")}
          </button>
        </div>
        {createMessage ? <p className="text-xs text-text-muted">{createMessage}</p> : null}
      </form>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-sm text-text-muted">{t("emptyDocuments")}</p>
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
                    {document.description ? (
                      <p className="mt-1 text-xs text-text-muted">{document.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-text-muted">
                      {document.required ? t("requiredTagRequired") : t("requiredTagOptional")} |{" "}
                      {t("documentCurrentStatusPrefix")}:{" "}
                      <span className="font-medium text-text-strong">
                        {getRequiredDocumentStatusLabel(document.status, locale)}
                      </span>{" "}
                      | {t("documentDueDatePrefix")}: {formatDate(document.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-surface-muted p-3">
                  <p className="text-xs font-semibold text-text-strong">{t("metadataEditTitle")}</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_160px]">
                    <input
                      value={metadataDraftById[document.id]?.name ?? document.name}
                      onChange={(event) => setMetadataDraft(document.id, { name: event.target.value })}
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      maxLength={120}
                      aria-label={t("metadataNameLabel")}
                    />
                    <input
                      value={metadataDraftById[document.id]?.dueDate ?? stringifyDateForInput(document.dueDate)}
                      onChange={(event) => setMetadataDraft(document.id, { dueDate: event.target.value })}
                      type="date"
                      className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text-strong outline-none focus:border-line-strong"
                      aria-label={t("metadataDueDateLabel")}
                    />
                  </div>
                  <textarea
                    value={metadataDraftById[document.id]?.description ?? document.description ?? ""}
                    onChange={(event) =>
                      setMetadataDraft(document.id, { description: event.target.value })
                    }
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                    placeholder={t("createDescriptionPlaceholder")}
                    maxLength={300}
                    aria-label={t("metadataDescriptionLabel")}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={metadataDraftById[document.id]?.required ?? document.required}
                        onChange={(event) =>
                          setMetadataDraft(document.id, { required: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-line"
                      />
                      {t("requiredFlagLabel")}
                    </label>
                    <button
                      type="button"
                      onClick={() => submitMetadata(document.id)}
                      disabled={isMetadataPending && pendingMetadataDocumentId === document.id}
                      className="h-9 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isMetadataPending && pendingMetadataDocumentId === document.id
                        ? t("metadataUpdating")
                        : t("metadataApply")}
                    </button>
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
                        {getRequiredDocumentStatusLabel(value, locale)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => submitRow(document.id)}
                    disabled={!changed || rowBusy}
                    className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {rowBusy ? t("rowApplying") : t("rowApply")}
                  </button>
                </div>

                <textarea
                  value={draft.note}
                  onChange={(event) => setRowDraft(document.id, { note: event.target.value })}
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text outline-none focus:border-line-strong"
                  placeholder={t("rowAuditPlaceholder")}
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
