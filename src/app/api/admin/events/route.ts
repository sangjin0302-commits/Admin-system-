import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminEvent = {
  type: "inquiry_new" | "inquiry_status" | "case_update" | "system";
  data: Record<string, unknown>;
  timestamp: string;
};

// In-memory event bus (single instance)
const clients = new Set<ReadableStreamDefaultController>();
const MAX_CLIENTS = 50;

export function broadcastAdminEvent(event: AdminEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const controller of clients) {
    try {
      controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      clients.delete(controller);
    }
  }
}

export async function GET(req: NextRequest) {
  // Basic auth check
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (clients.size >= MAX_CLIENTS) {
    return new Response("Too many connections", { status: 429 });
  }

  let controllerRef: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      clients.add(controller);

      // Send initial heartbeat
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
        )
      );

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          clients.delete(controller);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clients.delete(controller);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      clients.delete(controllerRef);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
