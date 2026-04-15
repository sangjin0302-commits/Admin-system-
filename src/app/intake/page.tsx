import Link from "next/link";

import { getIntakeCopy } from "@/components/intake/copy";
import { IntakeForm } from "@/components/intake/intake-form";
import { Card } from "@/components/ui/card";
import { getPublicIntakeContent } from "@/lib/public-content/service";
import type { Locale } from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function IntakePage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "ko";
  const copy = getIntakeCopy(locale);
  const content = await getPublicIntakeContent();
  const pageContent = content[locale];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <p className="ui-kicker">Public Consultation Intake</p>
          <h2 className="mt-3 ui-page-title">{pageContent.intakePageTitle}</h2>
          <p className="mt-3 max-w-3xl text-base text-text">{pageContent.intakePageDescription}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={locale === "ko" ? "/intake?lang=en" : "/intake"}
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              {locale === "ko" ? "English" : "한국어"}
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              관리자 로그인
            </Link>
          </div>
        </Card>

        <Card muted className="p-6">
          <h3 className="ui-section-title">{pageContent.intakeInfoTitle}</h3>
          <div className="mt-4 space-y-3">
            {pageContent.intakeInfoItems.map((item) => (
              <div key={item} className="rounded-md border border-line bg-surface px-4 py-3">
                <p className="text-sm text-text">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="ui-section-title">{copy.formTitle}</h3>
            <p className="mt-2 ui-section-copy">공개 접수 레이어는 외부 채널에서 바로 연결해도 되는 전용 경로입니다.</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            홈으로 돌아가기
          </Link>
        </div>
        <IntakeForm initialLocale={locale} />
      </Card>
    </div>
  );
}
