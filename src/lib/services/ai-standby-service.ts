/**
 * 24/7 AI 대행 서비스 — 업무 외 시간 AI가 문의 대응 초안 생성.
 * 확신도 임계 이상 → 자동 실행 (롤백 가능), 미달 → 승인 큐 저장.
 *
 * 저장: SiteSetting key = "ai_standby.actions" (JSON)
 */

import { prisma } from "@/lib/prisma/client";
import { getSiteSetting } from "@/lib/services/site-settings";
import { logger } from "@/lib/utils/logger";

const ACTIONS_KEY = "ai_standby.actions";
const TRUST_KEY = "ai_standby.trust_score";
const MAX_ACTIONS = 300;

export type StandbyCategory = "replied" | "quoted" | "scheduled" | "escalated";

export type StandbyAction = {
  id: string;
  at: string;
  category: StandbyCategory;
  subject: string;
  summary: string;
  confidence: number; // 0-1
  autoExecuted: boolean;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rolled_back" | "ignored";
  reviewedAt?: string;
  reviewedBy?: string;
};

function genId(): string {
  return `stb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function loadActions(): Promise<StandbyAction[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: ACTIONS_KEY } }).catch(() => null);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value) as StandbyAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveActions(actions: StandbyAction[]): Promise<void> {
  const trimmed = actions.slice(-MAX_ACTIONS);
  await prisma.siteSetting
    .upsert({
      where: { key: ACTIONS_KEY },
      create: { key: ACTIONS_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    })
    .catch(() => null);
}

async function getTrustScore(): Promise<number> {
  const row = await prisma.siteSetting.findUnique({ where: { key: TRUST_KEY } }).catch(() => null);
  const parsed = row ? Number.parseFloat(row.value) : NaN;
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.85;
}

async function setTrustScore(score: number): Promise<void> {
  const clamped = Math.min(1, Math.max(0, score));
  await prisma.siteSetting
    .upsert({
      where: { key: TRUST_KEY },
      create: { key: TRUST_KEY, value: String(clamped) },
      update: { value: String(clamped) },
    })
    .catch(() => null);
}

/** 업무 외 시간 판별 — contact.hours 문자열 파싱 (평일 09:00-18:00 형식). */
function parseHours(hoursText: string): { startHour: number; endHour: number } {
  const m = hoursText.match(/(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}/);
  if (!m) return { startHour: 9, endHour: 18 };
  return { startHour: Number(m[1]), endHour: Number(m[2]) };
}

export async function isOffHours(now: Date = new Date()): Promise<boolean> {
  const hoursText = await getSiteSetting("contact.hours");
  const { startHour, endHour } = parseHours(hoursText);
  const h = now.getHours();
  const day = now.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return true;
  return h < startHour || h >= endHour;
}

export type IncomingInquiry = {
  subject: string;
  body: string;
  from?: string;
};

/** AI로 초안 생성 + 확신도 산출. */
async function generateDraft(
  inquiry: IncomingInquiry
): Promise<{ draft: string; confidence: number; category: StandbyCategory }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      draft: "AI 미설정 — 관리자 검토 필요",
      confidence: 0,
      category: "escalated",
    };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `다음 문의에 대한 한국어 회신 초안을 작성하고, JSON으로 { "draft": "...", "confidence": 0-1, "category": "replied|quoted|scheduled|escalated" } 만 반환:\n\n제목: ${inquiry.subject}\n내용: ${inquiry.body.slice(0, 1500)}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { draft: "회신 생성 실패", confidence: 0, category: "escalated" };
    }
    const json = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = json.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as {
          draft?: string;
          confidence?: number;
          category?: StandbyCategory;
        };
        return {
          draft: parsed.draft ?? text,
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
          category: parsed.category ?? "replied",
        };
      } catch {
        // fall through
      }
    }
    return { draft: text, confidence: 0.5, category: "replied" };
  } catch (e) {
    logger.debug("[ai-standby] draft error", { err: e instanceof Error ? e.message : String(e) });
    return { draft: "예외 발생 — 검토 필요", confidence: 0, category: "escalated" };
  }
}

export async function handleInquiry(inquiry: IncomingInquiry): Promise<StandbyAction> {
  const off = await isOffHours();
  const trust = await getTrustScore();
  const { draft, confidence, category } = await generateDraft(inquiry);
  const autoExec = off && confidence >= trust;

  const action: StandbyAction = {
    id: genId(),
    at: new Date().toISOString(),
    category,
    subject: inquiry.subject.slice(0, 200),
    summary: draft.slice(0, 500),
    confidence,
    autoExecuted: autoExec,
    payload: { from: inquiry.from, body: inquiry.body.slice(0, 2000), draft },
    status: autoExec ? "approved" : "pending",
  };
  const log = await loadActions();
  log.push(action);
  await saveActions(log);
  return action;
}

export async function getPendingActions(): Promise<StandbyAction[]> {
  const log = await loadActions();
  return log.filter((a) => a.status === "pending");
}

export async function getAllActions(limit = 100): Promise<StandbyAction[]> {
  const log = await loadActions();
  return log.slice(-limit).reverse();
}

export async function decideAction(
  actionId: string,
  decision: "approve" | "rollback" | "ignore",
  reviewedBy?: string
): Promise<{ ok: boolean; action?: StandbyAction }> {
  const log = await loadActions();
  const idx = log.findIndex((a) => a.id === actionId);
  if (idx < 0) return { ok: false };
  const prev = log[idx];
  const statusMap = {
    approve: "approved" as const,
    rollback: "rolled_back" as const,
    ignore: "ignored" as const,
  };
  log[idx] = {
    ...prev,
    status: statusMap[decision],
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };
  await saveActions(log);

  // 신뢰도 조정
  const trust = await getTrustScore();
  if (decision === "approve") await setTrustScore(trust - 0.01); // 임계 하향 → 자동 실행 확대
  if (decision === "rollback") await setTrustScore(trust + 0.03); // 임계 상향 → 보수적
  return { ok: true, action: log[idx] };
}

export async function bulkApprove(): Promise<number> {
  const log = await loadActions();
  let count = 0;
  const now = new Date().toISOString();
  for (const a of log) {
    if (a.status === "pending") {
      a.status = "approved";
      a.reviewedAt = now;
      count++;
    }
  }
  if (count > 0) await saveActions(log);
  return count;
}

export async function getStandbyStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rolledBack: number;
  autoExecuted: number;
  trustScore: number;
}> {
  const log = await loadActions();
  return {
    total: log.length,
    pending: log.filter((a) => a.status === "pending").length,
    approved: log.filter((a) => a.status === "approved").length,
    rolledBack: log.filter((a) => a.status === "rolled_back").length,
    autoExecuted: log.filter((a) => a.autoExecuted).length,
    trustScore: await getTrustScore(),
  };
}

export { getTrustScore, setTrustScore };
