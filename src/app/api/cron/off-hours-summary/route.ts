import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

type Inquiry = {
  id: string;
  createdAt: Date;
  contactName: string;
  email: string;
  phone: string | null;
  title: string;
  description: string;
  inquiryType: string;
  urgencyLevel: string;
  intakeSource: string;
};

function fmtHM(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

async function summarizeWithClaude(items: Inquiry[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || items.length === 0) return null;
  const lines = items.map((it, i) =>
    `${i + 1}. [${it.inquiryType}/${it.urgencyLevel}] ${it.contactName} (${it.phone || "전화없음"}) — ${it.title.slice(0, 80)}`
  );
  const userPrompt =
    "다음은 지난 야간(영업시간 외)에 접수된 문의 목록이다. 관리자용 아침 브리핑을 3-6문장으로 작성하라. " +
    "우선순위 상위 2건을 지목하고, 유형 분포(비자/심판/계약 등)를 요약하며, 오늘 오전 우선 처리 권고를 포함하라.\n\n" +
    lines.join("\n");
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
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    return data.content?.find((c) => c.type === "text")?.text?.trim() ?? null;
  } catch (err) {
    logger.warn("[off-hours-summary] claude failed", err);
    return null;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Window: previous day 18:00 KST → today 07:00 KST (best-effort in server TZ)
  const now = new Date();
  const since = new Date(now);
  since.setHours(since.getHours() - 14); // roughly cover night window

  let items: Inquiry[] = [];
  try {
    items = await prisma.inquiry.findMany({
      where: { createdAt: { gte: since, lte: now } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, createdAt: true, contactName: true, email: true, phone: true,
        title: true, description: true,
        inquiryType: true, urgencyLevel: true, intakeSource: true,
      },
    }) as unknown as Inquiry[];
  } catch (err) {
    logger.error("[off-hours-summary] db read failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  if (items.length === 0) {
    return NextResponse.json({ count: 0, message: "no off-hours inquiries" });
  }

  const summary = (await summarizeWithClaude(items)) ??
    `야간 접수 ${items.length}건 — Claude 요약 미사용 (ANTHROPIC_API_KEY 미설정).`;

  const highlightLines = items.slice(0, 6).map((it) =>
    `• ${fmtHM(new Date(it.createdAt))} ${it.contactName} · ${it.inquiryType} · ${it.title.slice(0, 40)}`
  );

  const sendResult = await sendTelegramAlert({
    kind: "system",
    title: `🌙 야간 접수 브리핑 (${items.length}건)`,
    lines: [summary, "", ...highlightLines],
    url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/inquiries` : undefined,
  });

  return NextResponse.json({
    count: items.length,
    telegramSent: sendResult.ok,
    reason: sendResult.reason,
    summary,
  });
}
