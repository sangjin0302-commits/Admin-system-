/**
 * 기한 임박 알림 자동 생성기
 *
 * 각 카테고리 상세 모델의 주요 기한을 점검:
 * - AdminAppealDetail.filingDeadline
 * - LicensePermitDetail.reviewDeadline / supplementDueDate
 * - ContractInvestigationDetail.reportDueDate
 * - ImmigrationCaseDetail.appealDeadline / submissionDeadline 등
 *
 * 임박 (DEFAULT_WARN_DAYS 이하) 시 CaseTask 자동 생성 (중복 방지).
 *
 * 호출:
 *   - 관리자 페이지 버튼
 *   - 향후 cron / inngest 잡으로 자동화 가능
 */

import { prisma } from "@/lib/prisma/client";

const DEFAULT_WARN_DAYS = 14;
const AUTO_TASK_PREFIX = "[자동알림]";

type DeadlineHit = {
  caseId: string;
  caseTitle: string;
  label: string;
  date: Date;
  daysLeft: number;
};

export async function scanAndCreateDeadlineAlerts(opts: { warnDays?: number } = {}): Promise<{
  scanned: number;
  hits: DeadlineHit[];
  createdTasks: number;
}> {
  const warnDays = opts.warnDays ?? DEFAULT_WARN_DAYS;
  const now = new Date();
  const threshold = new Date(now.getTime() + warnDays * 24 * 60 * 60 * 1000);

  const cases = await prisma.caseMatter.findMany({
    where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
    include: {
      adminAppealDetail: true,
      licenseDetail: true,
      contractDetail: true,
      immigrationDetail: true,
      tasks: { select: { title: true, status: true } }
    }
  });

  const hits: DeadlineHit[] = [];
  let createdTasks = 0;

  for (const cm of cases) {
    const candidates: Array<{ label: string; date: Date | null }> = [
      { label: "행정심판 청구기한", date: cm.adminAppealDetail?.filingDeadline ?? null },
      { label: "행정심판 심리기일", date: cm.adminAppealDetail?.hearingDate ?? null },
      { label: "인허가 처리기한", date: cm.licenseDetail?.reviewDeadline ?? null },
      { label: "인허가 보완 기한", date: cm.licenseDetail?.supplementDueDate ?? null },
      { label: "조사보고서 기한", date: cm.contractDetail?.reportDueDate ?? null },
      { label: "체류 만료일", date: cm.immigrationDetail?.stayExpiryDate ?? null },
      { label: "출국기한", date: cm.immigrationDetail?.departureDeadline ?? null },
      { label: "보완 기한", date: cm.immigrationDetail?.supplementDeadline ?? null },
      { label: "케이스 종료기한", date: cm.dueDate ?? null }
    ];

    for (const c of candidates) {
      if (!c.date) continue;
      if (c.date < now) continue;
      if (c.date > threshold) continue;

      const daysLeft = Math.ceil((c.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      hits.push({ caseId: cm.id, caseTitle: cm.title, label: c.label, date: c.date, daysLeft });

      const taskTitle = `${AUTO_TASK_PREFIX} ${c.label} ${daysLeft}일 남음`;
      const exists = cm.tasks.some(
        (t) => t.title.startsWith(`${AUTO_TASK_PREFIX} ${c.label}`) && t.status !== "DONE" && t.status !== "CANCELLED"
      );
      if (exists) continue;

      await prisma.caseTask.create({
        data: {
          caseId: cm.id,
          title: taskTitle,
          description: `${c.label}이(가) ${c.date.toISOString().slice(0, 10)}에 도래합니다.`,
          status: "TODO",
          priority: daysLeft <= 7 ? "URGENT" : "HIGH",
          dueDate: c.date,
          taskType: "DEADLINE_ALERT",
          source: "auto"
        }
      });
      createdTasks += 1;
    }
  }

  return { scanned: cases.length, hits, createdTasks };
}
