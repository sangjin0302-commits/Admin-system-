import { notFound } from "next/navigation";
import { listApiKeys, revenueSummary, listUsage, API_PRODUCTS } from "@/lib/services/api-marketplace-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export default async function AdminApiMarketplacePage() {
  if (!(await isFeatureEnabled("api_marketplace"))) notFound();
  const keys = await listApiKeys();
  const summary = await revenueSummary();
  const usage = await listUsage(50);

  return (
    <section className="space-y-6">
      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <p className="ui-kicker">API Marketplace</p>
        <h2 className="mt-2 text-xl font-semibold text-text-strong">API 마켓플레이스 관리</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Metric label="총 호출" value={summary.totalCalls.toLocaleString()} />
          <Metric label="예상 매출" value={`₩${summary.estimatedRevenue.toLocaleString()}`} />
          <Metric label="발급된 키" value={`${keys.filter((k) => !k.revokedAt).length}`} />
        </div>
      </div>

      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <h3 className="font-semibold">상품별 실적</h3>
        <table className="mt-3 w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-text-muted">
            <tr>
              <th className="py-2">상품</th>
              <th className="text-right">호출</th>
              <th className="text-right">매출</th>
            </tr>
          </thead>
          <tbody>
            {API_PRODUCTS.map((p) => {
              const s = summary.byProduct[p.id] ?? { calls: 0, revenue: 0 };
              return (
                <tr key={p.id} className="border-b border-line/60">
                  <td className="py-2">{p.name}</td>
                  <td className="text-right">{s.calls.toLocaleString()}</td>
                  <td className="text-right">₩{s.revenue.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <h3 className="font-semibold">발급된 API 키</h3>
        <table className="mt-3 w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-text-muted">
            <tr>
              <th className="py-2">Prefix</th>
              <th>고객</th>
              <th>상품</th>
              <th className="text-right">총 호출</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-b border-line/60 font-mono text-xs">
                <td className="py-2">{k.prefix}…</td>
                <td>{k.userEmail}</td>
                <td>{k.productId}</td>
                <td className="text-right">{k.totalCallCount.toLocaleString()}</td>
                <td>{k.revokedAt ? "폐기" : "활성"}</td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-muted">발급된 키 없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <h3 className="font-semibold">최근 사용 (50건)</h3>
        <ul className="mt-3 max-h-96 overflow-y-auto divide-y divide-line text-xs">
          {usage.map((u) => (
            <li key={u.id} className="flex justify-between py-1.5">
              <span>{new Date(u.at).toLocaleString()}</span>
              <span>{u.productId}</span>
              <span className={u.ok ? "text-green-600" : "text-red-600"}>{u.ok ? "OK" : "FAIL"}</span>
              <span>{u.latencyMs ?? "-"}ms</span>
            </li>
          ))}
          {usage.length === 0 && <li className="py-4 text-center text-text-muted">기록 없음</li>}
        </ul>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}
