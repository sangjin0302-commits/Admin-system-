import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import {
  buildServiceIntakeHref,
  PUBLIC_MARKETING_SAFE_NOTICE,
  PUBLIC_MARKETING_SERVICES
} from "@/lib/services/public-marketing-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "행정사 상담 접수 및 진행상황 조회",
  description:
    "비자, 법인, 행정심판, 인허가, 아랍어 통번역 등 행정 업무 상담을 접수하고 진행상황을 확인합니다."
};

const primaryService = PUBLIC_MARKETING_SERVICES[0];

export default function PublicMarketingHomePage() {
  const intakeHref = primaryService ? buildServiceIntakeHref(primaryService) : "/intake";

  return (
    <main className="mx-auto max-w-6xl space-y-10">
      <section className="grid gap-8 py-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-5">
          <p className="ui-kicker">행정 상담 안내</p>
          <h1 className="ui-page-title">행정 절차를 차분하게 정리하고 접수합니다.</h1>
          <p className="max-w-2xl text-base leading-7 text-text">
            비자, 법인, 행정심판, 인허가, 아랍어 통번역 등 행정 업무의 접수 전
            정보를 정리하고, 접수 후에는 고객용 접수번호로 진행상황을 확인할 수 있습니다.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={intakeHref}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
            >
              접수하기
            </Link>
            <Link
              href="/track"
              className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              진행상황 조회
            </Link>
          </div>
        </div>
        <Card muted className="p-5">
          <h2 className="ui-section-title">공식 확인 및 유의사항</h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            기관별 요건과 처리 기준은 달라질 수 있으므로, 접수 후 사안별 자료 확인이 필요합니다.
          </p>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="services-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-kicker">주요 업무 분야</p>
            <h2 id="services-heading" className="ui-section-title">
              필요한 업무를 선택해 상담 접수를 시작하세요.
            </h2>
          </div>
          <Link href="/services" className="text-sm font-semibold text-primary hover:underline">
            전체 업무 보기
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PUBLIC_MARKETING_SERVICES.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} className="block">
              <Card className="h-full p-5 transition hover:border-primary">
                <h3 className="text-lg font-semibold text-text-strong">{service.shortTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-text-muted">{service.summary}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["접수", "업무 분야와 기본 정보를 정리해 접수합니다."],
          ["검토", "사안별 준비 자료와 확인할 사항을 정리합니다."],
          ["조회", "접수번호와 휴대폰 뒤 4자리로 진행상황을 확인합니다."]
        ].map(([title, description]) => (
          <Card key={title} muted className="p-5">
            <h3 className="text-base font-semibold text-text-strong">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
