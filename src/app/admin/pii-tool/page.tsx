import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";

import { PiiForm } from "./pii-form";

export const dynamic = "force-dynamic";

export default function PiiToolPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Compliance"
        title="PII 마스킹 도구"
        description="개인정보(주민등록번호, 여권번호, 전화번호, 이메일, 카드번호 등)를 탐지하고 마스킹합니다."
      />
      <Card className="p-6">
        <p className="text-sm text-text-muted">
          입력한 텍스트에서 정규식 기반으로 한국 주민등록번호, 외국인등록번호, 여권번호, 휴대전화,
          이메일, 신용카드 번호를 자동으로 식별합니다.
        </p>
      </Card>
      <PiiForm />
    </div>
  );
}
