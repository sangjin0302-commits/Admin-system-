"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

type AdminEvent = {
  type: "inquiry_new" | "inquiry_status" | "case_update" | "system" | "connected";
  data?: Record<string, unknown>;
  timestamp: string;
};

export function useAdminEvents() {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    if (esRef.current) return;

    const es = new EventSource("/api/admin/events");
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
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

      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current++;
      setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  return { connected };
}
