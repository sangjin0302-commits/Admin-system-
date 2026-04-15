import { Card } from "@/components/ui/card";
import type { Locale } from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function IntakeCompletedPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string; ref?: string }>;
}) {
  const { lang, ref } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "ko";
  const title = locale === "en" ? "Submission Complete" : "접수 완료";
  const description =
    locale === "en"
      ? "Your inquiry has been received. We will review it and guide you in sequence. Thank you for contacting us."
      : "접수 후 관리자 검토를 거쳐 순차적으로 안내드리겠습니다. 문의주셔서 감사합니다.";
  const referenceLabel = locale === "en" ? "Reference Number" : "접수번호";

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-8 text-center md:p-10">
        <p className="ui-kicker">Consultation Intake</p>
        <h2 className="mt-3 ui-page-title">{title}</h2>
        <p className="mt-4 text-base leading-7 text-text">{description}</p>
        {ref ? (
          <div className="mt-6 rounded-md border border-line bg-surface-muted px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              {referenceLabel}
            </p>
            <p className="mt-2 font-mono text-sm text-text-strong">{ref}</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
