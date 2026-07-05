import Link from "next/link";
import { FRANCHISE_PLANS } from "@/lib/services/franchise-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "ETHOS 가맹 · 우리 사무소에도 도입하기" };

export default async function FranchiseLandingPage() {
  if (!(await isFeatureEnabled("franchise_saas"))) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <p className="ui-kicker">Franchise · SaaS</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-primary sm:text-4xl">
          ETHOS 시스템을 우리 사무소에도.
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          문의 접수부터 사건관리·AI 초안·재무까지 — 검증된 행정사무소 운영 스택을 SaaS로 제공합니다.
        </p>
        <Link
          href="/franchise/apply"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-white"
        >
          가맹 신청하기
        </Link>
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        {(Object.keys(FRANCHISE_PLANS) as (keyof typeof FRANCHISE_PLANS)[]).map((k) => {
          const p = FRANCHISE_PLANS[k];
          return (
            <div key={k} className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
              <p className="text-xs font-bold uppercase text-gold-deep">{p.label}</p>
              <p className="mt-2 font-serif text-2xl font-bold text-primary">
                {p.monthlyFee > 0 ? `₩${p.monthlyFee.toLocaleString()}/월` : "문의"}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <Link
                href={`/franchise/apply?plan=${k}`}
                className="mt-6 inline-block w-full rounded border border-primary py-2 text-center font-bold text-primary"
              >
                {k === "enterprise" ? "문의하기" : "신청하기"}
              </Link>
            </div>
          );
        })}
      </section>

      <section className="mt-16 rounded-xl border border-line bg-surface p-6">
        <h2 className="font-serif text-2xl font-bold text-primary">제공 기능</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            "온라인 문의 접수·자동 분류",
            "사건관리 & 캘린더 동기",
            "AI 초안 (계약서/심판이유서)",
            "Lawbot 판례·법령 어시스턴트",
            "고객 포털 (실시간 알림)",
            "재무 리포트·미수금 관리",
            "브랜딩 커스터마이즈 (컬러·로고)",
            "월 1회 관리자 교육 & Slack 지원",
          ].map((f) => (
            <div key={f} className="rounded-lg border border-line bg-white p-3 text-sm">
              · {f}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
