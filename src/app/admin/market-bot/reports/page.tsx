import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { ReportsBrowser } from "./reports-browser";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Market"
        title="리포트"
        description="데일리/주간/월간/콘텐츠 리포트를 조회합니다."
      />
      <Card className="p-6">
        <ReportsBrowser />
      </Card>
    </div>
  );
}
