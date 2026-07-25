/**
 * 외부 uptime 모니터(UptimeRobot 등)용 헬스체크.
 *
 * 인증 없이 접근 가능해야 하므로 내부 정보를 노출하지 않는다.
 * - 정상: 200 { ok: true, db: "up" }
 * - DB 장애: 503 { ok: false, db: "down" }  ← 모니터가 이 상태코드로 알림
 *
 * 에러 메시지·스택·버전은 응답에 담지 않는다(정찰 방지).
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DB_TIMEOUT_MS = 5_000;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

export async function GET() {
  const startedAt = Date.now();

  // DB 응답이 없을 때 헬스체크 자체가 매달리지 않도록 타임아웃을 건다.
  const dbOk = await Promise.race([
    prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), DB_TIMEOUT_MS)),
  ]);

  const body = {
    ok: dbOk,
    db: dbOk ? ("up" as const) : ("down" as const),
    latencyMs: Date.now() - startedAt,
  };

  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: NO_STORE,
  });
}

/** 모니터가 본문 없이 상태만 확인할 때 사용. */
export async function HEAD() {
  const dbOk = await Promise.race([
    prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), DB_TIMEOUT_MS)),
  ]);

  return new NextResponse(null, {
    status: dbOk ? 200 : 503,
    headers: NO_STORE,
  });
}
