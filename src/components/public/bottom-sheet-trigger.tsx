"use client";

import { useBottomSheetConsult } from "@/components/public/bottom-sheet-consult";

/**
 * Mobile-only floating trigger that opens the consult bottom sheet.
 * Positioned above the sticky CTA bar.
 */
export function BottomSheetTrigger() {
  const { open, setOpen } = useBottomSheetConsult();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="빠른 상담 열기"
      aria-expanded={open}
      className="ethos-ripple fixed bottom-24 right-4 z-[60] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-floating transition hover:shadow-lg active:scale-[0.98] lg:hidden"
      style={{
        background:
          "linear-gradient(135deg, rgb(201 169 97), rgb(168 134 71))",
      }}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      <span>빠른 상담</span>
    </button>
  );
}
