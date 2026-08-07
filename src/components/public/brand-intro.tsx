"use client";

import dynamic from "next/dynamic";

/**
 * 브랜드 인트로 진입점 — framer-motion(~50KB gzip)을 초기/공유 번들에서 분리.
 *
 * 실제 애니메이션 본체(brand-intro-impl.tsx)는 framer-motion 을 import 하므로
 * next/dynamic(ssr:false)로 하이드레이션 이후 별도 청크로 지연 로드한다.
 * 인트로 오버레이는 첫 페인트에 필요 없고(세션당 1회) SEO 대상도 아니라 ssr:false 가 안전.
 * 호출부(root-layout-safe)는 그대로 <BrandIntro /> 를 쓰며 시각 동작도 동일하다.
 */
const BrandIntroImpl = dynamic(
  () => import("./brand-intro-impl").then((m) => m.BrandIntroImpl),
  { ssr: false }
);

export function BrandIntro() {
  return <BrandIntroImpl />;
}
