import type { Metadata } from "next";

import { AiIntakeScreener } from "@/components/public/ai-intake-screener";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "빠른 진단 — ETHOS 행정사사무소",
  description:
    "5개 문항으로 사안 유형, 예상 견적 범위, 필요 서류, 진행 절차를 초기 안내해 드립니다."
};

export default function AiScreenPage() {
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
      <AiIntakeScreener />
    </main>
  );
}
