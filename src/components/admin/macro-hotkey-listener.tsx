"use client";

/**
 * BBB4: 매크로 hotkey listener.
 *
 * Ctrl+1 ~ Ctrl+9 → localStorage에 저장된 매크로를 클립보드 복사.
 * localStorage key: admin.macros = [{key:1..9, text, name?}]
 *
 * /admin/macros 페이지에서 편집. 이 컴포넌트는 layout에서 mount.
 *
 * Feature flag: `macro_hotkeys`
 */

import { useEffect } from "react";
import toast from "react-hot-toast";

const LS_KEY = "admin.macros";

type Macro = { key: number; text: string; name?: string };

function loadMacros(): Macro[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Macro[]) : [];
  } catch { return []; }
}

export function MacroHotkeyListener({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      const target = e.target as HTMLElement | null;
      // typing input 안에서는 매크로 삽입 (일반 페이지에서는 복사)
      const num = parseInt(e.key, 10);
      if (!Number.isFinite(num) || num < 1 || num > 9) return;
      const macros = loadMacros();
      const macro = macros.find((m) => m.key === num);
      if (!macro?.text) return;
      e.preventDefault();
      if (target && (target.tagName === "TEXTAREA" || (target.tagName === "INPUT" && (target as HTMLInputElement).type === "text"))) {
        const input = target as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const cur = input.value;
        input.value = cur.slice(0, start) + macro.text + cur.slice(end);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.setSelectionRange(start + macro.text.length, start + macro.text.length);
        toast.success(`매크로 ${num}${macro.name ? ` (${macro.name})` : ""} 삽입`);
      } else {
        try {
          void navigator.clipboard.writeText(macro.text);
          toast.success(`매크로 ${num}${macro.name ? ` (${macro.name})` : ""} 복사`);
        } catch { toast.error("복사 실패"); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  return null;
}
