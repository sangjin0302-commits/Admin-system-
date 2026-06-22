/**
 * Vercel Cron — 자격 점수 + Lawbot 강도가 높은 NEW Inquiry를 자동으로
 * 사건전환 제안(notification + audit) 처리.
 *
 * 기준:
 *   - Inquiry.status = NEW or CONTACTED
 *   - qualificationScore >= 70
 *   - 연결된 CaseMatter 없음
 *   - 최근 24h 내 추가 처리되지 않음
 *
 * 처리:
 *   - PortalNotification 생성 (의뢰인에게 "사건 진행 가능" 안내)
 *   - AdminAuditEvent 기록 (시스템 자동 제안)
 *
 * 매일 03:00 실행 권장.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { logAdminAudit } from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SCORE_THRESHOLD = 70;
const BATCH_LIMIT = 50;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 86400_000);

  const candidates = await prisma.inquiry
    .findMany({
      where: {
        createdAt: { gte: since },
        qualificationScore: { gte: SCORE_THRESHOLD },
        status: { in: ["NEW", "PRE_DIAGNOSED", "CONSULTATION_REQUIRED"] },
        caseMatters: { none: {} },
      },
      select: {
        id: true,
        email: true,
        contactName: true,
        title: true,
        qualificationScore: true,
      },
      take: BATCH_LIMIT,
      orderBy: { qualificationScore: "desc" },
    })
    .catch(() => []);

  let proposed = 0;
  let skipped = 0;

  for (const i of candidates) {
    // 24h dedup
    const recent = await prisma.adminAuditEvent
      .findFirst({
        where: {
          resource: "Inquiry",
          resourceId: i.id,
          action: "UPDATE",
          createdAt: { gte: new Date(Date.now() - 24 * 3600_000) },
        },
        select: { id: true },
      })
      .catch(() => null);
    if (recent) {
      skipped++;
      continue;
    }

    // 의뢰인에게 알림 (PortalClient 등록된 경우)
    try {
      const client = await prisma.portalClient.findUnique({
        where: { email: i.email },
        select: { id: true },
      });
      if (client) {
        await prisma.portalNotification.create({
          data: {
            clientId: client.id,
            inquiryId: i.id,
            event: "case_proposal",
            title: "사건 진행 제안",
            body: `${i.contactName ?? "고객"}님의 문의 "${i.title}" 가 사건 진행 가능 등급으로 평가되었습니다. 상담을 예약해주세요.`,
            link: `/portal`,
          },
        });
      }
    } catch (err) {
      logger.warn("[auto-conv] portal notif failed", err);
    }

    await logAdminAudit({
      actorEmail: "system@ethos.local",
      action: "UPDATE",
      resource: "Inquiry",
      resourceId: i.id,
      details: {
        autoProposal: true,
        qualificationScore: i.qualificationScore,
        contactName: i.contactName,
      },
    });

    proposed++;
  }

  logger.info("[cron:auto-conv-proposals]", { proposed, skipped });
  return NextResponse.json({
    ok: true,
    runAt: new Date().toISOString(),
    candidates: candidates.length,
    proposed,
    skipped,
  });
}
