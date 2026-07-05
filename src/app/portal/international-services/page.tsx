import { InternationalClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "국제 배송 · 공증 · ETHOS 포털" };

export default function PortalInternationalPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <p className="ui-kicker">Portal</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary">국제 배송 · 공증 요청</h1>
      <p className="mt-2 text-sm text-text-muted">
        해외 배송(DHL/FedEx) 및 공증 파트너 요청을 이곳에서 신청·조회합니다.
      </p>
      <div className="mt-8">
        <InternationalClient />
      </div>
    </section>
  );
}
