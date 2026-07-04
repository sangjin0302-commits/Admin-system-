/**
 * Portal SSE event bus (in-memory, per serverless container).
 *
 * Per-client subscriber map — a notification is only pushed to controllers
 * subscribed under that clientId. Mirrors admin-event-bus.ts.
 */

export type PortalNotificationEvent = {
  type: "notification" | "ping" | "connected";
  data?: unknown;
  timestamp: string;
};

const encoder = new TextEncoder();

// clientId -> set of active stream controllers for that client
const portalNotificationClients = new Map<string, Set<ReadableStreamDefaultController>>();

export const PORTAL_EVENT_MAX_CLIENTS_PER_USER = 5;

export function portalNotificationSubscriberCount(clientId: string): number {
  return portalNotificationClients.get(clientId)?.size ?? 0;
}

export function subscribePortalNotifications(
  clientId: string,
  controller: ReadableStreamDefaultController
): () => void {
  let set = portalNotificationClients.get(clientId);
  if (!set) {
    set = new Set();
    portalNotificationClients.set(clientId, set);
  }
  set.add(controller);

  return () => {
    const s = portalNotificationClients.get(clientId);
    if (!s) return;
    s.delete(controller);
    if (s.size === 0) {
      portalNotificationClients.delete(clientId);
    }
  };
}

export function broadcastPortalNotification(clientId: string, payload: unknown): void {
  const set = portalNotificationClients.get(clientId);
  if (!set || set.size === 0) return;

  const event: PortalNotificationEvent = {
    type: "notification",
    data: payload,
    timestamp: new Date().toISOString()
  };
  const chunk = encoder.encode(`event: notification\ndata: ${JSON.stringify(event)}\n\n`);

  for (const controller of set) {
    try {
      controller.enqueue(chunk);
    } catch {
      set.delete(controller);
    }
  }
  if (set.size === 0) {
    portalNotificationClients.delete(clientId);
  }
}
