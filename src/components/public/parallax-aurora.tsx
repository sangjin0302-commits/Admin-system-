"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * 히어로 오로라 장식에 은은한 스크롤 패럴랙스를 더하는 래퍼.
 * 첫 600px 스크롤 동안 -60px 만큼 위로 이동 + 약한 페이드.
 * prefers-reduced-motion 시 변형 없이 정적 렌더링.
 */
export function ParallaxAurora({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -60]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0.7]);

  if (reduced) {
    return <div className={className} aria-hidden />;
  }

  return <motion.div className={className} style={{ y, opacity }} aria-hidden />;
}
