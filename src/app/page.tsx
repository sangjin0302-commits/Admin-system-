import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "출입국·체류·행정심판 상담 신청 및 진행상황 조회",
  description:
    "출입국, 체류, 행정심판, 정보공개 등 행정 업무를 접수하고 접수번호로 진행상황을 확인합니다."
};

const practiceAreas = [
  {
    title: "출입국·체류",
    description: "체류기간 연장, 체류자격 변경, 초청, 국내 생활기반 자료를 사안별로 정리합니다.",
    href: "/services/immigration",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-800"
  },
  {
    title: "강제퇴거·출국명령·입국금지",
    description: "처분서, 통지일, 불복 기한, 소명 자료를 확인하고 다음 대응 범위를 검토합니다.",
    href: "/services/appeal",
    accent: "border-red-200 bg-red-50 text-red-700"
  },
  {
    title: "행정심판·이의신청",
    description: "처분 내용, 기한, 사실관계, 증빙자료를 정리해 제출 준비 흐름을 만듭니다.",
    href: "/services/appeal",
    accent: "border-amber-200 bg-amber-50 text-amber-800"
  },
  {
    title: "정보공개·일반 행정서류",
    description: "정보공개청구, 사실관계 정리, 제출기관별 요구자료를 차분히 확인합니다.",
    href: "/services/civil-petition",
    accent: "border-blue-200 bg-blue-50 text-blue-700"
  }
] as const;

const processSteps = [
  ["01", "접수", "상담 신청에서 업무 분야, 연락처, 기본 사실관계를 남깁니다."],
  ["02", "사실관계 확인", "처분서, 통지일, 체류자격, 제출기관 등 핵심 정보를 확인합니다."],
  ["03", "자료요청", "필요 자료와 보완 가능성이 있는 항목을 안내합니다."],
  ["04", "기한/서식 검토", "공식 서식과 제출기관 기준, 기한을 사안별로 확인합니다."],
  ["05", "제출 준비 및 보완 대응", "관리자 검토 후 제출 준비와 보완 대응 범위를 정리합니다."]
] as const;

const trustPrinciples = [
  "공식 서식과 제출기관 기준 확인",
  "관리자 검토 후 진행",
  "민감정보 보호 우선",
  "기관 제출은 자동으로 하지 않음",
  "사안별 상담 필요"
] as const;

const conversionFlow = [
  {
    title: "상담 신청",
    description: "현재 상황, 받은 처분서나 통지서, 희망하는 다음 단계를 짧게 남깁니다."
  },
  {
    title: "자료 확인",
    description: "필요 자료와 절차가 사안마다 다르므로 먼저 사실관계와 자료 범위를 확인합니다."
  },
  {
    title: "기한·제출처 검토",
    description: "제출기관, 불복기한, 보완 가능성, 공식 서식 기준을 차례로 봅니다."
  },
  {
    title: "진행상황 조회",
    description: "접수번호가 있으면 내부 관리 상태와 다음 안내를 조회할 수 있습니다."
  }
] as const;

const readinessNotes = [
  "사안마다 필요한 자료와 절차가 다릅니다.",
  "접수 후 사실관계와 자료를 먼저 확인합니다.",
  "기한과 제출처를 확인합니다.",
  "진행 상황은 내부적으로 관리합니다.",
  "결과를 보장하지 않습니다.",
  "AI가 최종 판단하지 않고 시스템이 기관에 바로 제출하지 않습니다."
] as const;

const homeFaqItems = [
  {
    question: "상담 신청 후 바로 진행되나요?",
    answer: "사실관계와 자료를 확인한 뒤 가능한 범위와 다음 단계를 안내합니다."
  },
  {
    question: "어떤 자료를 준비해야 하나요?",
    answer: "처분서, 통지서, 여권·체류 관련 자료, 기존 제출자료 등은 사안별로 다릅니다."
  },
  {
    question: "진행상황은 어떻게 확인하나요?",
    answer: "접수 후 받은 접수번호로 자료요청, 검토 상태, 다음 안내를 확인할 수 있습니다."
  },
  {
    question: "출입국 업무도 상담 가능한가요?",
    answer: "체류, 자격변경, 초청, 처분 대응 등은 자료 확인 후 상담 가능 범위를 봅니다."
  },
  {
    question: "행정심판이나 이의신청도 상담 가능한가요?",
    answer: "처분 내용과 기한, 제출기관을 확인한 뒤 사안별 검토가 필요합니다."
  },
  {
    question: "결과를 보장하나요?",
    answer: "결과를 보장하지 않습니다. 자료 확인 후 안내하며, AI가 최종 판단하지 않습니다."
  }
] as const;

function PrimaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
    >
      {children}
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
    >
      {children}
    </Link>
  );
}

function StaticBrandEntranceVisual() {
  return (
    <Card className="overflow-hidden p-5">
      <div className="rounded-lg border border-line bg-surface-muted p-4 shadow-panel">
        <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-md border border-line bg-surface p-4 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">사무소 입구</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                접수
              </span>
            </div>
            <div className="mt-5 h-28 rounded-md border border-line-strong bg-[linear-gradient(135deg,#ffffff,#e7f0f7)] p-3 shadow-floating">
              <div className="h-full rounded border border-line bg-white/80 p-3">
                <div className="h-2 w-16 rounded bg-primary/70" />
                <div className="mt-3 space-y-2">
                  <div className="h-2 rounded bg-slate-200" />
                  <div className="h-2 w-2/3 rounded bg-slate-200" />
                  <div className="h-2 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              ["접수번호", "진행상황 조회"],
              ["자료요청", "필요 서류 안내"],
              ["기한관리", "다음 단계 확인"],
              ["서식검토", "공식 기준 확인"]
            ].map(([title, description]) => (
              <div
                key={title}
                className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2 shadow-panel"
              >
                <div>
                  <p className="text-sm font-semibold text-text-strong">{title}</p>
                  <p className="text-xs text-text-muted">{description}</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PublicMarketingHomePage() {
  const intakeHref = buildWebsiteIntakeHref();

  return (
    <main className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
      <section className="grid gap-6 py-3 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div className="space-y-5">
          <p className="ui-kicker">행정사 상담 접수</p>
          <h1 className="text-4xl font-semibold leading-tight text-text-strong sm:text-5xl">
            출입국·체류·행정심판 업무를 한 흐름으로 정리합니다.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-text">
            접수부터 기한관리, 자료요청, 문서 준비까지 놓치기 쉬운 단계를 관리합니다. 접수 후 받은
            접수번호로 진행상황을 확인할 수 있습니다.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryCta href={intakeHref}>상담 신청하기</PrimaryCta>
            <SecondaryCta href="/track">진행상황 조회</SecondaryCta>
            <SecondaryCta href="/services">전문 분야 보기</SecondaryCta>
          </div>
          <p className="text-xs leading-5 text-text-muted">
            사안별 검토가 필요하며, 기관 제출 여부와 제출 방식은 공식 기준 확인 후 안내합니다.
          </p>
        </div>
        <StaticBrandEntranceVisual />
      </section>

      <section className="space-y-4" aria-labelledby="practice-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-kicker">주요 업무 영역</p>
            <h2 id="practice-heading" className="ui-section-title">
              먼저 검토해야 할 업무를 빠르게 찾습니다.
            </h2>
          </div>
          <Link href="/services" className="text-sm font-semibold text-primary hover:underline">
            전문 분야 보기
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {practiceAreas.map((area) => (
            <Card key={area.title} className="flex h-full flex-col p-5">
              <div className="flex-1">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${area.accent}`}>
                  사안별 검토 필요
                </span>
                <h3 className="mt-4 text-xl font-semibold text-text-strong">{area.title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-muted">{area.description}</p>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <PrimaryCta href={intakeHref}>상담 신청하기</PrimaryCta>
                <SecondaryCta href={area.href}>자세히 보기</SecondaryCta>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="process-heading">
        <div>
          <p className="ui-kicker">업무 처리 흐름</p>
          <h2 id="process-heading" className="ui-section-title">
            고객이 준비할 일과 사무소가 확인할 일을 나눕니다.
          </h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          {processSteps.map(([step, title, description]) => (
            <Card key={step} muted className="p-4">
              <p className="text-xs font-semibold text-primary">{step}</p>
              <h3 className="mt-2 text-base font-semibold text-text-strong">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
            </Card>
          ))}
        </div>
        <p className="text-sm text-text-muted">외부 기관 제출은 관리자 검토와 사안별 확인 후 별도 안내합니다.</p>
      </section>

      <section className="space-y-4" aria-labelledby="conversion-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-kicker">상담 이후 흐름</p>
            <h2 id="conversion-heading" className="ui-section-title">
              상담 신청 후 무엇을 확인하는지 먼저 보여드립니다.
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <PrimaryCta href={intakeHref}>상담 신청하기</PrimaryCta>
            <SecondaryCta href="/track">진행상황 조회</SecondaryCta>
            <SecondaryCta href="/services">전문 분야 보기</SecondaryCta>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {conversionFlow.map((item) => (
            <Card key={item.title} className="p-5">
              <h3 className="text-lg font-semibold text-text-strong">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-text-muted">{item.description}</p>
            </Card>
          ))}
        </div>
        <Card muted className="p-5">
          <h3 className="text-base font-semibold text-text-strong">내부적으로 추적하는 항목</h3>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            출입국, 행정심판, 자료요청, 기한관리 중심의 업무 흐름을 내부적으로 정리합니다. 이는 진행 관리
            목적이며 결과를 약속하는 의미가 아닙니다.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Card className="p-6">
          <p className="ui-kicker">진행상황 조회</p>
          <h2 className="mt-2 ui-section-title">접수번호로 다음 단계를 확인합니다.</h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            접수 후 받은 접수번호로 진행상황을 확인할 수 있습니다. 자료요청, 검토 중 상태, 다음 안내를
            한곳에서 확인하도록 구성했습니다.
          </p>
          <div className="mt-5">
            <PrimaryCta href="/track">접수번호로 조회하기</PrimaryCta>
          </div>
        </Card>

        <Card muted className="p-6">
          <p className="ui-kicker">신뢰와 안전 원칙</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {trustPrinciples.map((principle) => (
              <div key={principle} className="rounded-md border border-line bg-surface px-3 py-3 text-sm text-text">
                {principle}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="readiness-heading">
        <div>
          <p className="ui-kicker">신뢰와 준비 기준</p>
          <h2 id="readiness-heading" className="ui-section-title">
            먼저 확인하고, 보장처럼 말하지 않습니다.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {readinessNotes.map((note) => (
            <div key={note} className="rounded-md border border-line bg-surface px-4 py-3 text-sm leading-6 text-text">
              {note}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="home-faq-heading">
        <div>
          <p className="ui-kicker">자주 묻는 질문</p>
          <h2 id="home-faq-heading" className="ui-section-title">
            접수 전에 많이 묻는 내용을 정리했습니다.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {homeFaqItems.map((item) => (
            <Card key={item.question} className="p-5">
              <h3 className="text-base font-semibold text-text-strong">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-text-muted">{item.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-6 shadow-panel">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="ui-kicker">상담 시작</p>
            <h2 className="mt-2 ui-section-title">지금 필요한 업무를 접수하고 다음 단계를 확인하세요.</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              상담 신청, 진행상황 조회, 전문 분야 확인을 한 화면에서 시작할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <PrimaryCta href={intakeHref}>상담 신청하기</PrimaryCta>
            <SecondaryCta href="/track">진행상황 조회</SecondaryCta>
            <SecondaryCta href="/services">전문 분야 보기</SecondaryCta>
          </div>
        </div>
      </section>
    </main>
  );
}
