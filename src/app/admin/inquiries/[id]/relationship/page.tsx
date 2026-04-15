import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { ClientRelationshipPanel } from "@/components/admin/client-relationship-panel";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getInquiryById } from "@/lib/services/inquiry-service";
import { getClientRelationshipWorkspaceForInquiry } from "@/lib/services/client-relationship-service";

export const dynamic = "force-dynamic";

export default async function AdminInquiryRelationshipPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminPageSession(`/admin/inquiries/${id}/relationship`);
  const inquiry = await getInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  const workspace = await getClientRelationshipWorkspaceForInquiry(id);

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-kicker">고객관리 / 후속조치</p>
            <h2 className="mt-2 ui-page-title">{inquiry.title}</h2>
            <p className="ui-section-copy mt-2">
              종결 처리, 후속조치, 리뷰 요청, 소개 관리, 재접촉 도구는 이 전용 화면에서 따로 확인합니다.
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

      <ClientRelationshipPanel initialWorkspace={workspace} />
    </div>
  );
}

