"use client";

/**
 * 공개 기능 플래그 훅 — /api/public/features 를 1회 fetch해 공유.
 *
 * 헤더·푸터 등 클라이언트 컴포넌트에서 메뉴/섹션 노출 여부를 결정할 때 쓴다.
 * 로딩 전에는 null을 반환하므로, 호출부는
 *   - 기본 노출 항목: flags?.[key] !== false  (로딩 중에도 보임 — 깜빡임 방지)
 *   - 기본 숨김 항목: flags?.[key] === true   (로딩 중에는 숨김 — 나타났다 사라지는 것 방지)
 * 패턴으로 판정한다.
 */

import { useEffect, useState } from "react";

type PublicFlags = Record<string, boolean>;

// 모듈 레벨 캐시 — 같은 페이지에서 헤더/푸터가 각각 fetch하지 않게 공유.
let cached: PublicFlags | null = null;
let inflight: Promise<PublicFlags> | null = null;

async function fetchFlags(): Promise<PublicFlags> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch("/api/public/features")
      .then((r) => r.json())
      .then((j) => {
        cached = (j?.flags ?? {}) as PublicFlags;
        return cached;
      })
      .catch(() => {
        // 실패 시 빈 객체 — 호출부 패턴상 "기본 노출은 보이고 기본 숨김은 숨김"으로 동작.
        cached = {};
        return cached;
      });
  }
  return inflight;
}

export function usePublicFlags(): PublicFlags | null {
  const [flags, setFlags] = useState<PublicFlags | null>(cached);

  useEffect(() => {
    let alive = true;
    fetchFlags().then((f) => {
      if (alive) setFlags(f);
    });
    return () => {
      alive = false;
    };
  }, []);

  return flags;
}
