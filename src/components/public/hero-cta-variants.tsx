"use client";

import { AbVariant } from "@/components/public/ab-variant";

type Props = {
  className?: string;
};

/**
 * Renders all three hero_cta subtitle variants wrapped in <AbVariant>.
 * Only the variant matching the ethos_ab cookie assignment will render.
 */
export function HeroCtaSubtitleVariants({ className }: Props) {
  // A방향(여백·타이포): 본문 측정폭을 60~65자로 묶고 행간을 넓힌다.
  // 한 줄이 길수록 눈이 다음 줄 첫머리를 놓치고, 읽는 밀도가 높아 보인다.
  const cls = className ?? "mt-8 max-w-[62ch] text-[15.5px] leading-[1.85] text-text";
  return (
    <>
      <AbVariant experiment="hero_cta" variant="control">
        <p className={cls}>
          혼자 고민하지 마세요. 무료 검토로 가능성과 예상 비용, 다음 절차를 먼저 확인하세요.
        </p>
      </AbVariant>
      <AbVariant experiment="hero_cta" variant="urgency">
        <p className={cls}>
          <span className="font-bold text-gold-deep">AI 사전 진단으로 필요 서류와 절차를 먼저 확인하세요</span> —
          무료 검토로 가능성과 예상 비용, 다음 절차를 함께 안내합니다.
        </p>
      </AbVariant>
      <AbVariant experiment="hero_cta" variant="benefit">
        <p className={cls}>
          <span className="font-bold text-gold-deep">합리적 수임료, 상담료는 수임 시 전액 차감</span> —
          무료 검토로 가능성과 예상 비용, 다음 절차를 먼저 확인하세요.
        </p>
      </AbVariant>
    </>
  );
}
