import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { EthosLogo } from "@/components/brand/ethos-logo";

export const metadata: Metadata = {
  title: "사무소 소개 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 철학, 대표 행정사 소개, 운영 원칙을 안내합니다."
};

const TIMELINE = [
  { year: "2020", label: "행정사 자격 취득" },
  { year: "2022", label: "출입국·체류 전문 분야 경험 축적" },
  { year: "2024", label: "행정심판·인허가 업무 확장" },
  { year: "2026", label: "에토스 행정사사무소 개업" }
] as const;

const VALUES = [
  {
    title: "Logos · 이성으로 절차를",
    description: "감정만이 아닌 정확한 법령과 논리적 판단으로 행정 문제를 풀어갑니다."
  },
  {
    title: "Pathos · 공감으로 사람을",
    description: "행정 문제 뒤에 있는 사람의 사정과 마음을 함께 헤아립니다."
  },
  {
    title: "Ethos · 신뢰로 일을",
    description: "막막한 절차 속에서도 의뢰인이 믿고 따라갈 수 있는 기준과 길을 제시합니다."
  }
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6 sm:py-20">
      {/* HERO */}
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">About ETHOS</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">
          사무소 소개
        </h1>
        <div className="mt-6 flex justify-center">
          <EthosLogo size={140} />
        </div>
      </section>

      {/* 인사말 */}
      <section className="rounded-2xl border border-gold/30 bg-surface-muted/40 px-6 py-10 sm:px-12 sm:py-14">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Greeting</p>
        <h2 className="mt-3 font-serif text-2xl font-bold leading-snug text-primary sm:text-3xl">
          행정 문제 뒤에 있는<br />사람의 마음까지 살피겠습니다.
        </h2>
        <div className="mt-6 space-y-4 text-base leading-8 text-text">
          <p>
            행정 문제는 단순히 서류를 작성하고 절차를 밟는 일만은 아닙니다.
            그 안에는 누군가의 생계, 체류, 권리, 억울함, 가족, 사업, 그리고
            앞으로의 삶이 함께 담겨 있습니다.
          </p>
          <p>
            AI가 많은 정보를 빠르게 정리하고, 이성적인 판단의 영역인{" "}
            <span className="font-serif italic text-gold-deep">로고스(Logos)</span>를
            보조하는 시대가 되었습니다. 그러나 행정 문제 앞에 선 사람에게 필요한 것은
            정보만이 아닙니다. 자신의 사정을 이해받고 있다는 안도감, 막막한 절차 속에서도
            함께 걸어주는 사람이 있다는 신뢰가 필요합니다.
          </p>
          <p>
            <span className="font-serif font-bold text-primary">에토스 행정사사무소</span>는
            아리스토텔레스가 말한 설득의 세 요소,{" "}
            <span className="font-serif italic text-gold-deep">로고스 · 파토스 · 에토스</span>를
            바탕으로 의뢰인의 상황을 세심하게 듣고 가장 현실적인 방향을 함께 찾아갑니다.
          </p>
          <p className="border-l-2 border-gold pl-4 font-serif text-lg italic text-primary">
            절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.
          </p>
        </div>
      </section>

      {/* 가치 */}
      <section>
        <div className="text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Our Values</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-primary sm:text-4xl">
            세 가지 가치
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.title} className="p-7">
              <div className="h-1 w-12 bg-gold" />
              <h3 className="mt-5 font-serif text-xl font-bold text-primary">{v.title}</h3>
              <p className="mt-3 text-sm leading-7 text-text-muted">{v.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 대표 행정사 */}
      <section className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl border-4 border-gold/40 bg-gradient-to-br from-primary/20 to-gold/20">
            {/* 사진 placeholder */}
            <div className="flex h-full items-center justify-center font-serif text-9xl font-bold text-primary/30">
              ETHOS
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 rounded-xl bg-primary px-5 py-3 text-white shadow-floating">
            <p className="font-serif text-xs tracking-wider text-gold-soft">Lead</p>
            <p className="mt-1 font-serif text-lg font-bold">대표 행정사</p>
          </div>
        </div>

        <div>
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Lead Attorney</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-primary">
            대표 행정사
          </h2>
          <p className="mt-2 font-serif text-base italic text-text-muted">
            행정사 면허번호: [등록 후 표시]
          </p>

          <div className="mt-6 space-y-4 text-sm leading-7 text-text">
            <p>
              비자·외국인 체류, 행정심판, 계약서·사실조사, 인허가 등 다양한
              행정 업무 분야에서 경험을 쌓아왔습니다. 의뢰인의 사정에 귀 기울이고,
              공식 기준과 절차를 정확히 확인하며, 끝까지 책임 있게 함께하는 것을
              원칙으로 합니다.
            </p>
            <p>
              사무소를 시작하며 가장 중요하게 생각하는 것은 의뢰인이{" "}
              <span className="font-bold text-primary">자신의 상황을 이해받고 있다는 안도감</span>을
              느끼는 것입니다.
            </p>
          </div>

          <div className="mt-8 space-y-3 border-l-2 border-gold/50 pl-5">
            {TIMELINE.map((t) => (
              <div key={t.year} className="flex items-baseline gap-4">
                <span className="font-serif text-lg font-bold text-gold-deep">{t.year}</span>
                <span className="text-sm text-text">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-primary p-10 text-center text-white shadow-floating sm:p-14">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-soft">Start with ETHOS</p>
        <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
          상담을 시작하시겠습니까?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/80">
          사안에 맞는 가장 현실적인 방향을 함께 고민하겠습니다.
          접수 후 사실관계와 자료를 차근차근 확인합니다.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/intake"
            className="inline-flex h-12 items-center rounded-lg bg-gold px-6 font-bold text-primary transition hover:bg-gold-soft"
          >
            상담 신청하기
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 items-center rounded-lg border-2 border-gold/50 px-6 font-semibold text-gold-soft transition hover:bg-gold/10"
          >
            업무 분야 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
