import { VipPortalClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "VIP 회원 관리 · ETHOS 포털" };

export default function PortalVipPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className="ui-kicker">Portal</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary">VIP 회원 관리</h1>
      <p className="mt-2 text-sm text-text-muted">
        현재 요금제·이번 달 사용 혜택을 확인하고 업그레이드/취소할 수 있습니다.
      </p>
      <div className="mt-8">
        <VipPortalClient />
      </div>
    </section>
  );
}
