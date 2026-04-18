export { default } from "./page-admin-redirect";
/*

import Link from "next/link";
import { redirect } from "next/navigation";

import { getIntakeCopy } from "@/components/intake/copy-clean";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "ko";
  const copy = getIntakeCopy(locale);
  redirect("/admin");

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <p className="ui-kicker">{copy.pageKicker}</p>
          <h2 className="mt-3 ui-page-title">{copy.pageTitle}</h2>
          <p className="mt-3 max-w-3xl text-base text-text">{copy.pageDescription}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/intake"
              className="inline-flex h-11 items-center rounded-md border border-primary bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
            >
              {locale === "ko" ? "상담 접수 시작" : "Start Intake"}
            </Link>
            <Link
              href={locale === "ko" ? "/?lang=en" : "/"}
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              {locale === "ko" ? "English" : "한국어"}
            </Link>
            <Link
              href="/admin/inquiries"
              className="inline-flex h-11 items-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              {copy.adminLink}
            </Link>
          </div>
        </Card>

        <Card muted className="p-6">
          <h3 className="ui-section-title">{copy.infoTitle}</h3>
          <div className="mt-4 space-y-3">
            {copy.infoItems.map((item) => (
              <div key={item} className="rounded-md border border-line bg-surface px-4 py-3">
                <p className="text-sm text-text">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card muted className="p-6">
          <h3 className="ui-section-title">{copy.processTitle}</h3>
          <div className="mt-4 space-y-3">
            {copy.processSteps.map((item, index) => (
              <div key={item} className="rounded-md border border-line bg-surface px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Step {index + 1}</p>
                <p className="mt-2 text-sm text-text">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card muted className="p-6">
          <h3 className="ui-section-title">{copy.prepTitle}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {copy.prepItems.map((item) => (
              <div key={item} className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-text">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="ui-kicker">{locale === "ko" ? "다음 단계" : "Next step"}</p>
        <h3 className="mt-2 ui-section-title">
          {locale === "ko"
            ? "실제 상담 접수와 접수 전 확인은 별도 페이지에서 진행합니다."
            : "The actual intake form and checklist live on a dedicated page."}
        </h3>
        <p className="mt-3 text-sm text-text">
          {locale === "ko"
            ? "접수 페이지에서는 상담폼, 접수 전 확인, 결과 요약이 한 화면에서 정리됩니다."
            : "The intake page groups the form, pre-submit checklist, and initial result summary in one place."}
        </p>
        <div className="mt-5">
          <Link
            href="/intake"
            className="inline-flex h-11 items-center rounded-md border border-primary bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
          >
            {locale === "ko" ? "접수 페이지로 이동" : "Go to intake"}
          </Link>
        </div>
      </Card>
    </div>
  );
}
*/
