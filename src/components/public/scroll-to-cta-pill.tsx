"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-only floating pill that smooth-scrolls to #consult-cta.
 * Appears after the user scrolls past the hero section.
 * Uses IntersectionObserver for show/hide logic.
 */
export function ScrollToCtaPill() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Observe the hero section (first <section> in the service page)
    const hero = document.querySelector("section");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show pill when hero is NOT intersecting (scrolled past)
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    const target = document.getElementById("consult-cta");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="상담 신청 섹션으로 이동"
      className="fixed bottom-36 right-4 z-30 min-h-[48px] rounded-full bg-primary px-4 py-2 text-sm font-bold text-gold-soft shadow-lg transition-all duration-300 lg:hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      상담 신청
    </button>
  );
}
