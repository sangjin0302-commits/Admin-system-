import Link from "next/link";
import { PLANS } from "@/lib/services/ai-subscription-service";

export const metadata = { title: "AI 법률 자문 구독 · ETHOS" };

export default function AISubscriptionPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="ui-kicker text-center">AI Legal Assistant</p>
      <h1 className="mt-2 text-center font-serif text-4xl font-bold text-primary">
        AI 법률 자문 구독
      </h1>
      <p className="mt-3 text-center text-text-muted">
        비자·행정심판·인허가 관련 문의를 AI에게 24시간 즉시 물어보세요.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <PlanCard
          plan={PLANS.free}
          highlight={false}
          bullets={["월 5회 무료 검토", "기본 안내", "이용약관 준수"]}
          cta={{ label: "무료로 시작", href: "/quick-check" }}
        />
        <PlanCard
          plan={PLANS.pro}
          highlight
          bullets={["무제한 상담", "우선 응답", "채팅 기록 저장"]}
          cta={{ label: "구독하기", href: "/api/public/ai-subscription/subscribe" }}
          postCta
        />
      </div>
    </main>
  );
}

function PlanCard({
  plan,
  bullets,
  highlight,
  cta,
  postCta,
}: {
  plan: { tier: string; label: string; priceKrw: number; monthlyQuota: number };
  bullets: string[];
  highlight: boolean;
  cta: { label: string; href: string };
  postCta?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight ? "border-primary bg-gold-soft/20 shadow-panel" : "border-line bg-surface"
      }`}
    >
      <p className="text-sm font-bold uppercase text-gold-deep">{plan.label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-primary">
        ₩{plan.priceKrw.toLocaleString()}
        <span className="text-base font-normal text-text-muted"> /월</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="text-gold-deep">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {postCta ? (
        <form action={cta.href} method="POST" className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 font-bold text-white"
          >
            {cta.label}
          </button>
        </form>
      ) : (
        <Link
          href={cta.href}
          className="mt-6 block rounded-lg border border-primary py-3 text-center font-bold text-primary"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
