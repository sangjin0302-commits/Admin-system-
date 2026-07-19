"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

type AdminEvent = {
  type: "inquiry_new" | "inquiry_status" | "case_update" | "system" | "connected";
  data?: Record<string, unknown>;
  timestamp: string;
};

/**
 * 재연결을 이만큼 실패하면 포기하고 "오프라인"으로 확정한다.
 * 무한 재시도는 실패 원인(401·프록시가 SSE 미지원 등)을 "연결 중…"으로 위장해
 * 관리자가 페이지가 멈춘 줄 알게 만든다.
 */
const MAX_RETRIES = 5;

export function useAdminEvents() {
  const [connected, setConnected] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);

  const connect = useCallback(() => {
    if (esRef.current || closedRef.current) return;

    const es = new EventSource("/api/admin/events");
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setGaveUp(false);
      retryRef.current = 0;
    };

    es.onmessage = (e) => {
      try {
        const event: AdminEvent = JSON.parse(e.data);

        switch (event.type) {
          case "inquiry_new":
            toast("새 문의 접수", { icon: "🔔" });
            break;
          case "inquiry_status":
            toast(`문의 상태 변경: ${event.data?.status || ""}`, { icon: "🔄" });
            break;
          case "case_update":
            toast(`사건 업데이트: ${event.data?.title || ""}`, { icon: "📂" });
            break;
          case "connected":
            break;
        }
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      if (retryRef.current >= MAX_RETRIES) {
        setGaveUp(true);
        return;
      }

      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current++;
      setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    closedRef.current = false;
    connect();
    return () => {
      closedRef.current = true;
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  return { connected, gaveUp };
}
