import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { QuoteWorkspacePanel } from "@/components/admin/quote-workspace";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getInquiryById } from "@/lib/services/inquiry-service";
import { getQuoteWorkspaceForInquiry } from "@/lib/services/quote-service";

export const dynamic = "force-dynamic";

export default async function AdminInquiryQuotePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminPageSession(`/admin/inquiries/${id}/quote`);
  const inquiry = await getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const workspace = await getQuoteWorkspaceForInquiry(id);

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-kicker">Quote</p>
            <h2 className="mt-2 ui-page-title">{inquiry.title}</h2>
            <p className="ui-section-copy mt-2">
              Quote and contract flow has been isolated from the inquiry summary route.
            </p>
          </div>
          <Link
            href={`/admin/inquiries/${id}`}
            className="ui-toolbar-button px-4 py-2 text-sm"
          >
            Back to summary
          </Link>
        </div>
      </Card>

      <QuoteWorkspacePanel inquiryId={id} workspace={workspace} />
    </div>
  );
}
