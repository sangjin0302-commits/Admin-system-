import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import {
  buildServiceIntakeHref,
  getPublicMarketingService,
  localizeMarketingService,
  PUBLIC_MARKETING_SERVICES
} from "@/lib/services/public-marketing-pages";
import { getRequestLocale } from "@/lib/i18n-request";
import { localePath } from "@/lib/i18n-locale";

// 중복 정리: 아래 CMS 슬러그는 nav 연결된 legacy 상세 페이지와 내용이 겹친다
// (예: visa ≈ /services/immigration). SEO 중복을 없애려고 canonical(legacy)로 리다이렉트.
// legacy 등가물이 없는 arabic-interpretation·civil-petition 만 이 동적 라우트가 직접 렌더.
const LEGACY_REDIRECT: Record<string, string> = {
  visa: "immigration",
  corporation: "corporate",
  "administrative-appeal": "appeal",
  "fact-contract": "contract",
  "permit-license": "license"
};

type ServiceDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ lang?: string }>;
};

export function generateStaticParams() {
  // 리다이렉트되는 슬러그는 정적 생성 제외 — 고유 서비스만 직접 렌더.
  return PUBLIC_MARKETING_SERVICES.filter((s) => !LEGACY_REDIRECT[s.slug]).map((service) => ({
    slug: service.slug
  }));
}

export async function generateMetadata({ params, searchParams }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const en = (await getRequestLocale((await searchParams)?.lang)) === "en";
  const service = getPublicMarketingService(slug);

  if (!service) {
    return {
      title: en ? "Practice Area" : "업무 분야 안내"
    };
  }

  return {
    title: en ? `${service.titleEn} | ETHOS` : `${service.title} 안내`,
    description: en ? service.summaryEn : service.summary,
    alternates: {
      canonical: en ? localePath(`/services/${slug}`, "en") : `/services/${slug}`,
      languages: {
        ko: `/services/${slug}`,
        en: localePath(`/services/${slug}`, "en"),
        "x-default": `/services/${slug}`
      }
    }
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

export default async function ServiceDetailPage({ params, searchParams }: ServiceDetailPageProps) {
  const { slug } = await params;
  // 동적 [slug] 경로라 레거시 301 은 스킵(리다이렉트 리스크). getRequestLocale 폴백만 사용.
  const lang = await getRequestLocale((await searchParams)?.lang);
  // 겹치는 슬러그는 next.config redirects()가 legacy 로 308 리다이렉트하므로 여기 도달 안 함.
  const t = (ko: string, en: string) => (lang === "en" ? en : ko);
  const service = getPublicMarketingService(slug);

  if (!service) {
    notFound();
  }

  const c = localizeMarketingService(service, lang);
  const intakeHref = buildServiceIntakeHref(service);

  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div className="space-y-4">
          <p className="ui-kicker">{t("업무 분야 안내", "Practice Area")}</p>
          <h1 className="ui-page-title">{c.title}</h1>
          <p className="max-w-3xl text-base leading-7 text-text-muted">{c.summary}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={intakeHref}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
            >
              {t("접수하기", "Request")}
            </Link>
            <Link
              href="/track"
              className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              {t("진행상황 조회", "Track status")}
            </Link>
          </div>
        </div>
        <Card muted className="p-5">
          <h2 className="ui-section-title">{t("유의사항", "Please note")}</h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">{c.safeNotice}</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
            {c.cautions.map((caution) => (
              <li key={caution}>- {caution}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoList title={t("이런 분에게 필요합니다", "Who it's for")} items={c.audience} />
        <InfoList title={t("지원 범위", "Scope")} items={c.scope} />
        <InfoList title={t("준비하면 좋은 자료", "Documents to prepare")} items={c.preparation} />
        <InfoList title={t("진행 절차", "Process")} items={c.process} />
      </section>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="ui-section-title">{t("상담 접수", "Submit a request")}</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              {t(
                "접수 시 유입 경로가 함께 기록되어 상담 흐름을 더 정확히 확인할 수 있습니다.",
                "Your referral path is recorded on intake so we can track the consultation flow more accurately."
              )}
            </p>
          </div>
          <Link
            href={intakeHref}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
          >
            {t("접수하기", "Request")}
          </Link>
        </div>
      </Card>
    </main>
  );
}
