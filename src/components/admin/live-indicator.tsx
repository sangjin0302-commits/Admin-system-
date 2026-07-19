"use client";

import { useAdminEvents } from "@/hooks/use-admin-events";

export function AdminLiveIndicator() {
  const { connected, gaveUp } = useAdminEvents();

  // "연결 중…"은 정말 시도 중일 때만. 포기한 뒤에도 그대로 두면 관리자가
  // 페이지 전체가 로딩 중인 줄 알고 기다리게 된다.
  const label = connected ? "실시간" : gaveUp ? "실시간 알림 꺼짐" : "연결 중…";

  return (
    <div
      className="flex items-center gap-2 text-xs"
      title={
        gaveUp
          ? "실시간 알림(SSE) 연결에 실패했습니다. 화면 기능에는 영향이 없으며, 새로고침하면 최신 데이터가 보입니다."
          : undefined
      }
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          connected ? "animate-pulse bg-emerald-500" : gaveUp ? "bg-text-muted/50" : "bg-amber-400"
        }`}
      />
      <span className="text-text-muted">{label}</span>
    </div>
  );
}
