export type AdminEvent = {
  type: "inquiry_new" | "inquiry_status" | "case_update" | "system";
  data: Record<string, unknown>;
  timestamp: string;
};

// In-memory event bus (single instance per serverless container)
export const adminEventClients = new Set<ReadableStreamDefaultController>();
export const ADMIN_EVENT_MAX_CLIENTS = 50;

export function broadcastAdminEvent(event: AdminEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const controller of adminEventClients) {
    try {
      controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      adminEventClients.delete(controller);
    }
  }
}
