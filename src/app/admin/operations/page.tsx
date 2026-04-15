import Link from "next/link";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { OperationsSettingsForm } from "@/components/admin/operations-settings-form";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { getOperationsSettings } from "@/lib/operations-content/service";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  const session = await requireAdminPageSession("/admin/operations", "ADMIN");
  const settings = await getOperationsSettings();

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Operations Settings</p>
            <h2 className="mt-2 ui-page-title">상담 / 결제 운영 설정</h2>
            <p className="ui-section-copy mt-2">
              링크가 없어도 운영 가능한 기본 문구와 안내 방식을 여기서 정리해 두고, 접수 상세와 견적 화면에서 바로 복사해 사용할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/inquiries" className="ui-toolbar-button">
              접수 내역으로 이동
            </Link>
            <Link href="/admin/content" className="ui-toolbar-button">
              공개 문구 설정
            </Link>
          </div>
        </div>
      </Card>

      <OperationsSettingsForm initialSettings={settings} />
    </div>
  );
}
