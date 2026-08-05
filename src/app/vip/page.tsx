import Link from "next/link";
import { getVipPlans } from "@/lib/services/vip-membership-service";

export const revalidate = 3600; // ISR — 정적 콘텐츠, 함수호출 절감(설정 저장 시 자연 만료)
export const metadata = { title: "VIP 회원제 · ETHOS" };

const TESTIMONIALS = [
  { name: "이OO 대표 (수입업)", body: "관세·비자·계약을 한 곳에서 우선 응대 받는 게 실무에서 큰 차이를 만듭니다." },
  { name: "김OO 원장 (병원)", body: "야간·주말 문의에도 24시간 내 회신 — 진료 사이에 답을 기다리지 않아도 됩니다." },
  { name: "박OO 이사 (스타트업)", body: "전담 매니저가 붙으니 반복 설명이 사라졌습니다. 시간 절약이 곧 매출입니다." },
];

export default async function VipLandingPage() {
  const plans = await getVipPlans();
  const order: Array<"silver" | "gold" | "platinum"> = ["silver", "gold", "platinum"];

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <header className="text-center">
        <p className="ui-kicker">Premium Membership</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-primary sm:text-5xl">
          VIP 회원제
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-text-muted">
          우선 처리·전담 응대·자동 할인 — 반복되는 행정 이슈를 매달 정액으로 위임하세요.
        </p>
      </header>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        {order.map((k) => {
          const p = plans[k];
          const featured = k === "gold";
          return (
            <div
              key={p.plan}
              className={`rounded-2xl border p-8 ${
                featured
                  ? "border-primary bg-gradient-to-b from-gold-soft/20 to-transparent shadow-lg"
                  : "border-line bg-surface"
              }`}
            >
              {featured && (
                <p className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                  가장 인기
                </p>
              )}
              <h2 className="font-serif text-2xl font-bold text-primary">{p.label}</h2>
              <p className="mt-2 text-3xl font-bold text-primary">
                ₩{p.priceKrw.toLocaleString()}
                <span className="text-sm font-normal text-text-muted"> /월</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.benefits.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
                <li className="flex gap-2 text-text-muted">
                  <span className="text-primary">✓</span>
                  <span>견적 {p.discountPct}% 자동 할인</span>
                </li>
                <li className="flex gap-2 text-text-muted">
                  <span className="text-primary">✓</span>
                  <span>{p.slaHours}시간 내 응대 보장</span>
                </li>
              </ul>
              <Link
                href={`/portal/vip?plan=${p.plan}`}
                className={`mt-8 block rounded-lg px-4 py-3 text-center text-sm font-bold ${
                  featured
                    ? "bg-primary text-white hover:opacity-90"
                    : "border border-primary text-primary hover:bg-primary hover:text-white"
                }`}
              >
                VIP 신청
              </Link>
            </div>
          );
        })}
      </section>

      <section className="mt-20">
        <h2 className="text-center font-serif text-2xl font-bold text-primary">혜택 비교</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="p-3 text-left"></th>
                <th className="p-3 text-center">Silver</th>
                <th className="p-3 text-center">Gold</th>
                <th className="p-3 text-center">Platinum</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/50"><td className="p-3">우선 처리 할인</td><td className="p-3 text-center">20%</td><td className="p-3 text-center">25%</td><td className="p-3 text-center">30%</td></tr>
              <tr className="border-b border-line/50"><td className="p-3">응대 SLA</td><td className="p-3 text-center">48시간</td><td className="p-3 text-center">24시간</td><td className="p-3 text-center">12시간</td></tr>
              <tr className="border-b border-line/50"><td className="p-3">전담 매니저</td><td className="p-3 text-center">-</td><td className="p-3 text-center">✓</td><td className="p-3 text-center">✓</td></tr>
              <tr className="border-b border-line/50"><td className="p-3">무제한 상담</td><td className="p-3 text-center">-</td><td className="p-3 text-center">-</td><td className="p-3 text-center">✓</td></tr>
              <tr className="border-b border-line/50"><td className="p-3">세미나 우선 초청</td><td className="p-3 text-center">-</td><td className="p-3 text-center">-</td><td className="p-3 text-center">✓</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-center font-serif text-2xl font-bold text-primary">고객 후기</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote key={t.name} className="rounded-xl border border-line bg-surface p-6 text-sm">
              <p className="text-text-muted">"{t.body}"</p>
              <footer className="mt-4 font-bold text-primary">— {t.name}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    </main>
  );
}
