import { notFound } from "next/navigation";
import { listDatasets, listOrders } from "@/lib/services/dataset-marketplace-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { NewDatasetWizard } from "./new-dataset-wizard";

export const dynamic = "force-dynamic";

export default async function AdminDatasetsPage() {
  if (!(await isFeatureEnabled("dataset_marketplace"))) notFound();
  const datasets = await listDatasets(true);
  const orders = await listOrders();

  return (
    <section className="space-y-6">
      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="ui-kicker">Datasets</p>
            <h2 className="mt-2 text-xl font-semibold text-text-strong">데이터셋 큐레이션</h2>
          </div>
        </div>
        <div className="mt-6">
          <NewDatasetWizard />
        </div>
      </div>

      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <h3 className="font-semibold">발행된 데이터셋 ({datasets.length})</h3>
        <ul className="mt-3 divide-y divide-line rounded border border-line">
          {datasets.map((d) => (
            <li key={d.id} className="px-3 py-3">
              <p className="font-semibold">
                {d.name} {!d.published && <span className="text-xs text-red-500">(비공개)</span>}
              </p>
              <p className="text-xs text-text-muted">
                {d.category} · {d.size}건 · ₩{d.price.toLocaleString()} · {d.license}
              </p>
            </li>
          ))}
          {datasets.length === 0 && <li className="px-3 py-4 text-center text-text-muted">등록된 데이터셋 없음</li>}
        </ul>
      </div>

      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <h3 className="font-semibold">주문 ({orders.length})</h3>
        <table className="mt-3 w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-text-muted">
            <tr>
              <th className="py-2">주문번호</th>
              <th>구매자</th>
              <th>데이터셋</th>
              <th className="text-right">금액</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line/60">
                <td className="py-2 font-mono text-xs">{o.orderId}</td>
                <td>{o.buyerEmail}</td>
                <td>{o.datasetId}</td>
                <td className="text-right">₩{o.amount.toLocaleString()}</td>
                <td>{o.status}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-muted">주문 없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
