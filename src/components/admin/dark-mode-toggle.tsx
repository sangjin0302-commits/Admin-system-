"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ethos.theme";

type Theme = "light" | "dark" | "auto";

export function DarkModeToggle({ enabled = true }: { enabled?: boolean }) {
  const [theme, setTheme] = useState<Theme>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") setTheme(stored);
    } catch { /* ignore */ }
  }, []);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    try {
      if (next === "auto") {
        localStorage.removeItem(STORAGE_KEY);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
      } else {
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.dataset.theme = next;
      }
    } catch { /* ignore */ }
  };

  if (!enabled || !mounted) return null;

  const options: Array<{ v: Theme; icon: string; label: string }> = [
    { v: "light", icon: "☀", label: "라이트" },
    { v: "auto", icon: "◐", label: "자동" },
    { v: "dark", icon: "☾", label: "다크" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="테마 선택"
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 text-xs"
    >
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={theme === o.v}
          onClick={() => applyTheme(o.v)}
          className={`rounded-full px-2 py-1 transition ${
            theme === o.v
              ? "bg-black text-white"
              : "text-text-muted hover:bg-surface-muted"
          }`}
          title={o.label}
        >
          <span aria-hidden>{o.icon}</span>
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
