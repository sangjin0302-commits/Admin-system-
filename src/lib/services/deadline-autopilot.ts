/**
 * 자동 마감 캘린더 봇 — 활성 사건 마감 D-7 / D-3 / 당일 자동 리마인더 + 후속 미완료 시 에스컬레이션.
 *
 * 저장:
 *   - "deadline_autopilot.config"  — 알림 템플릿 및 채널 설정
 *   - "deadline_autopilot.state.<caseId>" — 사건별 최근 발송 스탬프 (중복 방지)
 *   - "deadline_autopilot.log"     — 최근 자동 발송 로그 (최대 200개)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const CONFIG_KEY = "deadline_autopilot.config";
const STATE_PREFIX = "deadline_autopilot.state.";
const LOG_KEY = "deadline_autopilot.log";
const MAX_LOG = 200;

export type ReminderInterval = "D-7" | "D-3" | "D-0" | "POST_ESCALATE";

export type AutopilotConfig = {
  templates: Record<ReminderInterval, { subject: string; body: string }>;
  channels: { email: boolean; kakao: boolean; admin: boolean };
  escalateAfterDays: number;
};

const DEFAULT_CONFIG: AutopilotConfig = {
  templates: {
    "D-7": {
      subject: "[알림] 마감 7일 전 안내",
      body: "안녕하세요, {caseTitle} 건의 마감이 7일 남았습니다. 준비 상태를 확인해 주세요.",
    },
    "D-3": {
      subject: "[중요] 마감 3일 전 안내",
      body: "{caseTitle} 건의 마감이 3일 남았습니다. 미제출 서류가 있는지 다시 한 번 확인 부탁드립니다.",
    },
    "D-0": {
      subject: "[긴급] 마감 당일 안내",
      body: "{caseTitle} 건의 마감이 오늘입니다. 늦지 않게 조치 부탁드립니다.",
    },
    POST_ESCALATE: {
      subject: "[에스컬레이션] 마감 후 미조치 사건",
      body: "{caseTitle} 건이 마감 후에도 조치가 완료되지 않았습니다. 담당자 확인이 필요합니다.",
    },
  },
  channels: { email: true, kakao: true, admin: true },
  escalateAfterDays: 2,
};

export async function getAutopilotConfig(): Promise<AutopilotConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CONFIG_KEY } });
    if (!row?.value) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(row.value) as Partial<AutopilotConfig>;
    return {
      templates: { ...DEFAULT_CONFIG.templates, ...(parsed.templates ?? {}) },
      channels: { ...DEFAULT_CONFIG.channels, ...(parsed.channels ?? {}) },
      escalateAfterDays: typeof parsed.escalateAfterDays === "number" ? parsed.escalateAfterDays : DEFAULT_CONFIG.escalateAfterDays,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function setAutopilotConfig(cfg: AutopilotConfig): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(cfg) },
    update: { value: JSON.stringify(cfg) },
  });
}

type AutopilotLogEntry = {
  caseId: string;
  caseTitle: string;
  interval: ReminderInterval;
  sentAt: string;
  channels: string[];
  status: "sent" | "skipped" | "error";
  message?: string;
};

export async function getAutopilotLog(limit = 50): Promise<AutopilotLogEntry[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value) as AutopilotLogEntry[];
    return Array.isArray(arr) ? arr.slice(0, limit) : [];
  } catch {
    return [];
  }
}

async function appendLog(entries: AutopilotLogEntry[]): Promise<void> {
  if (entries.length === 0) return;
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
    const arr: AutopilotLogEntry[] = row?.value ? (JSON.parse(row.value) as AutopilotLogEntry[]) : [];
    const merged = [...entries, ...arr].slice(0, MAX_LOG);
    await prisma.siteSetting.upsert({
      where: { key: LOG_KEY },
      create: { key: LOG_KEY, value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) },
    });
  } catch (err) {
    logger.warn("[deadline-autopilot] log append failed", err);
  }
}

type CaseState = { lastInterval?: ReminderInterval; lastSentAt?: string };

async function getCaseState(caseId: string): Promise<CaseState> {
  const row = await prisma.siteSetting.findUnique({ where: { key: `${STATE_PREFIX}${caseId}` } });
  if (!row?.value) return {};
  try {
    return JSON.parse(row.value) as CaseState;
  } catch {
    return {};
  }
}
async function setCaseState(caseId: string, state: CaseState): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: `${STATE_PREFIX}${caseId}` },
    create: { key: `${STATE_PREFIX}${caseId}`, value: JSON.stringify(state) },
    update: { value: JSON.stringify(state) },
  });
}

function pickInterval(daysUntilDue: number, escalateAfterDays: number): ReminderInterval | null {
  if (daysUntilDue === 7) return "D-7";
  if (daysUntilDue === 3) return "D-3";
  if (daysUntilDue === 0) return "D-0";
  if (daysUntilDue <= -escalateAfterDays) return "POST_ESCALATE";
  return null;
}

/**
 * 예정된 자동 액션 프리뷰 (다음 7일 이내 마감).
 */
export async function previewUpcomingActions(): Promise<Array<{ caseId: string; caseTitle: string; interval: ReminderInterval; dueDate: string }>> {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86_400_000);
  const cases = await prisma.caseMatter.findMany({
    where: {
      dueDate: { gte: now, lte: in7 },
      status: { notIn: ["CLOSED", "CANCELLED"] },
    },
    select: { id: true, title: true, dueDate: true },
    take: 200,
  });
  const cfg = await getAutopilotConfig();
  const out: Array<{ caseId: string; caseTitle: string; interval: ReminderInterval; dueDate: string }> = [];
  for (const c of cases) {
    if (!c.dueDate) continue;
    const days = Math.floor((c.dueDate.getTime() - now.getTime()) / 86_400_000);
    const interval = pickInterval(days, cfg.escalateAfterDays);
    if (interval) out.push({ caseId: c.id, caseTitle: c.title, interval, dueDate: c.dueDate.toISOString() });
  }
  return out;
}

/**
 * 마감 자동조종 실행 — 크론에서 호출.
 */
export async function runDeadlineAutopilot(): Promise<{ scanned: number; sent: number; skipped: number; errors: number }> {
  const cfg = await getAutopilotConfig();
  const now = new Date();
  const cutoffPast = new Date(now.getTime() - (cfg.escalateAfterDays + 30) * 86_400_000);
  const cutoffFuture = new Date(now.getTime() + 8 * 86_400_000);

  const cases = await prisma.caseMatter.findMany({
    where: {
      dueDate: { gte: cutoffPast, lte: cutoffFuture },
      status: { notIn: ["CLOSED", "CANCELLED"] },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      inquiry: { select: { email: true, phone: true, contactName: true } },
    },
    take: 500,
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const logs: AutopilotLogEntry[] = [];

  for (const c of cases) {
    if (!c.dueDate) continue;
    const days = Math.floor((c.dueDate.getTime() - now.getTime()) / 86_400_000);
    const interval = pickInterval(days, cfg.escalateAfterDays);
    if (!interval) continue;

    const state = await getCaseState(c.id);
    if (state.lastInterval === interval) {
      skipped++;
      continue;
    }

    const tpl = cfg.templates[interval];
    const subject = tpl.subject.replace(/\{caseTitle\}/g, c.title);
    const body = tpl.body.replace(/\{caseTitle\}/g, c.title);
    const channels: string[] = [];

    try {
      // Client email
      if (cfg.channels.email && c.inquiry?.email) {
        try {
          const mod = await import("@/lib/services/email-notification-service").catch(() => null);
          const send = mod as unknown as { sendPlainEmail?: (a: { to: string; subject: string; body: string }) => Promise<unknown> } | null;
          if (send?.sendPlainEmail) {
            await send.sendPlainEmail({ to: c.inquiry.email, subject, body });
            channels.push("email");
          }
        } catch (err) {
          logger.warn("[deadline-autopilot] email 발송 실패", { caseId: c.id, err });
        }
      }
      // Client kakao
      if (cfg.channels.kakao && c.inquiry?.phone) {
        try {
          const mod = await import("@/lib/services/kakao-notification-service").catch(() => null);
          const send = mod as unknown as { isAlimtalkConnected?: () => boolean; notifyDeadlineReminder?: (phone: string, name: string, message: string) => Promise<unknown> } | null;
          if (send?.isAlimtalkConnected?.() && send.notifyDeadlineReminder) {
            await send.notifyDeadlineReminder(c.inquiry.phone, c.inquiry.contactName || "고객님", body);
            channels.push("kakao");
          }
        } catch (err) {
          logger.warn("[deadline-autopilot] kakao 발송 실패", { caseId: c.id, err });
        }
      }
      // Admin notification
      if (cfg.channels.admin) {
        try {
          await prisma.caseEvent.create({
            data: {
              caseId: c.id,
              eventType: `admin.deadline_autopilot.${interval}`,
              actorId: "system",
              actorName: "deadline-autopilot",
              message: subject,
              payloadJson: JSON.stringify({ body, interval }),
            },
          });
          channels.push("admin");
        } catch (err) {
          logger.warn("[deadline-autopilot] admin event 실패", { caseId: c.id, err });
        }
      }

      await setCaseState(c.id, { lastInterval: interval, lastSentAt: now.toISOString() });
      logs.push({
        caseId: c.id,
        caseTitle: c.title,
        interval,
        sentAt: now.toISOString(),
        channels,
        status: channels.length > 0 ? "sent" : "skipped",
      });
      if (channels.length > 0) sent++;
      else skipped++;
    } catch (err) {
      errors++;
      logger.error("[deadline-autopilot] 사건 처리 실패", { caseId: c.id, err });
      logs.push({
        caseId: c.id,
        caseTitle: c.title,
        interval,
        sentAt: now.toISOString(),
        channels: [],
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await appendLog(logs);
  return { scanned: cases.length, sent, skipped, errors };
}
