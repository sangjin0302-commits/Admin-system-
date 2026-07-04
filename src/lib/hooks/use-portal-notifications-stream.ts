"use client";

import { useEffect, useRef } from "react";

export type PortalNotificationPayload = {
  id: string;
  event: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

type SsePayload = {
  type: "notification" | "ping" | "connected";
  data?: PortalNotificationPayload;
  timestamp: string;
};

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Open a Server-Sent Events connection to /api/portal/notifications/stream
 * and invoke `onNotification` whenever a new portal notification arrives.
 *
 * Reconnects with exponential backoff on error (capped at 30s).
 */
export function usePortalNotificationsStream(
  onNotification: (payload: PortalNotificationPayload) => void
): void {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = INITIAL_BACKOFF_MS;

    const connect = (): void => {
      if (cancelled) return;

      source = new EventSource("/api/portal/notifications/stream");

      source.addEventListener("connected", () => {
        // Successful open — reset backoff.
        backoff = INITIAL_BACKOFF_MS;
      });

      source.addEventListener("notification", (ev: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(ev.data) as SsePayload;
          if (parsed.type === "notification" && parsed.data) {
            handlerRef.current(parsed.data);
          }
        } catch {
          /* ignore malformed frame */
        }
      });

      // ping events are heartbeats — nothing to do.

      source.onerror = () => {
        if (source) {
          source.close();
          source = null;
        }
        if (cancelled) return;
        const delay = Math.min(backoff, MAX_BACKOFF_MS);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (source) source.close();
    };
  }, []);
}
