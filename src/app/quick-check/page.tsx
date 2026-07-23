import type { Metadata } from "next";

import { QuickCheckClient } from "@/components/public/quick-check-client";

export const metadata: Metadata = {
  title: "AI 사전 진단 — 에토스 행정사사무소(ETHOS)",
  description:
    "사안 내용을 입력하면 lawbot AI가 행정사 업무 범위, 확인 사항, 위험 신호를 사전 안내합니다. 상담 신청 전 빠르게 방향을 잡으세요."
};

export default async function QuickCheckPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  return (
    <div className="relative overflow-hidden">
      <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
      <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-16 sm:px-6 sm:py-24">
        <section className="text-center">
          <p className="ethos-eyebrow">AI Pre-Check</p>
          <h1 className="ethos-display mt-4 text-4xl sm:text-[3.4rem]">AI 사전 진단</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-text-muted">
            사안 내용을 입력하시면 ETHOS lawbot이 분야 분류, 확인 사항, 위험 신호를 즉시 안내합니다.
            <br />
            ※ 일반적 안내이며, 개별 사안의 결과를 보장하지 않습니다.
          </p>
        </section>

        {lang === "en" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-5 text-center">
            <p className="font-serif text-sm font-bold text-amber-900">
              This tool is only available in Korean.
            </p>
            <p className="mt-1.5 text-xs leading-6 text-amber-800">
              이 도구는 한국어로만 제공됩니다.
            </p>
          </div>
        )}

        <QuickCheckClient />

        <section className="rounded-2xl border border-gold/30 bg-surface-muted/40 p-6 text-center text-xs leading-6 text-text-muted">
          본 분석은 법제처 OpenAPI 등 공식 자료를 참조하지만, 최종 판단은 사실관계와 자료 확인 후 사무소에서 책임집니다.
          분석 결과는 의뢰인 식별 정보 없이 처리되며, 사무소는 검토 목적으로만 활용합니다.
        </section>
      </div>
    </div>
  );
}
