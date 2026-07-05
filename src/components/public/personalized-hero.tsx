/**
 * 맞춤형 히어로 (서버 컴포넌트).
 *
 * 방문자 요청 헤더에서 컨텍스트를 파싱하여 선택된 variant의 히어로 카피를 렌더합니다.
 * 매칭 실패 시 default fallback 텍스트를 반환합니다.
 */

import { headers } from "next/headers";

import { parseVisitorContext, pickVariant } from "@/lib/services/homepage-personalization-service";

type Props = {
  fallbackBadge: string;
  fallbackTitle: string;
  fallbackDescription: string;
};

export async function PersonalizedHero({ fallbackBadge, fallbackTitle, fallbackDescription }: Props) {
  let badge = fallbackBadge;
  let title = fallbackTitle;
  let description = fallbackDescription;

  try {
    const h = await headers();
    const ctx = parseVisitorContext({
      acceptLanguage: h.get("accept-language"),
      referer: h.get("referer"),
      userAgent: h.get("user-agent"),
      url: h.get("x-url") ?? null,
    });
    const variant = await pickVariant(ctx);
    if (variant) {
      badge = variant.heroBadge?.trim() || badge;
      title = variant.heroTitle?.trim() || title;
      description = variant.heroDescription?.trim() || description;
    }
  } catch {
    // 헤더 파싱 실패는 조용히 fallback
  }

  const titleLines = title.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <span className="ethos-eyebrow inline-flex items-center gap-2 text-gold-deep">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        {badge}
      </span>
      <h1 className="ethos-display text-[2.7rem] leading-[1.1] sm:text-[3.8rem]">
        {titleLines.map((line, i) => (
          <span key={i}>
            {i === titleLines.length - 1 ? (
              <span className="ethos-underline-gold">{line}</span>
            ) : (
              line
            )}
            {i < titleLines.length - 1 && <br />}
          </span>
        ))}
      </h1>
      <p className="text-base leading-7 text-text-muted sm:text-lg">{description}</p>
    </div>
  );
}

export default PersonalizedHero;
