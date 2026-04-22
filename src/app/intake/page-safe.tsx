import Link from "next/link";

import { IntakeFormSafeV3 } from "@/components/intake/intake-form-safe-v3";
import { Card } from "@/components/ui/card";
import { intakePageMessages } from "@/i18n/locales/intake-page";
import { createTranslator, normalizeUiLocale } from "@/i18n/shared";

export const dynamic = "force-dynamic";

export default async function IntakePageSafe({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale = normalizeUiLocale(lang);
  const t = createTranslator(intakePageMessages, locale);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="ui-analysis-hero px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="ui-kicker">{t("heroKicker")}</p>
            <h1 className="ui-page-title">{t("heroTitle")}</h1>
            <p className="max-w-2xl text-sm text-text sm:text-base">{t("heroDescription")}</p>
          </div>
          <Link
            href={locale === "ko" ? "/intake?lang=en" : "/intake"}
            className="ui-cta-pill"
          >
            {locale === "ko" ? t("switchToEnglish") : t("switchToKorean")}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr] lg:items-start">
        <Card className="ui-analysis-panel p-5 sm:p-6">
          <h2 className="ui-page-title whitespace-nowrap">{t("prepTitle")}</h2>
          <p className="mt-2 text-sm text-text-muted">{t("prepDescription")}</p>
          <ul className="mt-4 space-y-2.5">
            <li className="intake-prep-item">{t("prepItemCurrentStatus")}</li>
            <li className="intake-prep-item">{t("prepItemGoalAndDeadline")}</li>
            <li className="intake-prep-item">{t("prepItemAvailableDocuments")}</li>
            <li className="intake-prep-item">{t("prepItemTargetAgency")}</li>
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-5 border-b border-line pb-4">
            <h2 className="ui-page-title whitespace-nowrap">{t("formTitle")}</h2>
            <p className="mt-2 text-sm text-text-muted">{t("formDescription")}</p>
          </div>
          <IntakeFormSafeV3 initialLocale={locale} />
        </Card>
      </section>
    </div>
  );
}
