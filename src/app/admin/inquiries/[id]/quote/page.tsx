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
            <p className="ui-kicker">견적 / 제안서</p>
            <h2 className="mt-2 ui-page-title">{inquiry.title}</h2>
            <p className="ui-section-copy mt-2">
              견적, 제안서, 계약 초안 흐름은 접수 요약 화면과 분리된 전용 화면에서 처리합니다.
            </p>
          </div>
          <Link
            href={`/admin/inquiries/${id}`}
            className="ui-toolbar-button px-4 py-2 text-sm"
          >
            접수 요약으로 돌아가기
          </Link>
        </div>
      </Card>

      <QuoteWorkspacePanel inquiryId={id} workspace={workspace} />
    </div>
  );
}

