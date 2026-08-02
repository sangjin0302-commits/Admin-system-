import type { Metadata } from "next";

import { QuoteCompare } from "@/components/public/quote-compare";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { FeatureComingSoon } from "@/components/public/feature-coming-soon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "비교 견적 요청 — 에토스 행정사사무소(ETHOS)",
  description:
    "다른 곳에서 받으신 견적서를 보내주시면 ETHOS 견적과 항목별 비교 리포트를 무료로 보내드립니다."
};

export default async function QuoteComparePage() {
  // 백엔드 미검증 — 기본 비활성(잠금). /admin/features 에서 켤 수 있음.
  if (!(await isFeatureEnabled("quote_compare_enabled"))) {
    return <FeatureComingSoon title="비교 견적 준비 중" />;
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <p className="ethos-eyebrow">Quote Compare</p>
        <h1 className="ethos-display mt-3 text-3xl sm:text-4xl">비교 견적 요청</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-muted">
          다른 곳 견적서를 보내주시면 ETHOS 견적과 항목별 비교 리포트를 무료로 발송해 드립니다.
          (금액·범위·포함 항목·조건을 표로 정리해 드립니다.)
        </p>
      </div>
      <QuoteCompare />
    </main>
  );
}
