import {
  listHandoffs,
  listPeers,
  listShares,
} from "@/lib/services/admin-network-service";
import { AdminNetworkClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminNetworkPage() {
  const [peers, shares, handoffs] = await Promise.all([
    listPeers(), listShares(), listHandoffs(),
  ]);
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Collaboration</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">행정사 협업 네트워크</h2>
      <p className="mt-2 text-sm text-text-muted">
        동료 행정사와 사건을 공유하거나 재배정합니다.
      </p>
      <div className="mt-6">
        <AdminNetworkClient
          initialPeers={peers}
          initialShares={shares}
          initialHandoffs={handoffs}
        />
      </div>
    </section>
  );
}
