import { listPending, listSubscribers } from "@/lib/services/newsletter-service";

import { NewsletterAdminPanel } from "./panel";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const [subscribers, pending] = await Promise.all([listSubscribers(), listPending()]);
  const sortedSubs = [...subscribers].sort(
    (a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
  );
  const recent7d = sortedSubs.filter(
    (s) => Date.now() - new Date(s.subscribedAt).getTime() < 7 * 24 * 60 * 60 * 1000
  );

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">이메일 마케팅</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">뉴스레터 구독자</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="확인 구독자" value={sortedSubs.length} />
        <Stat label="지난 7일 신규" value={recent7d.length} />
        <Stat label="확인 대기 (pending)" value={pending.length} />
      </div>

      <div className="mt-6">
        <NewsletterAdminPanel
          subscribers={sortedSubs.map((s) => ({
            email: s.email,
            subscribedAt: s.subscribedAt,
            categories: s.categories,
          }))}
        />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/70 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-text-strong">{value.toLocaleString()}</div>
    </div>
  );
}
