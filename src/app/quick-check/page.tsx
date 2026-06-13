import type { Metadata } from "next";

import { QuickCheckClient } from "@/components/public/quick-check-client";

export const metadata: Metadata = {
  title: "AI 사전 진단 — ETHOS 행정사사무소",
  description:
    "사안 내용을 입력하면 lawbot AI가 행정사 업무 범위, 확인 사항, 위험 신호를 사전 안내합니다. 상담 신청 전 빠르게 방향을 잡으세요."
};

export default function QuickCheckPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">AI Pre-Check</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">
          AI 사전 진단
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
          사안 내용을 입력하시면 ETHOS lawbot이 분야 분류, 확인 사항, 위험 신호를 즉시 안내합니다.
          <br />
          ※ 일반적 안내이며, 개별 사안의 결과를 보장하지 않습니다.
        </p>
      </section>

      <QuickCheckClient />

      <section className="rounded-2xl border border-gold/30 bg-surface-muted/40 p-6 text-center text-xs leading-6 text-text-muted">
        본 분석은 법제처 OpenAPI 등 공식 자료를 참조하지만, 최종 판단은 사실관계와 자료 확인 후 사무소에서 책임집니다.
        분석 결과는 의뢰인 식별 정보 없이 처리되며, 사무소는 검토 목적으로만 활용합니다.
      </section>
    </div>
  );
}
