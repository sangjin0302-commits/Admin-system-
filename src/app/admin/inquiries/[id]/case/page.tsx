import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { CaseWorkflowPanel } from "@/components/admin/case-workflow-panel";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getCaseWorkspaceForInquiry } from "@/lib/services/case-service";
import { getInquiryById } from "@/lib/services/inquiry-service";

export const dynamic = "force-dynamic";

export default async function AdminInquiryCasePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminPageSession(`/admin/inquiries/${id}/case`);
  const inquiry = await getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const workspace = await getCaseWorkspaceForInquiry(id);

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-kicker">Case</p>
            <h2 className="mt-2 ui-page-title">{inquiry.title}</h2>
            <p className="mt-2 text-sm text-text-muted">
              Case, files, submission, supplement, and deadline workflow now loads on its own
              route.
            </p>
          </div>
          <Link
            href={`/admin/inquiries/${id}`}
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-text transition hover:border-text hover:text-text"
          >
            Back to summary
          </Link>
        </div>
      </Card>

      <CaseWorkflowPanel initialCaseWorkspace={workspace} />
    </div>
  );
}
