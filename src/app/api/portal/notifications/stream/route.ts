import { NextRequest } from "next/server";

import { auth } from "@/lib/auth/auth";
import {
  PORTAL_EVENT_MAX_CLIENTS_PER_USER,
  portalNotificationSubscriberCount,
  subscribePortalNotifications
} from "@/lib/services/portal-event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (portalNotificationSubscriberCount(userId) >= PORTAL_EVENT_MAX_CLIENTS_PER_USER) {
    return new Response("Too many connections", { status: 429 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const unsubscribe = subscribePortalNotifications(userId, controller);

      // Initial connect event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            type: "connected",
            timestamp: new Date().toISOString()
          })}\n\n`
        )
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ping\ndata: ${JSON.stringify({
                type: "ping",
                timestamp: new Date().toISOString()
              })}\n\n`
            )
          );
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener("abort", cleanup);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
