import type { Metadata } from "next";

import { AiIntakeScreener } from "@/components/public/ai-intake-screener";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "빠른 진단 — ETHOS 행정사사무소",
  description:
    "5개 문항으로 사안 유형, 예상 견적 범위, 필요 서류, 진행 절차를 초기 안내해 드립니다."
};

export default async function AiScreenPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <p className="ethos-eyebrow">AI Intake Screener</p>
        <h1 className="ethos-display mt-3 text-3xl sm:text-4xl">30초 사전 진단</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-muted">
          5개 문항만 답해 주시면 사안 유형과 예상 견적 범위, 필요 서류를 즉시 안내해 드립니다.
          (참고용 초기 분석이며, 실제 견적은 상담 후 확정됩니다.)
        </p>
      </div>
      {lang === "en" && (
        <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-5 text-center">
          <p className="font-serif text-sm font-bold text-amber-900">
            This tool is only available in Korean.
          </p>
          <p className="mt-1.5 text-xs leading-6 text-amber-800">
            이 도구는 한국어로만 제공됩니다.
          </p>
        </div>
      )}
      <AiIntakeScreener />
    </main>
  );
}
