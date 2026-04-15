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
            <p className="ui-kicker">사건 / 제출 관리</p>
            <h2 className="mt-2 ui-page-title">{inquiry.title}</h2>
            <p className="ui-section-copy mt-2">
              사건 생성, 파일, 제출 패키지, 보완 요청, 기한 관리는 이 전용 화면에서 따로 처리합니다.
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

      <CaseWorkflowPanel initialCaseWorkspace={workspace} />
    </div>
  );
}

