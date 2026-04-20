import Link from "next/link";

import { CaseMatterStatusForm } from "@/components/admin/case-matter-status-form";
import { RequiredDocumentStatusPanel } from "@/components/admin/required-document-status-panel";
import { Card } from "@/components/ui/card";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import {
  getAllowedCaseMatterTransitions
} from "@/lib/services/case-matter-status-transition-helpers";
import {
  getCaseMatterById
} from "@/lib/services/case-matter-service";
import { getAllowedRequiredDocumentTransitions } from "@/lib/services/required-document-status-transition-helpers";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  getCaseMatterStatusLabel,
  normalizeCaseMatterStatus,
  normalizeRequiredDocumentStatus
} from "@/types/case-matter";

export const dynamic = "force-dynamic";

export default async function AdminCaseMatterDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawCaseMatterId } = await params;
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);

  if (!caseMatterId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">Invalid case id</h2>
        <p className="mt-2 text-sm text-text-muted">The case id format is not valid.</p>
        <Link
          href="/admin/cases"
          className="mt-4 inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
        >
          Back to case list
        </Link>
      </Card>
    );
  }

  const caseMatter = await getCaseMatterById(caseMatterId);
  if (!caseMatter) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">Case not found</h2>
        <p className="mt-2 text-sm text-text-muted">
          This case may have been removed, or you may be using an outdated link.
        </p>
        <Link
          href="/admin/cases"
          className="mt-4 inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
        >
          Back to case list
        </Link>
      </Card>
    );
  }

  const currentStatus = normalizeCaseMatterStatus(caseMatter.status);
  const allowedCaseTransitions = getAllowedCaseMatterTransitions(currentStatus).map((status) =>
    normalizeCaseMatterStatus(status)
  );
  const requiredDocuments = caseMatter.requiredDocuments.map((item) => ({
    id: item.id,
    name: item.name,
    required: item.required,
    status: normalizeRequiredDocumentStatus(item.status),
    dueDate: item.dueDate,
    updatedAt: item.updatedAt.toISOString()
  }));
  const allowedDocumentTransitionsById = Object.fromEntries(
    requiredDocuments.map((item) => [
      item.id,
      getAllowedRequiredDocumentTransitions(item.status).map((status) =>
        normalizeRequiredDocumentStatus(status)
      )
    ])
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ui-kicker">CaseMatter Detail</p>
            <h2 className="mt-2 text-2xl font-semibold text-text-strong">{caseMatter.title}</h2>
            <p className="mt-2 text-sm text-text-muted">
              {caseMatter.caseNo ?? "No caseNo"} | {caseMatter.matterType}
            </p>
          </div>
          <Link
            href="/admin/cases"
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            Back to case list
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">Status</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">{getCaseMatterStatusLabel(currentStatus)}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">Next action</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">{caseMatter.nextAction.message}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">Due date</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">{formatDate(caseMatter.dueDate)}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-muted p-3">
            <p className="text-xs text-text-muted">Updated</p>
            <p className="mt-1 text-sm font-semibold text-text-strong">{formatDateTime(caseMatter.updatedAt)}</p>
          </div>
        </div>
      </Card>

      <CaseMatterStatusForm
        caseMatterId={caseMatter.id}
        currentStatus={currentStatus}
        currentUpdatedAt={caseMatter.updatedAt.toISOString()}
        allowedTransitions={allowedCaseTransitions}
      />

      <RequiredDocumentStatusPanel
        caseMatterId={caseMatter.id}
        caseMatterUpdatedAt={caseMatter.updatedAt.toISOString()}
        documents={requiredDocuments}
        allowedTransitionsByDocumentId={allowedDocumentTransitionsById}
      />
    </div>
  );
}
