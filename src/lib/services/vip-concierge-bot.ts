/**
 * VIP 컨시어지 봇 — VIP 회원 전용 24/7 AI 응대.
 * 공개 챗봇보다 컨텍스트 크고, 최근 20턴 유지.
 * Storage: SiteSetting "concierge.thread.<clientId>" (last 50 messages).
 */
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { getPlan } from "@/lib/services/vip-membership-service";

export interface ConciergeMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface ConciergeContext {
  clientId: string;
  vipPlan: string;
  activeCases: Array<{ id: string; title: string; status: string; nextActionAt?: string | null }>;
  upcomingDeadlines: Array<{ caseId: string; title: string; dueDate: string }>;
}

const THREAD_KEY_PREFIX = "concierge.thread.";
const MAX_HISTORY = 50;
const RETAIN_CONTEXT = 20;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function threadKey(clientId: string): string {
  return `${THREAD_KEY_PREFIX}${clientId}`;
}

function systemPrompt(ctx: ConciergeContext): string {
  const caseLines = ctx.activeCases
    .slice(0, 5)
    .map((c) => `- ${c.title} (상태: ${c.status}${c.nextActionAt ? `, 다음 액션: ${c.nextActionAt}` : ""})`)
    .join("\n");
  const dueLines = ctx.upcomingDeadlines
    .slice(0, 5)
    .map((d) => `- ${d.title} (마감: ${d.dueDate})`)
    .join("\n");
  return `당신은 ETHOS 행정사 VIP 컨시어지입니다. VIP ${ctx.vipPlan} 회원에게 정중하고 전문적으로 응대하세요.

[활성 사건]
${caseLines || "없음"}

[다가오는 마감]
${dueLines || "없음"}

지침:
- 사건 상태·마감을 언제든 답할 수 있습니다.
- 상담 예약 가능 여부는 담당자 확인이 필요하다고 안내합니다.
- 법률 판단이 필요한 답변은 담당 행정사가 별도 확인 후 회신함을 밝힙니다.
- 한국어, 존댓말, 2문단 이내로 답하세요.`;
}

export async function getConciergeContext(clientId: string): Promise<ConciergeContext | null> {
  const membership = await getPlan(clientId);
  if (!membership) return null;
  // clientId를 이메일로 가정하고 caseMatter를 문의 이메일로 매칭
  const activeCases = await prisma.caseMatter.findMany({
    where: {
      inquiry: { email: clientId },
      closedAt: null,
    },
    select: { id: true, title: true, status: true, nextActionAt: true, dueDate: true },
    take: 10,
    orderBy: { updatedAt: "desc" },
  });
  const upcomingDeadlines = activeCases
    .filter((c) => c.dueDate && c.dueDate.getTime() > Date.now())
    .map((c) => ({
      caseId: c.id,
      title: c.title,
      dueDate: c.dueDate!.toISOString(),
    }));
  return {
    clientId,
    vipPlan: membership.plan,
    activeCases: activeCases.map((c) => ({
      id: c.id,
      title: c.title,
      status: String(c.status),
      nextActionAt: c.nextActionAt?.toISOString() ?? null,
    })),
    upcomingDeadlines,
  };
}

async function readThread(clientId: string): Promise<ConciergeMessage[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: threadKey(clientId) } }).catch(() => null);
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m): m is ConciergeMessage =>
      m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    );
  } catch {
    return [];
  }
}

async function writeThread(clientId: string, messages: ConciergeMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_HISTORY);
  const value = JSON.stringify(trimmed);
  await prisma.siteSetting.upsert({
    where: { key: threadKey(clientId) },
    create: { key: threadKey(clientId), value },
    update: { value },
  });
}

export async function getThread(clientId: string): Promise<ConciergeMessage[]> {
  return readThread(clientId);
}

export async function clearThread(clientId: string): Promise<void> {
  await writeThread(clientId, []);
}

export interface ConciergeResponse {
  reply: string;
  usedFallback: boolean;
}

function fallbackReply(userMessage: string, ctx: ConciergeContext): string {
  if (/사건|상태|진행/.test(userMessage)) {
    if (ctx.activeCases.length === 0) return "현재 진행 중인 사건이 없습니다. 담당자에게 확인이 필요하시면 알려주세요.";
    const first = ctx.activeCases[0];
    return `현재 진행 중인 사건은 "${first.title}" 이며 상태는 ${first.status} 입니다. 자세한 안내가 필요하시면 말씀해 주세요.`;
  }
  if (/마감|기한|일정/.test(userMessage)) {
    if (ctx.upcomingDeadlines.length === 0) return "다가오는 마감이 없습니다.";
    return `가장 가까운 마감은 "${ctx.upcomingDeadlines[0].title}" — ${ctx.upcomingDeadlines[0].dueDate} 입니다.`;
  }
  return "답변을 준비 중입니다. 담당자에게 전달해 곧 회신드리겠습니다.";
}

export async function chat(
  clientId: string,
  userMessage: string
): Promise<ConciergeResponse> {
  const ctx = await getConciergeContext(clientId);
  if (!ctx) {
    return { reply: "VIP 회원만 이용 가능한 서비스입니다.", usedFallback: true };
  }
  const trimmed = userMessage.trim().slice(0, 2000);
  const history = await readThread(clientId);
  const recent = history.slice(-RETAIN_CONTEXT);
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  let reply: string;
  let usedFallback = false;
  if (!apiKey) {
    reply = fallbackReply(trimmed, ctx);
    usedFallback = true;
  } else {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 600,
          system: systemPrompt(ctx),
          messages: [
            ...recent.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed },
          ],
        }),
      });
      if (!res.ok) {
        logger.warn("[vip-concierge] anthropic error", res.status);
        reply = fallbackReply(trimmed, ctx);
        usedFallback = true;
      } else {
        const data = await res.json();
        reply = data?.content?.[0]?.text?.trim() || fallbackReply(trimmed, ctx);
      }
    } catch (err) {
      logger.warn("[vip-concierge] exception", err);
      reply = fallbackReply(trimmed, ctx);
      usedFallback = true;
    }
  }
  const now = new Date().toISOString();
  const nextHistory: ConciergeMessage[] = [
    ...history,
    { role: "user", content: trimmed, at: now },
    { role: "assistant", content: reply, at: new Date().toISOString() },
  ];
  await writeThread(clientId, nextHistory);
  return { reply, usedFallback };
}

/** Telegram 브릿지 — 옵션. 링크된 chatId가 있으면 릴레이. */
export async function relayToTelegram(clientId: string, message: string): Promise<boolean> {
  const link = await prisma.siteSetting.findUnique({ where: { key: `concierge.telegram.${clientId}` } }).catch(() => null);
  const chatId = link?.value?.trim();
  if (!chatId) return false;
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    return res.ok;
  } catch (err) {
    logger.warn("[vip-concierge] telegram relay failed", err);
    return false;
  }
}
