import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { InquiryManagementForm } from "@/components/admin/inquiry-management-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getInquiryById } from "@/lib/services/inquiry-service";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import {
  clientTypeLabels,
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  urgencyLabels
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function AdminInquiryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminPageSession(`/admin/inquiries/${id}`);
  const inquiry = await getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const tags = parseJsonArray(inquiry.serviceTags);
  const precheckDocs = parseJsonArray(inquiry.precheckRecommendedDocs).map((entry) => String(entry));

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="status" status={inquiry.status}>
                {inquiryStatusLabels[inquiry.status].ko}
              </Badge>
              <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                {urgencyLabels[inquiry.urgencyLevel].ko}
              </Badge>
              <Badge>{inquiryTypeLabels[inquiry.inquiryType].ko}</Badge>
              <Badge tone="language" language={inquiry.preferredLanguage}>
                {languageCodeLabels[inquiry.preferredLanguage].ko}
              </Badge>
            </div>

            <div>
              <p className="ui-kicker">Inquiry</p>
              <h2 className="mt-2 ui-page-title">{inquiry.title}</h2>
              <p className="mt-3 max-w-3xl text-sm text-text">{inquiry.generatedSummary}</p>
            </div>

            <div className="grid gap-3 text-sm text-text-muted sm:grid-cols-2 xl:grid-cols-3">
              <p>ID: {inquiry.id}</p>
              <p>Created: {formatDateTime(inquiry.createdAt)}</p>
              <p>Updated: {formatDateTime(inquiry.updatedAt)}</p>
              <p>Contact: {inquiry.contactName}</p>
              <p>Email: {inquiry.email}</p>
              <p>Phone: {inquiry.phone || "-"}</p>
              <p>Client: {clientTypeLabels[inquiry.clientType].ko}</p>
              <p>Corporate: {inquiry.isCorporateRequest ? "Yes" : "No"}</p>
              <p>Assignee: {inquiry.assignee || "-"}</p>
            </div>
          </div>

          <div className="w-full max-w-md">
            <Card muted className="p-5">
              <InquiryManagementForm
                inquiryId={inquiry.id}
                status={inquiry.status}
                assignee={inquiry.assignee}
                internalMemo={inquiry.internalMemo}
              />
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h3 className="ui-section-title">Inquiry Summary</h3>
          <div className="mt-5 grid gap-4 text-sm text-text sm:grid-cols-2">
            <InfoItem label="Nationality" value={inquiry.nationality} />
            <InfoItem label="Current status" value={inquiry.currentStatus} />
            <InfoItem label="Document country" value={inquiry.documentCountry} />
            <InfoItem label="Target agency" value={inquiry.targetAgency} />
            <InfoItem
              label="Requested type"
              value={inquiryTypeLabels[inquiry.requestedInquiryType ?? "UNKNOWN"].ko}
            />
            <InfoItem
              label="Declared urgency"
              value={urgencyLabels[inquiry.declaredUrgency ?? "MEDIUM"].ko}
            />
            <InfoItem label="Due date" value={formatDateTime(inquiry.dueDate)} />
            <InfoItem label="Prepared docs" value={inquiry.hasPreparedDocuments ? "Yes" : "No"} />
            <InfoItem label="Translation" value={inquiry.needsTranslation ? "Yes" : "No"} />
            <InfoItem label="Callback" value={inquiry.wantsCallback ? "Yes" : "No"} />
          </div>

          <Card muted className="mt-6 p-5">
            <p className="ui-kicker">Original request</p>
            <p className="mt-3 whitespace-pre-line text-sm text-text">{inquiry.description}</p>
          </Card>

          <Card muted className="mt-4 p-5">
            <p className="ui-kicker">Requested outcome</p>
            <p className="mt-3 whitespace-pre-line text-sm text-text">
              {inquiry.requestedOutcome || "-"}
            </p>
          </Card>
        </Card>

        <Card className="p-6">
          <h3 className="ui-section-title">Precheck Snapshot</h3>
          <div className="mt-5 grid gap-3">
            <InfoItem label="Type" value={inquiryTypeLabels[inquiry.inquiryType].ko} />
            <InfoItem label="Urgency" value={urgencyLabels[inquiry.urgencyLevel].ko} />
            <InfoItem
              label="Consultation"
              value={inquiry.consultationRequired ? "Required" : "Guidance first"}
            />
            <InfoItem
              label="Confidence"
              value={`${Math.round(inquiry.classificationConfidence * 100)}%`}
            />
            <InfoItem label="Qualification" value={`${inquiry.qualificationScore} / 100`} />
          </div>

          <Card muted className="mt-5 p-5">
            <p className="ui-kicker">Classification reason</p>
            <p className="mt-3 text-sm text-text">{inquiry.classificationReason}</p>
          </Card>

          <Card muted className="mt-5 p-5">
            <p className="ui-kicker">Recommended next step</p>
            <p className="mt-3 text-sm text-text">{inquiry.recommendedNextStep}</p>
          </Card>

          <Card muted className="mt-5 p-5">
            <p className="ui-kicker">Recommended documents</p>
            <ul className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text">
              {precheckDocs.length > 0 ? (
                precheckDocs.map((doc) => <li key={doc}>{doc}</li>)
              ) : (
                <li>No generated document list</li>
              )}
            </ul>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-kicker">Workspaces</p>
            <h3 className="mt-2 ui-section-title">Move heavy flows into route-level bundles</h3>
            <p className="mt-2 text-sm text-text-muted">
              Quote, case, and relationship tools now load on dedicated subroutes instead of this
              summary page.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <RouteLink href={`/admin/inquiries/${inquiry.id}/quote`} label="Quote workspace" />
            <RouteLink href={`/admin/inquiries/${inquiry.id}/case`} label="Case workspace" />
            <RouteLink
              href={`/admin/inquiries/${inquiry.id}/relationship`}
              label="Relationship workspace"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function RouteLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-text transition hover:border-text hover:text-text"
    >
      {label}
    </Link>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm text-text">{value || "-"}</p>
    </Card>
  );
}
