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
  title: "행정 업무 분야 안내",
  description: "비자, 법인, 행정심판, 사실조사, 인허가, 아랍어 통번역, 기타 민원 분야를 안내합니다."
};

export default function ServicesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <section className="space-y-4">
        <p className="ui-kicker">업무 분야</p>
        <h1 className="ui-page-title">상담 가능한 행정 업무를 확인하세요.</h1>
        <p className="max-w-3xl text-base leading-7 text-text-muted">
          각 분야 페이지에서 대상 고객, 지원 범위, 준비하면 좋은 자료와 진행 절차를 확인한 뒤
          접수할 수 있습니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="업무 분야 목록">
        {PUBLIC_MARKETING_SERVICES.map((service) => (
          <Card key={service.slug} className="flex h-full flex-col p-5">
            <div className="flex-1">
              <p className="ui-kicker">{service.practiceArea}</p>
              <h2 className="mt-2 text-xl font-semibold text-text-strong">{service.title}</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">{service.summary}</p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/services/${service.slug}`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
              >
                자세히 보기
              </Link>
              <Link
                href={buildServiceIntakeHref(service)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
              >
                접수하기
              </Link>
            </div>
          </Card>
        ))}
      </section>

      <Card muted className="p-5">
        <h2 className="ui-section-title">공식 확인 안내</h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
      </Card>
    </main>
  );
}
