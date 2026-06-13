import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";

export type ServicePageData = {
  kicker: string;
  title: string;
  tagline: string;
  description: string;
  icon: ReactNode;
  whoFor: readonly string[];
  process: readonly { step: string; title: string; desc: string }[];
  documents: readonly string[];
  deadlines: readonly { label: string; value: string }[];
  faq: readonly { q: string; a: string }[];
};

export function ServicePage({ data }: { data: ServicePageData }) {
  const intakeHref = buildWebsiteIntakeHref();

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6 sm:py-20">
      {/* HERO */}
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">{data.kicker}</p>
        <div className="mt-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/50 bg-gold-soft/30 text-primary">
            {data.icon}
          </div>
        </div>
        <h1 className="mt-6 font-serif text-4xl font-bold text-primary sm:text-5xl">
          {data.title}
        </h1>
        <p className="mt-3 font-serif text-base italic text-gold-deep">{data.tagline}</p>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text">{data.description}</p>
      </section>

      {/* 대상 */}
      <section>
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">For Whom</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-primary">이런 분께 권합니다</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {data.whoFor.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-gold/30 bg-surface px-4 py-3">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-gold" />
              <span className="text-sm text-text">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 진행 절차 */}
      <section>
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Process</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-primary">진행 절차</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.process.map((p, idx) => (
            <Card key={idx} className="p-5">
              <div className="font-serif text-sm font-bold italic text-gold-deep">{p.step}</div>
              <h3 className="mt-2 font-serif text-base font-bold text-primary">{p.title}</h3>
              <p className="mt-2 text-xs leading-6 text-text-muted">{p.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 자료 + 기한 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Documents</p>
          <h3 className="mt-2 font-serif text-xl font-bold text-primary">필요 자료</h3>
          <ul className="mt-4 space-y-2">
            {data.documents.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-text">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-text-muted">※ 사안별로 추가/축소될 수 있습니다.</p>
        </Card>

        <Card className="p-7">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Deadlines</p>
          <h3 className="mt-2 font-serif text-xl font-bold text-primary">주요 기한</h3>
          <div className="mt-4 space-y-3">
            {data.deadlines.map((d) => (
              <div key={d.label} className="border-l-2 border-gold/50 pl-4">
                <p className="font-serif text-xs text-text-muted">{d.label}</p>
                <p className="mt-1 font-bold text-text-strong">{d.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-text-muted">※ 개별 사안에 따라 다를 수 있습니다.</p>
        </Card>
      </section>

      {/* FAQ */}
      <section>
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">FAQ</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-primary">자주 묻는 질문</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {data.faq.map((f) => (
            <Card key={f.q} className="p-5">
              <h3 className="font-serif text-base font-bold text-primary">Q. {f.q}</h3>
              <p className="mt-2 text-sm leading-7 text-text-muted">{f.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-center text-xs italic text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>

      {/* CTA */}
      <section className="rounded-2xl bg-primary p-10 text-center text-white sm:p-14">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-soft">Start Here</p>
        <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
          상담을 시작하시겠습니까?
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={intakeHref}
            className="inline-flex h-12 items-center rounded-lg bg-gold px-6 font-bold text-primary transition hover:bg-gold-soft"
          >
            상담 신청
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 items-center rounded-lg border-2 border-gold/50 px-6 font-semibold text-gold-soft transition hover:bg-gold/10"
          >
            다른 분야 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
