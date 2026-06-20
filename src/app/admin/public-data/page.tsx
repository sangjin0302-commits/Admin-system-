import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { LookupTools } from "./lookup-tools";

export const dynamic = "force-dynamic";

export default function PublicDataPage() {
  const apiKeySet = !!process.env.PUBLIC_DATA_API_KEY;

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        kicker="공공"
        title="공공데이터"
        description="data.go.kr 공공 API 조회 도구 (외국인 체류 / 법령 / 사업자)"
      />
      <Card className="p-4">
        <p className="text-sm text-text-muted">
          PUBLIC_DATA_API_KEY: {apiKeySet ? "설정됨" : "미설정 — 모의 데이터 반환"}
        </p>
      </Card>
      <LookupTools />
    </div>
  );
}
