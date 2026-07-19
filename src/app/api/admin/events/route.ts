import { NextRequest } from "next/server";

import { adminEventClients, ADMIN_EVENT_MAX_CLIENTS } from "@/lib/services/admin-event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 인증은 middleware(isProtectedAdminRoute)가 담당한다. Basic Auth 든 세션 쿠키든
  // 여기까지 온 요청은 이미 통과한 것이다.
  //
  // 여기서 Authorization 헤더를 다시 요구하면 안 된다 — EventSource 는 커스텀
  // 헤더를 보낼 수 없어서, 관리자 로그인(세션 쿠키)으로 들어온 경우 항상 401 이 되고
  // 헤더 배지가 "연결 중…" 에서 영원히 멈춘 채 재연결만 반복한다.
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
