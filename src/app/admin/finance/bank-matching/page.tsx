import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  listImportHistory,
  loadCandidatesPublic,
  getProviderStatus,
} from "@/lib/services/bank-transaction-matcher";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { BankMatchingClient } from "./bank-matching-client";

export const dynamic = "force-dynamic";

export default async function BankMatchingPage() {
  const [enabled, history, candidates, providers] = await Promise.all([
    isFeatureEnabled("bank_matching"),
    listImportHistory(),
    loadCandidatesPublic(),
    Promise.resolve(getProviderStatus()),
  ]);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Finance"
        title="은행 미수금 자동 매칭"
        description="은행에서 다운로드한 거래내역 CSV를 업로드하면 사건번호 또는 의뢰인명 + 금액으로 자동 매칭합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">은행 자동 매칭 기능이 비활성 상태입니다.</p>
        </Card>
      )}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">오픈뱅킹 상태</h3>
        <div className="mt-3 space-y-1 text-sm text-text-muted">
          <div>KB 오픈뱅킹: {providers.kb ? "연결" : "미연결"}</div>
          <div>신한 오픈 API: {providers.shinhan ? "연결" : "미연결"}</div>
          <div>금결원 공동 API: {providers.openBanking ? "연결" : "미연결"}</div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          실시간 조회는 향후 과제입니다. 지금은 CSV 업로드 방식으로 매칭할 수 있습니다.
        </p>
      </Card>

      <BankMatchingClient initialHistory={history} candidates={candidates} />
    </div>
  );
}
