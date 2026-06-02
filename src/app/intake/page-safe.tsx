import Link from "next/link";

import { IntakeFormSafeV3 } from "@/components/intake/intake-form-safe-v3";
import { Card } from "@/components/ui/card";
import { intakePageMessages } from "@/i18n/locales/intake-page";
import { buildIntakeSourceTrackingFromSearchParams } from "@/lib/services/intake-source-tracking";
import { createTranslator, normalizeUiLocale } from "@/i18n/shared";

export const dynamic = "force-dynamic";

export default async function IntakePageSafe({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const lang = typeof params.lang === "string" ? params.lang : undefined;
  const locale = normalizeUiLocale(lang);
  const t = createTranslator(intakePageMessages, locale);
  const intakeTracking = buildIntakeSourceTrackingFromSearchParams(params);

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

      <section className="space-y-4">
        <Card className="ui-analysis-panel p-5 sm:p-6">
          <div className="space-y-3">
            <h2 className="ui-page-title">{t("prepTitle")}</h2>
            <p className="text-sm text-text-muted">{t("prepDescription")}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="ui-analysis-chip">
              {locale === "ko" ? "현재 상황" : "Current status"}
            </span>
            <span className="ui-analysis-chip">
              {locale === "ko" ? "목표/마감" : "Goal & deadline"}
            </span>
            <span className="ui-analysis-chip">
              {locale === "ko" ? "보유 문서" : "Available documents"}
            </span>
            <span className="ui-analysis-chip">
              {locale === "ko" ? "제출처" : "Target authority"}
            </span>
          </div>
          <ul className="mt-4 space-y-2.5">
            <li className="intake-prep-item">{t("prepItemCurrentStatus")}</li>
            <li className="intake-prep-item">{t("prepItemGoalAndDeadline")}</li>
            <li className="intake-prep-item">{t("prepItemAvailableDocuments")}</li>
            <li className="intake-prep-item">{t("prepItemTargetAgency")}</li>
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="ui-page-title">
            {locale === "ko" ? "접수 전 확인" : "Before you submit"}
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li className="intake-prep-item">
              {locale === "ko"
                ? "처분서나 통지서를 받은 경우 처분일, 통지일, 송달일을 확인해 주세요."
                : "If you received a notice or disposition, check the decision, notice, and delivery dates."}
            </li>
            <li className="intake-prep-item">
              {locale === "ko"
                ? "체류기간 만료일, 제출기한, 보완기한이 중요할 수 있습니다."
                : "Visa expiry dates, filing deadlines, and supplement deadlines may be important."}
            </li>
            <li className="intake-prep-item">
              {locale === "ko"
                ? "접수 후 사안별로 필요한 자료를 안내합니다."
                : "After intake, we guide required materials by matter."}
            </li>
            <li className="intake-prep-item">
              {locale === "ko"
                ? "결과를 보장하지 않으며, 제출기관 기준과 공식 서식을 확인합니다."
                : "Outcomes are not promised; official forms and authority requirements must be checked."}
            </li>
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-5 border-b border-line pb-4">
            <h2 className="ui-page-title whitespace-nowrap">{t("formTitle")}</h2>
            <p className="mt-2 text-sm text-text-muted">{t("formDescription")}</p>
          </div>
          <IntakeFormSafeV3 initialLocale={locale} initialTracking={intakeTracking} />
        </Card>
      </section>
    </div>
  );
}
