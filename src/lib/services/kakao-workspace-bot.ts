/**
 * 카카오 워크스페이스 봇 서비스 (스텁)
 *
 * 관리자가 카카오 채널에서 메시지 명령으로 시스템을 조작합니다.
 * 실제 발신 응답은 카카오 비즈니스 채널 API(검수 완료된 봇)가 필요합니다.
 *
 * 필요 환경 변수:
 *   KAKAO_WORKSPACE_SECRET     — Webhook 서명 검증용 HMAC 시크릿
 *   KAKAO_WORKSPACE_CHANNEL_ID — 발신 채널 ID
 *   KAKAO_WORKSPACE_TOKEN      — Kakao Business API 토큰
 */

import { createHmac, timingSafeEqual } from "crypto";

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const LOG_KEY = "integration.kakao_workspace.log";

export type BotCommand =
  | { type: "new_inquiries" }
  | { type: "deadlines_today" }
  | { type: "today_summary" }
  | { type: "case_detail"; caseNo: string }
  | { type: "reply_inquiry"; inquiryCode: string; message: string }
  | { type: "unknown"; raw: string };

export type BotInteraction = {
  id: string;
  at: string;
  sender?: string;
  inputText: string;
  command: string;
  response: string;
  ok: boolean;
};

export const COMMAND_REFERENCE = [
  { cmd: "/신규", desc: "새 문의 목록 조회" },
  { cmd: "/마감", desc: "오늘 마감 사건" },
  { cmd: "/오늘", desc: "오늘의 요약" },
  { cmd: "/사건 [사건번호]", desc: "사건 상세" },
  { cmd: "/응답 [의뢰번호] [메시지]", desc: "문의 답변 발송" },
] as const;

export function verifyKakaoSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.KAKAO_WORKSPACE_SECRET?.trim();
  if (!secret) {
    // 시크릿 미설정 시 — 개발 편의상 통과. 프로덕션에선 반드시 설정 필요.
    logger.warn("[kakao-workspace] KAKAO_WORKSPACE_SECRET 미설정 — 서명 검증 스킵");
    return true;
  }
  if (!signatureHeader) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "hex");
    const provided = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
    const b = Buffer.from(provided, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseCommand(text: string): BotCommand {
  const s = text.trim();
  if (/^\/신규$/.test(s)) return { type: "new_inquiries" };
  if (/^\/마감$/.test(s)) return { type: "deadlines_today" };
  if (/^\/오늘$/.test(s)) return { type: "today_summary" };
  const caseM = s.match(/^\/사건\s+(\S+)$/);
  if (caseM) return { type: "case_detail", caseNo: caseM[1] };
  const replyM = s.match(/^\/응답\s+(\S+)\s+([\s\S]+)$/);
  if (replyM) return { type: "reply_inquiry", inquiryCode: replyM[1], message: replyM[2].trim() };
  return { type: "unknown", raw: s };
}

export async function executeCommand(cmd: BotCommand): Promise<string> {
  try {
    switch (cmd.type) {
      case "new_inquiries": {
        const inqs = await prisma.inquiry.findMany({
          where: { status: { in: ["NEW", "IN_REVIEW"] } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, contactName: true, title: true, createdAt: true, publicTrackingCode: true },
        });
        if (!inqs.length) return "새 문의가 없습니다.";
        return "새 문의:\n" + inqs.map((i) => `- ${i.publicTrackingCode ?? i.id.slice(0, 8)} · ${i.contactName ?? "익명"} · ${i.title ?? "제목없음"}`).join("\n");
      }
      case "deadlines_today": {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(end.getDate() + 1);
        const cases = await prisma.caseMatter.findMany({
          where: { dueDate: { gte: start, lt: end } },
          take: 10,
          select: { caseNo: true, title: true, status: true },
        });
        if (!cases.length) return "오늘 마감 사건이 없습니다.";
        return "오늘 마감:\n" + cases.map((c) => `- ${c.caseNo ?? "-"} · ${c.title} · ${c.status}`).join("\n");
      }
      case "today_summary": {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const [newInq, dueCases] = await Promise.all([
          prisma.inquiry.count({ where: { createdAt: { gte: start } } }),
          prisma.caseMatter.count({ where: { dueDate: { gte: start, lt: new Date(start.getTime() + 86400000) } } }),
        ]);
        return `오늘의 요약\n- 신규 문의: ${newInq}건\n- 오늘 마감: ${dueCases}건`;
      }
      case "case_detail": {
        const c = await prisma.caseMatter.findFirst({
          where: { caseNo: cmd.caseNo },
          select: { caseNo: true, title: true, status: true, dueDate: true, summary: true },
        });
        if (!c) return `사건번호 ${cmd.caseNo}를 찾을 수 없습니다.`;
        return `[${c.caseNo}] ${c.title}\n상태: ${c.status}\n마감: ${c.dueDate?.toISOString().slice(0, 10) ?? "-"}\n${c.summary ?? ""}`;
      }
      case "reply_inquiry": {
        // TODO: 실제 답변 발송 — inquiryCode로 Inquiry 찾아 응답 메시지 저장
        return `답변 예약: ${cmd.inquiryCode} → "${cmd.message.slice(0, 40)}..."\n(실제 발송은 검수된 봇 API 필요)`;
      }
      case "unknown":
      default:
        return "알 수 없는 명령입니다. /오늘 /신규 /마감 /사건 [번호] /응답 [번호] [메시지]";
    }
  } catch (err) {
    logger.error("[kakao-workspace] command execution failed", err);
    return "명령 처리 중 오류가 발생했습니다.";
  }
}

export async function sendResponse(_channel: string, _text: string): Promise<{ sent: boolean; dryRun: boolean }> {
  const token = process.env.KAKAO_WORKSPACE_TOKEN?.trim();
  if (!token) {
    return { sent: false, dryRun: true };
  }
  // TODO: 실제 카카오 비즈니스 채널 API 발신 호출
  return { sent: true, dryRun: false };
}

export async function logInteraction(entry: Omit<BotInteraction, "id" | "at">): Promise<void> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
    const arr: BotInteraction[] = row?.value ? (JSON.parse(row.value) as BotInteraction[]) : [];
    arr.push({ ...entry, id: `bi_${Date.now().toString(36)}`, at: new Date().toISOString() });
    const trimmed = arr.slice(-100);
    await prisma.siteSetting.upsert({
      where: { key: LOG_KEY },
      create: { key: LOG_KEY, value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    });
  } catch (err) {
    logger.warn("[kakao-workspace] log append failed", err);
  }
}

export async function listInteractions(limit = 50): Promise<BotInteraction[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: LOG_KEY } });
  if (!row?.value) return [];
  try {
    const arr = JSON.parse(row.value) as BotInteraction[];
    return Array.isArray(arr) ? arr.slice().reverse().slice(0, limit) : [];
  } catch {
    return [];
  }
}
