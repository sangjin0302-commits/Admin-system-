import Link from "next/link";

import { IntakeFormSafeV3 } from "@/components/intake/intake-form-safe-v3";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function IntakePageSafe({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "ko";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href={locale === "ko" ? "/intake?lang=en" : "/intake"}
          className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
        >
          {locale === "ko" ? "English" : "\uD55C\uAD6D\uC5B4"}
        </Link>
      </div>
      <Card className="p-6">
        <IntakeFormSafeV3 initialLocale={locale} />
      </Card>
    </div>
  );
}
