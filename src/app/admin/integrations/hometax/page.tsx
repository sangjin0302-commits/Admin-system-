import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getHometaxConfig,
  listRecentInvoices,
  type TaxInvoice,
} from "@/lib/services/hometax-integration-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

import { HometaxClient } from "./hometax-client";

export const dynamic = "force-dynamic";

function statusBadge(status: TaxInvoice["status"]) {
  const map: Record<TaxInvoice["status"], string> = {
    PENDING: "bg-warning/10 text-warning",
    ISSUED: "bg-success/10 text-success",
    FAILED: "bg-danger/10 text-danger",
  };
  const label = status === "PENDING" ? "대기" : status === "ISSUED" ? "발행됨" : "실패";
  return `inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`;
}

export default async function HometaxIntegrationPage() {
  const [enabled, config, invoices] = await Promise.all([
    isFeatureEnabled("hometax_integration"),
    getHometaxConfig(),
    listRecentInvoices(),
  ]);
  const hasCert = Boolean(process.env.HOMETAX_CERT_PATH?.trim() && process.env.HOMETAX_CERT_PASSWORD?.trim());

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="국세청 홈택스"
        description="세금계산서 자동 발행 및 매출 신고 동기화. 실제 발행은 공인인증서(사업자용) 설정이 필요합니다."
      />

      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">
            홈택스 연동 기능이 비활성 상태입니다. 관리자 &gt; 기능에서 `hometax_integration`을 켜주세요.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">연동 상태</h3>
        <div className="mt-3 space-y-2 text-sm text-text-muted">
          <div>HOMETAX_CERT_PATH: {hasCert ? "설정됨" : "미설정 (dry-run 발행)"}</div>
          <div>사업자등록번호: {config.bizNo ?? "-"}</div>
          <div>상호: {config.companyName ?? "-"}</div>
        </div>
      </Card>

      <HometaxClient initialConfig={config} initialInvoices={invoices} />

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">발행 이력</h3>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">발행 이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-text-strong">{inv.itemName}</div>
                  <div className="text-xs text-text-muted">
                    {inv.buyerBizNo} · {inv.amount.toLocaleString()}원 · {new Date(inv.issueDate).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                <span className={statusBadge(inv.status)}>
                  {inv.status === "PENDING" ? "대기" : inv.status === "ISSUED" ? "발행됨" : "실패"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
