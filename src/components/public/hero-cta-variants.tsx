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
  const cls = className ?? "mt-7 max-w-xl text-base leading-8 text-text";
  return (
    <>
      <AbVariant experiment="hero_cta" variant="control">
        <p className={cls}>
          혼자 고민하지 마세요. 무료 검토로 가능성과 예상 비용, 다음 절차를 먼저 확인하세요.
        </p>
      </AbVariant>
      <AbVariant experiment="hero_cta" variant="urgency">
        <p className={cls}>
          <span className="font-bold text-gold-deep">지금 시작하면 이번 주 안에 접수 가능</span> —
          무료 검토로 가능성과 예상 비용, 다음 절차를 먼저 확인하세요.
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
