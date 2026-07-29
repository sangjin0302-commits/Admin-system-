import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GoogleServicesClient } from "./google-services-client";

export const dynamic = "force-dynamic";

export default function GoogleServicesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="Google Drive · Docs · Meet"
        description="기존 Google OAuth 연결을 확장해 사건 자료 폴더(Drive), 문서 생성(Docs), 화상 상담 링크(Meet)를 사용합니다."
      />
      <GoogleServicesClient />
    </div>
  );
}
