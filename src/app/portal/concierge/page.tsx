import { ConciergeClient } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "VIP 컨시어지 · ETHOS 포털" };

export default function ConciergePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className="ui-kicker">VIP Portal</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-primary">VIP 컨시어지</h1>
      <p className="mt-2 text-sm text-text-muted">
        VIP 회원 전용 24/7 AI 컨시어지. 사건 상태·마감·일정 문의를 즉시 응답합니다.
      </p>
      <div className="mt-8">
        <ConciergeClient />
      </div>
    </section>
  );
}
