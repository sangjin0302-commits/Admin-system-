"use client";

import { useAdminEvents } from "@/hooks/use-admin-events";

export function AdminLiveIndicator() {
  const { connected } = useAdminEvents();

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          connected ? "animate-pulse bg-emerald-500" : "bg-red-400"
        }`}
      />
      <span className="text-text-muted">
        {connected ? "실시간" : "연결 중…"}
      </span>
    </div>
  );
}
