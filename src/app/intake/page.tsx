import Link from "next/link";

import { getIntakeCopy } from "@/components/intake/copy-clean";
import { IntakeForm } from "@/components/intake/intake-form-clean";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <p className="ui-kicker">{copy.pageKicker}</p>
          <h2 className="mt-3 ui-page-title">{copy.formTitle}</h2>
          <p className="mt-3 max-w-3xl text-base text-text">{copy.pageDescription}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={locale === "ko" ? "/intake?lang=en" : "/intake"}
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              {locale === "ko" ? "English" : "한국어"}
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              {locale === "ko" ? "접수 안내" : "Intake Guide"}
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

      <Card className="p-6">
        <div className="mb-6">
          <h3 className="ui-section-title">{copy.formTitle}</h3>
        </div>
        <IntakeForm initialLocale={locale} />
      </Card>
    </div>
  );
}
