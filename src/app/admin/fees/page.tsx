import { listFeeItems } from "@/lib/services/fee-items";

import { FeesManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function AdminFeesPage() {
  const items = await listFeeItems();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">운영 — 내부 자료</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">비용표 관리</h2>
      <p className="mt-2 text-sm text-text-muted">
        내부 견적·상담 기준용 비용표입니다. <strong>공개 홈페이지에는 노출되지 않습니다.</strong> 상담 시 참고하거나 견적 안내에 활용하세요.
      </p>

      <div className="mt-6">
        <FeesManager
          initialItems={items.map((i) => ({
            id: i.id,
            category: i.category,
            service: i.service,
            amount: i.amount,
            note: i.note
          }))}
        />
      </div>
    </section>
  );
}
