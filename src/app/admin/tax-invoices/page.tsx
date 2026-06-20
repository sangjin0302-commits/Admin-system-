import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { listRecentInvoices } from "@/lib/services/tax-invoice-service";
import { IssueForm } from "./issue-form";

export const dynamic = "force-dynamic";

export default async function TaxInvoicesPage() {
  const invoices = await listRecentInvoices(50);

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        kicker="세무"
        title="세금계산서"
        description="홈택스/위택스 전자세금계산서 발행 및 조회"
      />
      <Card className="p-6">
        <h3 className="text-sm font-bold text-text-strong">신규 발행</h3>
        <div className="mt-3">
          <IssueForm />
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-bold text-text-strong">최근 발행 내역</h3>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">발행된 세금계산서가 없습니다.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-text-muted">
                <th className="py-2">송장 ID</th>
                <th>상태</th>
                <th>발행일시</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.invoiceId} className="border-b border-line">
                  <td className="py-2 font-mono text-xs">{inv.invoiceId}</td>
                  <td>{inv.status}</td>
                  <td>{new Date(inv.issuedAt).toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
