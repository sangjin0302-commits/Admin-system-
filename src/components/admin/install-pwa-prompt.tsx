"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ethos.admin.pwaInstallDismissed";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPWAPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed → nothing to show
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const dismissedAt = Number(raw);
        // Re-offer after 30 days
        if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < 30 * 24 * 3600 * 1000) {
          return;
        }
      }
    } catch {}

    function onBIP(e: Event) {
      e.preventDefault();
      setEvt(e as BIPEvent);
      // Delay to avoid interrupting first paint
      window.setTimeout(() => setVisible(true), 8000);
    }
    window.addEventListener("beforeinstallprompt", onBIP);

    // Register service worker if not already
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!visible || !evt) return null;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
    setVisible(false);
  }

  async function install() {
    if (!evt) return;
    try {
      await evt.prompt();
      await evt.userChoice.catch(() => {});
    } catch {}
    dismiss();
  }

  return (
    <div
      role="dialog"
      aria-label="관리자 앱 설치 안내"
      className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-gold/40 bg-surface p-4 shadow-floating lg:bottom-6 lg:right-6 lg:left-auto lg:max-w-xs"
    >
      <p className="font-serif text-sm font-bold text-primary">관리자 앱 설치</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        홈 화면에 추가하면 오프라인에서도 문의함/사건을 조회할 수 있습니다.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={install}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-text-strong"
        >
          설치
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-text-muted transition hover:bg-surface-muted"
        >
          나중에
        </button>
      </div>
    </div>
  );
}

export default InstallPWAPrompt;
