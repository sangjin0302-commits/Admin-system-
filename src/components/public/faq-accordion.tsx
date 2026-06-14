"use client";

import { useState } from "react";

type FaqItem = { q: string; a: string };

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto mt-14 max-w-3xl space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`overflow-hidden rounded-2xl border transition-colors ${
              isOpen ? "border-gold/50 bg-surface" : "border-gold/20 bg-surface/70"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="flex items-start gap-3">
                <span className="ethos-quote mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-gold-deep">
                  Q
                </span>
                <span className="font-serif text-base font-bold text-primary">{item.q}</span>
              </span>
              <span
                aria-hidden
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold-deep transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 pl-[3.75rem] text-sm leading-7 text-text-muted">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
