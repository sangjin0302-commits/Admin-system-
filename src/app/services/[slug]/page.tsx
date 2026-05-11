import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import {
  buildServiceIntakeHref,
  getPublicMarketingService,
  PUBLIC_MARKETING_SAFE_NOTICE,
  PUBLIC_MARKETING_SERVICES
} from "@/lib/services/public-marketing-pages";

export const dynamic = "force-dynamic";

type ServiceDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return PUBLIC_MARKETING_SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getPublicMarketingService(slug);

  if (!service) {
    return {
      title: "업무 분야 안내"
    };
  }

  return {
    title: `${service.title} 안내`,
    description: service.summary
  };
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="h-full p-5">
      <h2 className="text-lg font-semibold text-text-strong">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = getPublicMarketingService(slug);

  if (!service) {
    notFound();
  }

  const intakeHref = buildServiceIntakeHref(service);

  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div className="space-y-4">
          <p className="ui-kicker">업무 분야 안내</p>
          <h1 className="ui-page-title">{service.title}</h1>
          <p className="max-w-3xl text-base leading-7 text-text-muted">{service.summary}</p>
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
          <h2 className="ui-section-title">유의사항</h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
            {service.cautions.map((caution) => (
              <li key={caution}>- {caution}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoList title="이런 분에게 필요합니다" items={service.audience} />
        <InfoList title="지원 범위" items={service.scope} />
        <InfoList title="준비하면 좋은 자료" items={service.preparation} />
        <InfoList title="진행 절차" items={service.process} />
      </section>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="ui-section-title">상담 접수</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              접수 시 유입 경로가 함께 기록되어 상담 흐름을 더 정확히 확인할 수 있습니다.
            </p>
          </div>
          <Link
            href={intakeHref}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
          >
            접수하기
          </Link>
        </div>
      </Card>
    </main>
  );
}
