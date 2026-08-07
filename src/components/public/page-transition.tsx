"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Entry-only route transition.
 *
 * 기존에는 framer-motion `motion.div` 를 pathname 으로 keying 해 진입 페이드를
 * 재생했다. 그런데 이 컴포넌트는 실제 페이지 콘텐츠를 감싸므로 framer-motion 을
 * 정적 import 하면 (a) 라이브러리가 공유 번들에 들어가고 (b) ssr:false 로 코드
 * 분할하면 콘텐츠가 SSR 되지 않거나(=SEO 손실) "보였다가 사라졌다 페이드"하는
 * 깜빡임이 생긴다.
 *
 * 진입 전용 애니메이션이라 CSS 로 그대로 재현할 수 있다. 콘텐츠는 항상 서버에서
 * 렌더되고, pathname 으로 keying 한 래퍼가 라우트 이동마다 재마운트되며 CSS
 * 진입 애니메이션(.page-transition-enter, globals.css)을 재생한다. easing/거리/
 * 지속시간은 기존과 동일하며 prefers-reduced-motion 도 CSS 로 존중한다.
 * 결과적으로 framer-motion 이 이 경로에서 완전히 빠진다.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-enter">
      {children}
    </div>
  );
}
