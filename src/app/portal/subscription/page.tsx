import { SubscriptionClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "구독 관리 · ETHOS 포털" };

export default function PortalSubscriptionPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <p className="ui-kicker">Portal</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary">AI 구독 관리</h1>
      <p className="mt-2 text-sm text-text-muted">
        현재 요금제와 이번 달 사용량을 확인하고 업그레이드/취소할 수 있습니다.
      </p>
      <div className="mt-8">
        <SubscriptionClient />
      </div>
    </section>
  );
}
