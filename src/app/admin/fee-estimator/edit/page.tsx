import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getFeeTable, getAdjustments } from "@/lib/services/fee-estimator-service";
import { FeeTableEditor } from "./fee-table-editor";

export const dynamic = "force-dynamic";

export default async function FeeTableEditPage() {
  const [table, adjustments] = await Promise.all([getFeeTable(), getAdjustments()]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="수임료 관리"
        title="가격표 편집"
        description="시장 기준 수임료 표와 조정 계수를 편집합니다. 저장 시 공개 /fees 페이지에도 즉시 반영됩니다."
      />
      <FeeTableEditor initialTable={table} initialAdjustments={adjustments} />
    </div>
  );
}
