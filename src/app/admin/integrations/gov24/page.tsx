import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { listRequests, GOV24_DOC_TYPES } from "@/lib/services/gov24-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { Gov24Client } from "./gov24-client";

export const dynamic = "force-dynamic";

export default async function Gov24Page() {
  const [enabled, requests] = await Promise.all([
    isFeatureEnabled("gov24_integration"),
    listRequests(),
  ]);
  const hasApi = Boolean(process.env.GOV24_API_KEY?.trim());

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="정부24 서류 자동 발급"
        description="정부24 오픈 API로 주민등록등본·가족관계증명서 등을 요청합니다. OAuth + 본인 동의가 필요합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">정부24 연동이 비활성 상태입니다.</p>
        </Card>
      )}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">API 상태</h3>
        <p className="mt-2 text-sm text-text-muted">
          GOV24_API_KEY: {hasApi ? "설정됨" : "미설정 (수동 요청 안내)"}
        </p>
      </Card>

      <Gov24Client initialRequests={requests} docTypes={[...GOV24_DOC_TYPES]} />
    </div>
  );
}
