import { NextRequest } from "next/server";

import { adminEventClients, ADMIN_EVENT_MAX_CLIENTS } from "@/lib/services/admin-event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Basic auth check
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (adminEventClients.size >= ADMIN_EVENT_MAX_CLIENTS) {
    return new Response("Too many connections", { status: 429 });
  }

  let controllerRef: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      adminEventClients.add(controller);

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
          adminEventClients.delete(controller);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        adminEventClients.delete(controller);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      adminEventClients.delete(controllerRef);
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
