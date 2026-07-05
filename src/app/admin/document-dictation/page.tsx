import { AdminPageHeader } from "@/components/admin/admin-page-header";

import { DictationClient } from "./dictation-client";

export const dynamic = "force-dynamic";

export default function DocumentDictationPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Productivity"
        title="음성 서면 받아쓰기"
        description="구술한 내용을 정형화된 법률 서면으로 자동 변환합니다."
      />
      <DictationClient />
    </div>
  );
}
