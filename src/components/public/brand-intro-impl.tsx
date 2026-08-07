"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * 브랜드 인트로 구현부 — 첫 방문 시 ETHOS 로고 + 태그라인이 페이드 인/아웃.
 *
 * framer-motion 을 실제로 사용하는 본체. 이 모듈은 brand-intro.tsx 의
 * next/dynamic(ssr:false) 로만 로드되어 framer-motion 이 초기/공유 번들이 아닌
 * 별도 청크로 분리된다. 시각 동작은 기존과 동일.
 *
 * - sessionStorage flag `ethos_intro_seen` — 세션 당 1회.
 * - prefers-reduced-motion 존중.
 * - 500ms 페이드인 → 1.4s 유지 → 700ms 페이드아웃.
 * - 총 소요 ~2.6s.
 */
const STORAGE_KEY = "ethos_intro_seen";

export function BrandIntroImpl() {
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
      const reduced =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
          : false;
      if (reduced) {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
        return;
      }
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      setShow(true);
      const t = window.setTimeout(() => setShow(false), 1500);
      return () => window.clearTimeout(t);
    } catch {
      /* sessionStorage 접근 실패 시 인트로 비활성 */
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="brand-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none fixed inset-0 flex items-center justify-center bg-[#1a3c5f] text-white"
          style={{ zIndex: 100 }}
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-center"
          >
            <div
              className="text-5xl font-bold tracking-[0.35em] sm:text-6xl"
              style={{ fontFamily: "serif" }}
            >
              ETHOS
            </div>
            <div className="mt-3 h-[3px] w-24 mx-auto bg-[#c9a961]" />
            <p className="mt-4 text-sm tracking-[0.25em] text-[#c8d3e0] sm:text-base">
              LOGOS · PATHOS · ETHOS
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
