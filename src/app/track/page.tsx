import type { Metadata } from "next";

import { PublicTrackClient } from "@/components/public-track/public-track-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "\uC811\uC218 \uC9C4\uD589\uC0C1\uD669 \uD655\uC778",
  description:
    "\uC811\uC218\uBC88\uD638\uC640 \uD734\uB300\uD3F0 \uB4A4 4\uC790\uB9AC\uB85C \uACE0\uAC1D\uC6A9 \uC9C4\uD589\uC0C1\uD669\uC744 \uD655\uC778\uD569\uB2C8\uB2E4."
};

export default async function TrackPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
      <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
      <section className="px-4 sm:px-6">
        {lang === "en" && (
          <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="font-serif text-sm font-bold text-amber-900">
              This page is only available in Korean.
            </p>
            <p className="mt-1.5 text-xs leading-6 text-amber-800">
              이 페이지는 한국어로 제공됩니다.
            </p>
          </div>
        )}
        <PublicTrackClient />
      </section>
    </div>
  );
}
