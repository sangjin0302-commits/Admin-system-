import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "업무 분야 — ETHOS 행정사사무소",
  description: "비자/체류, 행정심판, 계약서/사실조사, 인허가 — 네 가지 주력 분야를 안내합니다."
};

type Area = {
  href: string;
  title: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
};

const AREAS: readonly Area[] = [
  {
    href: "/services/immigration",
    title: "비자 / 외국인 체류",
    subtitle: "VISA & IMMIGRATION",
    description: "체류 자격 변경·연장, 사업/투자 비자, 강제퇴거 대응까지.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  },
  {
    href: "/services/appeal",
    title: "행정심판",
    subtitle: "ADMINISTRATIVE APPEAL",
    description: "처분 통지부터 청구·심리·재결까지 함께 준비합니다.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 3v18M6 8h12M5 13l7-3 7 3M5 13v3a7 7 0 0 0 14 0v-3" />
      </svg>
    )
  },
  {
    href: "/services/contract",
    title: "계약서 / 사실조사",
    subtitle: "CONTRACT & INVESTIGATION",
    description: "계약 검토·작성, 분쟁 사실관계 조사, 조사보고서 작성.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.4">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </svg>
    )
  },
  {
    href: "/services/license",
    title: "인허가",
    subtitle: "LICENSE & PERMIT",
    description: "사업·건축·식품·의료 등 허가 신청, 보완·불복 대응.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.4">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" />
      </svg>
    )
  }
];

export default function ServicesIndex() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-16 sm:px-6 sm:py-20">
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Practice Areas</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">업무 분야</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
          네 가지 주력 분야 — 각 분야별 전문 워크플로우로 사안을 체계적으로 정리합니다.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {AREAS.map((a) => (
          <Link key={a.href} href={a.href} className="group">
            <Card className="flex h-full flex-col p-7 transition group-hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-gold/40 bg-gold-soft/30 text-primary">
                  {a.icon}
                </div>
                <div>
                  <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    {a.subtitle}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-primary group-hover:text-gold-deep">
                    {a.title}
                  </h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-text">{a.description}</p>
              <div className="mt-6 border-t border-gold/20 pt-4 font-serif text-sm font-semibold text-primary group-hover:text-gold-deep">
                자세히 보기 →
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
