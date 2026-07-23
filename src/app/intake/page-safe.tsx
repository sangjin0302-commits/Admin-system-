import { IntakeFormSafeV3 } from "@/components/intake/intake-form";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { IntakePrefillBanner } from "@/components/public/intake-prefill-banner";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import { Reveal } from "@/components/public/reveal";
import { intakePageMessages } from "@/i18n/locales/intake-page";
import { buildIntakeSourceTrackingFromSearchParams } from "@/lib/services/intake-source-tracking";
import type { Locale } from "@/types/inquiry";

export const dynamic = "force-dynamic";

function normalizeIntakeLocale(value: unknown): Locale {
  // 웹은 국문·영문만 제공 — ar 등은 국문으로 폴백.
  if (value === "en") return "en";
  return "ko";
}

function t(locale: Locale, key: keyof typeof intakePageMessages.ko): string {
  return intakePageMessages[locale]?.[key] ?? intakePageMessages.ko[key];
}

export default async function IntakePageSafe({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const lang = typeof params.lang === "string" ? params.lang : undefined;
  const locale = normalizeIntakeLocale(lang);
  const intakeTracking = buildIntakeSourceTrackingFromSearchParams(params);

  const prepChips = locale === "ko"
    ? ["현재 상황", "목표/마감", "보유 문서", "제출처"]
    : ["Current status", "Goal & deadline", "Available documents", "Target authority"];

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">{t(locale, "heroKicker")}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">{t(locale, "heroTitle")}</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-muted">
              {t(locale, "heroDescription")}
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-7 flex justify-center">
              <LocaleSwitcher />
            </div>
          </Reveal>
        </div>
      </section>

      {/* PREP — soft band */}
      <section className="ethos-band ethos-band-soft py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="ethos-card h-full p-8">
                <p className="ethos-eyebrow">Step 1</p>
                <h2 className="ethos-display mt-3 text-2xl">{t(locale, "prepTitle")}</h2>
                <p className="mt-4 text-sm leading-7 text-text-muted">{t(locale, "prepDescription")}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {prepChips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-gold/40 bg-gold-soft/30 px-3 py-1 font-serif text-[11px] font-bold text-gold-deep"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <ul className="mt-7 space-y-3">
                  {[
                    t(locale, "prepItemCurrentStatus"),
                    t(locale, "prepItemGoalAndDeadline"),
                    t(locale, "prepItemAvailableDocuments"),
                    t(locale, "prepItemTargetAgency")
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 border-l-2 border-gold/40 pl-4 text-sm leading-7 text-text">
                      <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div className="ethos-card h-full p-8">
                <p className="ethos-eyebrow">Step 2</p>
                <h2 className="ethos-display mt-3 text-2xl">
                  {locale === "ar" ? "قبل التقديم" : locale === "ko" ? "접수 전 확인" : "Before you submit"}
                </h2>
                <ul className="mt-7 space-y-3">
                  {(locale === "ar"
                    ? [
                        "إذا تلقيت إشعارًا أو قرارًا، تحقق من تواريخ القرار والإشعار والتسليم.",
                        "قد تكون تواريخ انتهاء التأشيرة والمواعيد النهائية للتقديم مهمة.",
                        "بعد التقديم، نرشدك إلى المواد المطلوبة حسب الحالة.",
                        "لا نضمن النتائج؛ يجب التحقق من النماذج الرسمية ومتطلبات الجهات."
                      ]
                    : [
                    locale === "ko"
                      ? "처분서나 통지서를 받은 경우 처분일, 통지일, 송달일을 확인해 주세요."
                      : "If you received a notice or disposition, check the decision, notice, and delivery dates.",
                    locale === "ko"
                      ? "체류기간 만료일, 제출기한, 보완기한이 중요할 수 있습니다."
                      : "Visa expiry dates, filing deadlines, and supplement deadlines may be important.",
                    locale === "ko"
                      ? "접수 후 사안별로 필요한 자료를 안내합니다."
                      : "After intake, we guide required materials by matter.",
                    locale === "ko"
                      ? "결과를 보장하지 않으며, 제출기관 기준과 공식 서식을 확인합니다."
                      : "Outcomes are not promised; official forms and authority requirements must be checked."
                  ]).map((item, i) => (
                    <li key={i} className="flex items-start gap-3 border-l-2 border-gold/40 pl-4 text-sm leading-7 text-text">
                      <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Step 3 — Application</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">{t(locale, "formTitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">{t(locale, "formDescription")}</p>
          </Reveal>

          <Reveal delay={1}>
            <IntakePrefillBanner />
            <div className="ethos-card ethos-card-topline mt-2 p-8 sm:p-10">
              <IntakeFormSafeV3 initialLocale={locale} initialTracking={intakeTracking} progressChipEnabled={await isFeatureEnabled("intake_progress_chip")} />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
