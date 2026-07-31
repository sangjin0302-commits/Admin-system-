import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DocTemplatesClient } from "./doc-templates-client";

export const dynamic = "force-dynamic";

export default function DocTemplatesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="문서 서식(템플릿)"
        description="위임장·수임계약서·의견서 등 자주 쓰는 서식을 등록해두면, 사건 상세에서 클릭 한 번으로 사건 데이터가 채워진 구글 문서·PDF를 만들 수 있습니다."
      />
      <DocTemplatesClient />
    </div>
  );
}
