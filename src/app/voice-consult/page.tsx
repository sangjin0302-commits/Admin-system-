import type { Metadata } from "next";
import Link from "next/link";

import { VoiceConsultWidget } from "@/components/public/voice-consult-widget";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI 음성 상담 — ETHOS 행정사사무소",
  description: "실시간 AI 음성 상담으로 행정 문의를 나눕니다.",
};

export default async function VoiceConsultPage() {
  const enabled = await isFeatureEnabled("voice_ai_consult");

  if (!enabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-primary">준비 중입니다</h1>
        <p className="mt-3 text-sm text-text-muted">
          AI 음성 상담 기능은 현재 비활성화되어 있습니다. 아래에서 문의해 주세요.
        </p>
        <Link
          href="/consult"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white"
        >
          텍스트 상담으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <span className="ethos-eyebrow inline-flex items-center gap-2 text-gold-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          AI Voice
        </span>
        <h1 className="ethos-display mt-4 text-3xl sm:text-4xl">AI 상담원과 실시간 통화</h1>
        <p className="mt-3 text-sm text-text-muted">
          음성으로 편하게 물어보세요. 개인정보는 세션 종료 후 즉시 폐기됩니다.
        </p>
      </div>
      <div className="mt-10">
        <VoiceConsultWidget />
      </div>
    </div>
  );
}
