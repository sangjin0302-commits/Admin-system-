import Link from "next/link";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { PublicIntakeContentForm } from "@/components/admin/public-intake-content-form";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getPublicIntakeContent } from "@/lib/public-content/service";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const session = await requireAdminPageSession("/admin/content", "ADMIN");
  const content = await getPublicIntakeContent();

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Content Settings</p>
            <h2 className="mt-2 ui-page-title">공개 접수 문구 설정</h2>
            <p className="ui-section-copy mt-2">
              외부 공개 접수 안내, 전문 분야 소개, 접수 페이지 설명을 관리자에서 직접 수정할 수
              있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/intake" className="ui-toolbar-button">
              공개 접수 보기
            </Link>
            <Link href="/admin" className="ui-toolbar-button">
              관리자 홈으로 이동
            </Link>
          </div>
        </div>
      </Card>

      <PublicIntakeContentForm initialContent={content} />
    </div>
  );
}
