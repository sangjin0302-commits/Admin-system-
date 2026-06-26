"use client";

import { useEffect, useState } from "react";

export function HeroScrollIndicator() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onScroll() {
      setHidden(window.scrollY > 80);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center transition-opacity duration-500 ${
        hidden ? "opacity-0" : "opacity-90"
      }`}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="font-serif text-[10px] font-bold uppercase tracking-[0.3em] text-gold-deep">
          Scroll
        </span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border-2 border-gold-deep p-1">
          <span className="h-1.5 w-1 animate-bounce rounded-full bg-gold-deep" />
        </span>
      </div>
    </div>
  );
}
