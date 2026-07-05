"use client";

import { useEffect } from "react";

/**
 * 관리자 사용 패턴 추적 — 페이지 방문 및 버튼 클릭을 서버로 전송.
 * 서버가 adaptive_ui 플래그 꺼진 경우 무시 (엔드포인트가 조용히 실패).
 */
export function useUsageTracker(userId: string | null | undefined, target: string) {
  useEffect(() => {
    if (!userId || !target) return;
    const controller = new AbortController();
    fetch("/api/admin/adaptive-ui", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "track", userId, type: "page", target }),
      signal: controller.signal,
    }).catch(() => {
      // silent
    });
    return () => controller.abort();
  }, [userId, target]);
}

/** 버튼 클릭 등 명시적 이벤트 추적. */
export async function trackClick(userId: string, target: string): Promise<void> {
  if (!userId || !target) return;
  try {
    await fetch("/api/admin/adaptive-ui", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "track", userId, type: "click", target }),
    });
  } catch {
    // silent
  }
}
