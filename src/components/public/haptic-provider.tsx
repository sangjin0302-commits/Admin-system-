"use client";

/**
 * 햅틱 피드백 프로바이더.
 *
 * `useHaptic()` 훅으로 진동 트리거를 제공합니다.
 * - navigator.vibrate 사용 (미지원 브라우저는 no-op)
 * - 사용자 opt-in: localStorage("ethos.haptic.enabled") = "1" | "0"
 * - 기본은 true (플래그로 사이트 전체 활성화 제어).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type HapticPreset = "success" | "error" | "tap" | "notification";

const PATTERNS: Record<HapticPreset, number | number[]> = {
  tap: 30,
  success: 100,
  error: 200,
  notification: [100, 50, 100],
};

const STORAGE_KEY = "ethos.haptic.enabled";

type HapticContextValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  trigger: (preset: HapticPreset) => void;
};

const HapticContext = createContext<HapticContextValue | null>(null);

export function HapticProvider({ children, defaultEnabled = true }: { children: ReactNode; defaultEnabled?: boolean }) {
  const [enabled, setEnabledState] = useState<boolean>(defaultEnabled);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setEnabledState(true);
      else if (stored === "0") setEnabledState(false);
    } catch {
      // ignore
    }
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const trigger = useCallback(
    (preset: HapticPreset) => {
      if (!enabled) return;
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (!nav || typeof nav.vibrate !== "function") return;
      try {
        nav.vibrate(PATTERNS[preset]);
      } catch {
        // ignore
      }
    },
    [enabled],
  );

  const value = useMemo(() => ({ enabled, setEnabled, trigger }), [enabled, setEnabled, trigger]);
  return <HapticContext.Provider value={value}>{children}</HapticContext.Provider>;
}

export function useHaptic(): HapticContextValue {
  const ctx = useContext(HapticContext);
  if (ctx) return ctx;
  // 프로바이더 밖에서도 안전한 no-op fallback
  return {
    enabled: false,
    setEnabled: () => undefined,
    trigger: () => undefined,
  };
}
