"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { QuickConsultForm } from "@/components/public/quick-consult-form";

type BottomSheetContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
};

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function BottomSheetConsultProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <BottomSheetContext.Provider value={{ open, setOpen }}>
      {children}
      <BottomSheetConsult />
    </BottomSheetContext.Provider>
  );
}

export function useBottomSheetConsult(): BottomSheetContextValue {
  const ctx = useContext(BottomSheetContext);
  if (!ctx) {
    // Fallback for consumers used outside the provider — no-op setter.
    return { open: false, setOpen: () => {} };
  }
  return ctx;
}

/**
 * Mobile-only slide-up consultation bottom sheet.
 * - Reuses <QuickConsultForm />
 * - ESC close, focus trap, body scroll lock, backdrop fade
 * - No framer-motion; CSS transitions in globals.css
 */
export function BottomSheetConsult() {
  const ctx = useContext(BottomSheetContext);
  const open = ctx?.open ?? false;
  const setOpen = ctx?.setOpen ?? (() => {});

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Keep the panel mounted briefly for exit transition
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = window.setTimeout(() => setMounted(false), 320);
    return () => window.clearTimeout(t);
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close + focus trap
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (focusables[0] ?? panel).focus();
    };
    // Focus after slide-in kicks off
    const rid = window.setTimeout(focusFirst, 30);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("aria-hidden"));
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(rid);
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, setOpen]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  if (!mounted && !open) return null;

  return (
    <div className="lg:hidden" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        className="ethos-sheet-backdrop fixed inset-0 z-[70] bg-black/50"
        data-open={open ? "true" : "false"}
        onClick={close}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="ethos-sheet-panel fixed inset-x-0 bottom-0 z-[71] max-h-[90vh] overflow-y-auto rounded-t-2xl bg-surface-raised shadow-floating outline-none"
        data-open={open ? "true" : "false"}
      >
        {/* Drag handle (visual; tap to close) */}
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="mx-auto mt-3 mb-1 block h-1.5 w-12 rounded-full bg-line-strong/60 hover:bg-line-strong"
        />
        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <h2
            id={titleId}
            className="font-serif text-lg font-semibold text-text-strong"
          >
            빠른 상담 신청
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="상담창 닫기"
            className="ui-btn-ghost -mr-2 h-9 w-9 rounded-full text-xl leading-none text-text-muted"
          >
            ×
          </button>
        </div>
        <div className="px-5 pb-6">
          <QuickConsultForm />
        </div>
      </div>
    </div>
  );
}
