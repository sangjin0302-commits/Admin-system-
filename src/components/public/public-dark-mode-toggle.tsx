"use client";

/**
 * UX6: public 사이트 다크모드 토글 (라이트/자동/다크).
 * admin DarkModeToggle과 동일 저장 방식 — localStorage "theme" + data-theme attr.
 *
 * Feature flag: `public_dark_mode_toggle` (public) — /api/public/features로 확인.
 */

import { useEffect, useState } from "react";

type Mode = "light" | "auto" | "dark";

function applyTheme(mode: Mode) {
  const root = document.documentElement;
  if (mode === "auto") {
    localStorage.removeItem("theme");
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", dark ? "dark" : "light");
  } else {
    localStorage.setItem("theme", mode);
    root.setAttribute("data-theme", mode);
  }
}

export function PublicDarkModeToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>("auto");

  useEffect(() => {
    fetch("/api/public/features")
      .then((r) => r.json())
      .then((d: { flags?: Record<string, boolean> } | Record<string, boolean>) => {
        const flags = (d as { flags?: Record<string, boolean> }).flags ?? (d as Record<string, boolean>);
        if (flags?.public_dark_mode_toggle) setEnabled(true);
      })
      .catch(() => {});
    const saved = localStorage.getItem("theme");
    setMode(saved === "dark" || saved === "light" ? saved : "auto");
  }, []);

  if (!enabled) return null;

  const MODES: Array<{ key: Mode; label: string }> = [
    { key: "light", label: "☀️" },
    { key: "auto", label: "🌓" },
    { key: "dark", label: "🌙" },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-1 py-0.5" role="radiogroup" aria-label="테마">
      {MODES.map((m) => (
        <button
          key={m.key}
          role="radio"
          aria-checked={mode === m.key}
          onClick={() => { setMode(m.key); applyTheme(m.key); }}
          className={`rounded-full px-2 py-1 text-xs transition ${mode === m.key ? "bg-primary text-white" : "text-text-muted hover:bg-surface-muted"}`}
          title={m.key}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
