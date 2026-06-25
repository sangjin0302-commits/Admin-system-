"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ethos.pwaInstallDismissed";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    function onBIP(e: Event) {
      e.preventDefault();
      setEvt(e as BIPEvent);
      window.setTimeout(() => setVisible(true), 15000);
    }
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!visible || !evt) return null;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  }

  async function install() {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice.catch(() => {});
    dismiss();
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-gold/40 bg-surface p-4 shadow-floating lg:bottom-6 lg:right-6 lg:left-auto lg:max-w-xs">
      <p className="font-serif text-sm font-bold text-primary">앱으로 설치하기</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        홈 화면에 추가하면 검토 요청을 더 빠르게 보낼 수 있습니다.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={install}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-text-strong"
        >
          설치
        </button>
        <button
          onClick={dismiss}
          className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-text-muted transition hover:bg-surface-muted"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
