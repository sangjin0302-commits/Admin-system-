/**
 * III1: 포털 사건 타임라인 실데이터 API.
 *
 * GET /api/portal/cases/{id}/timeline
 * Response: { ok: true, events: [{ step, status, date, description }] }
 *
 * Feature flag: `portal_timeline_live`
 * - CaseEvent 있으면 이벤트 목록 반환.
 * - 없으면 CaseMatter.status + updatedAt 단일 이벤트로 폴백.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TimelineEvent = {
  step: string;
  status: string;
  date: string;
  description: string;
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isFeatureEnabled("portal_timeline_live"))) {
      return NextResponse.json(
        { ok: false, error: "FEATURE_DISABLED" },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const userId = (session.user as { id?: string }).id;
    const client = userId
      ? await prisma.portalClient.findUnique({ where: { id: userId } })
      : null;
    if (!client) {
      return NextResponse.json({ ok: false, error: "NO_CLIENT" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const caseMatter = await prisma.caseMatter.findUnique({
      where: { id },
      include: {
        inquiry: { select: { email: true } },
        events: { orderBy: { createdAt: "asc" }, take: 60 },
      },
    });
    if (!caseMatter || caseMatter.inquiry?.email !== client.email) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    let events: TimelineEvent[];
    if (caseMatter.events.length > 0) {
      events = caseMatter.events.map((ev, i) => ({
        step: `step-${i + 1}`,
        status: ev.eventType,
        date: ev.createdAt.toISOString(),
        description: ev.message,
      }));
    } else {
      // fallback: CaseMatter.status + updatedAt 단일 이벤트
      events = [
        {
          step: "current",
          status: caseMatter.status,
          date: caseMatter.updatedAt.toISOString(),
          description: `현재 상태: ${caseMatter.status}`,
        },
      ];
    }

    return NextResponse.json({ ok: true, events });
  } catch (err) {
    logger.warn("[portal.timeline] error", err);
    return NextResponse.json({ ok: false, error: "INTERNAL" }, { status: 500 });
  }
}
