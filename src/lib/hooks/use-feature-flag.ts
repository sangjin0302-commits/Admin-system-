"use client";

import { useEffect, useState } from "react";

/**
 * 공개 기능 플래그 클라이언트 훅.
 * - 첫 사용 시 /api/public/features 1회 fetch → 인메모리 캐시 (30초)
 * - 여러 컴포넌트가 같은 캐시 공유
 * - undefined = 로딩 중, true/false = 확정 상태
 */

type Flags = Record<string, boolean>;

let _cache: { at: number; flags: Flags } | null = null;
let _pending: Promise<Flags> | null = null;
const CACHE_MS = 30_000;
const listeners = new Set<(flags: Flags) => void>();

function notify(flags: Flags) {
  for (const fn of listeners) fn(flags);
}

async function loadFlags(force = false): Promise<Flags> {
  if (!force && _cache && Date.now() - _cache.at < CACHE_MS) return _cache.flags;
  if (_pending) return _pending;

  _pending = (async () => {
    try {
      const res = await fetch("/api/public/features", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const flags = (data?.flags ?? {}) as Flags;
      _cache = { at: Date.now(), flags };
      notify(flags);
      return flags;
    } catch {
      const flags: Flags = _cache?.flags ?? {};
      return flags;
    } finally {
      _pending = null;
    }
  })();

  return _pending;
}

export function useFeatureFlag(key: string): boolean | undefined {
  const [value, setValue] = useState<boolean | undefined>(() => _cache?.flags[key]);

  useEffect(() => {
    let mounted = true;
    const listener = (flags: Flags) => {
      if (mounted) setValue(flags[key]);
    };
    listeners.add(listener);
    loadFlags().then((flags) => {
      if (mounted) setValue(flags[key]);
    });
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, [key]);

  return value;
}

export function refreshFeatureFlags(): Promise<Flags> {
  return loadFlags(true);
}
