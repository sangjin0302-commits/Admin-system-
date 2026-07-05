import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  ADMIN_PRESENCE_HEARTBEAT_MS,
  adminPresenceSubscriberCount,
  getActivePresence,
  subscribeAdminPresence,
} from "@/lib/services/multi-admin-sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PER_ADMIN = 5;

export async function GET(req: NextRequest) {
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF", "EXTERNAL", "AUDITOR"]);
  if (!guard.ok) return guard.response;
  const adminId = guard.user.email;

  if (adminPresenceSubscriberCount(adminId) >= MAX_PER_ADMIN) {
    return NextResponse.json({ error: "Too many connections" }, { status: 429 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const unsubscribe = subscribeAdminPresence(adminId, controller);

      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            type: "connected",
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );

      // 접속 즉시 현재 존재 목록 push
      const list = await getActivePresence();
      controller.enqueue(
        encoder.encode(
          `event: presence\ndata: ${JSON.stringify({
            type: "presence",
            presence: list,
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: ping\ndata: ${JSON.stringify({
                type: "ping",
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, ADMIN_PRESENCE_HEARTBEAT_MS);

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
