import { prisma } from "@/lib/prisma/client";
import { sendTelegramMessage } from "@/lib/notifications/inquiry-telegram";

type ScheduleEntry = {
  date: Date;
  category: "deadline" | "followup";
  label: string;
  caseNumber: string;
  contactName: string;
  daysRemaining: number;
};

const KST_LOCALE = "ko-KR";

function getScheduleConfig() {
  return {
    enabled: process.env.TELEGRAM_SCHEDULE_BRIEFING_ENABLED?.trim() !== "false",
    adminAppUrl: process.env.ADMIN_APP_URL?.trim()
  };
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysUntil(value: Date) {
  return Math.ceil(
    (startOfDay(value).getTime() - startOfDay(new Date()).getTime()) / (24 * 60 * 60 * 1000)
  );
}

function deadlineLabel(key: string) {
  if (key === "dueDate") return "일반 일정";
  if (key === "filingDeadline") return "제출 마감";
  if (key === "supplementDeadline") return "보완 마감";
  if (key === "stayExpirationDate") return "체류 만료";
  return "내부 마감";
}

function formatRelative(days: number) {
  if (days < 0) return `${Math.abs(days)}일 지남`;
  if (days === 0) return "오늘";
  return `${days}일 남음`;
}

function escapeTelegramMarkdown(value: string) {
  return value.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function buildScheduleMessage(entries: ScheduleEntry[], adminAppUrl?: string) {
  const lines = [
    "오늘의 일정 브리핑",
    "",
    entries.length === 0
      ? "오늘 확인할 기한 또는 후속조치가 없습니다."
      : entries
          .slice(0, 12)
          .map(
            (entry) =>
              `- ${entry.caseNumber} / ${entry.contactName} / ${entry.label} / ${entry.date.toLocaleDateString(
                KST_LOCALE
              )} / ${formatRelative(entry.daysRemaining)}`
          )
          .join("\n"),
    adminAppUrl ? "" : null,
    adminAppUrl ? `${adminAppUrl.replace(/\/$/, "")}/admin/inquiries` : null
  ]
    .filter(Boolean)
    .map((line) => escapeTelegramMarkdown(String(line)));

  return lines.join("\n");
}

export async function sendDailyScheduleTelegramBriefing() {
  const config = getScheduleConfig();
  if (!config.enabled) {
    return { sent: false, reason: "disabled" as const, count: 0 };
  }

  const caseRecords = await prisma.caseRecord.findMany({
    where: {
      OR: [
        { dueDate: { not: null } },
        { filingDeadline: { not: null } },
        { supplementDeadline: { not: null } },
        { stayExpirationDate: { not: null } },
        { internalDeadline: { not: null } },
        { nextFollowUpDate: { not: null } },
        {
          followUpActions: {
            some: {
              status: "PENDING",
              dueDate: { not: null }
            }
          }
        }
      ]
    },
    include: {
      inquiry: {
        select: {
          contactName: true
        }
      },
      followUpActions: {
        where: {
          status: "PENDING",
          dueDate: { not: null }
        },
        select: {
          title: true,
          dueDate: true
        }
      }
    }
  });

  const entries: ScheduleEntry[] = [];

  for (const record of caseRecords) {
    const deadlinePairs = [
      ["dueDate", record.dueDate],
      ["filingDeadline", record.filingDeadline],
      ["supplementDeadline", record.supplementDeadline],
      ["stayExpirationDate", record.stayExpirationDate],
      ["internalDeadline", record.internalDeadline],
      ["nextFollowUpDate", record.nextFollowUpDate]
    ] as const;

    for (const [key, value] of deadlinePairs) {
      if (!value) continue;
      const remaining = daysUntil(value);
      if (remaining > 3) continue;

      entries.push({
        date: value,
        category: key === "nextFollowUpDate" ? "followup" : "deadline",
        label: key === "nextFollowUpDate" ? "다음 후속 일정" : deadlineLabel(key),
        caseNumber: record.caseNumber,
        contactName: record.inquiry.contactName,
        daysRemaining: remaining
      });
    }

    for (const action of record.followUpActions) {
      if (!action.dueDate) continue;
      const remaining = daysUntil(action.dueDate);
      if (remaining > 3) continue;

      entries.push({
        date: action.dueDate,
        category: "followup",
        label: `후속조치: ${action.title}`,
        caseNumber: record.caseNumber,
        contactName: record.inquiry.contactName,
        daysRemaining: remaining
      });
    }
  }

  entries.sort((left, right) => left.date.getTime() - right.date.getTime());

  await sendTelegramMessage(buildScheduleMessage(entries, config.adminAppUrl));

  return {
    sent: true,
    reason: "ok" as const,
    count: entries.length
  };
}
