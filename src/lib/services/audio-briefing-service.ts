/**
 * 자동 아침 오디오 브리핑.
 *
 * 1) 오늘의 브리핑 텍스트 컴파일:
 *    - 오늘 마감 사건
 *    - 최근 24시간 미응답
 *    - 신규 의뢰
 *    - 최근 30일 수임률
 * 2) OPENAI_API_KEY 있으면 TTS → mp3 → public/briefing/{date}.mp3 저장
 * 3) 없으면 텍스트만 반환 ("TTS not configured")
 *
 * 아카이브: SiteSetting `briefing.audio.{yyyy-mm-dd}` = JSON { audioUrl, text, generatedAt }
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { promises as fs } from "fs";
import path from "path";

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_MODEL = process.env.OPENAI_TTS_MODEL?.trim() || "tts-1";
const OPENAI_VOICE = process.env.OPENAI_TTS_VOICE?.trim() || "alloy";
const ARCHIVE_KEY_PREFIX = "briefing.audio.";

export type BriefingRecord = {
  date: string; // yyyy-mm-dd
  text: string;
  audioUrl: string | null;
  tts: "openai" | "none";
  generatedAt: string;
  stats: {
    dueToday: number;
    unresponded24h: number;
    newInquiries: number;
    acceptanceRate: number;
  };
};

function todayKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

function archiveKey(date: string): string {
  return `${ARCHIVE_KEY_PREFIX}${date}`;
}

async function compileText(): Promise<{ text: string; stats: BriefingRecord["stats"] }> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 3600 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [dueToday, unresponded, newInquiries, closedRecent, wonRecent] = await Promise.all([
    prisma.inquiry.count({
      where: {
        dueDate: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["WON", "CLOSED"] },
      },
    }),
    prisma.inquiry.count({
      where: {
        status: "WAITING_CONSULTATION",
        updatedAt: { lte: twentyFourHoursAgo },
      },
    }),
    prisma.inquiry.count({ where: { createdAt: { gte: yesterday } } }),
    prisma.inquiry.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ["WON", "CLOSED"] },
      },
    }),
    prisma.inquiry.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: "WON",
      },
    }),
  ]);

  const acceptanceRate =
    closedRecent > 0 ? Math.round((wonRecent / closedRecent) * 100) : 0;

  const dateLabel = todayStart.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const text = [
    `안녕하세요. ${dateLabel} 아침 브리핑입니다.`,
    `오늘 마감 예정인 사건은 ${dueToday}건입니다.`,
    `24시간 이상 응답이 없는 상담 요청은 ${unresponded}건 있습니다.`,
    `지난 24시간 동안 신규 의뢰가 ${newInquiries}건 접수되었습니다.`,
    `최근 30일 수임률은 ${acceptanceRate}퍼센트 입니다.`,
    `오늘도 좋은 하루 되세요.`,
  ].join(" ");

  return {
    text,
    stats: {
      dueToday,
      unresponded24h: unresponded,
      newInquiries,
      acceptanceRate,
    },
  };
}

async function synthesizeTts(text: string, date: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        voice: OPENAI_VOICE,
        input: text,
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      logger.warn("[audio-briefing] OpenAI TTS 실패", { status: res.status });
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "briefing");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${date}.mp3`);
    await fs.writeFile(file, buf);
    return `/briefing/${date}.mp3`;
  } catch (err) {
    logger.warn("[audio-briefing] TTS 예외", err);
    return null;
  }
}

async function saveRecord(record: BriefingRecord): Promise<void> {
  const key = archiveKey(record.date);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(record) },
    update: { value: JSON.stringify(record) },
  });
}

/** 오늘 (KST) 의 브리핑을 생성/재생성. */
export async function generateBriefing(date?: string, force = false): Promise<BriefingRecord> {
  const targetDate = date ?? todayKst();

  if (!force) {
    const existing = await getBriefingRecord(targetDate);
    if (existing) return existing;
  }

  const { text, stats } = await compileText();
  const audioUrl = await synthesizeTts(text, targetDate);
  const record: BriefingRecord = {
    date: targetDate,
    text,
    audioUrl,
    tts: audioUrl ? "openai" : "none",
    generatedAt: new Date().toISOString(),
    stats,
  };
  await saveRecord(record);
  return record;
}

export async function getBriefingRecord(date: string): Promise<BriefingRecord | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: archiveKey(date) } });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as BriefingRecord;
  } catch {
    return null;
  }
}

/** 최근 N일의 아카이브 (오늘 포함). */
export async function listRecentBriefings(days = 7): Promise<BriefingRecord[]> {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() + 9 * 3600 * 1000 - i * 24 * 3600 * 1000);
    dates.push(d.toISOString().slice(0, 10));
  }
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: dates.map(archiveKey) } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value] as const));
  const out: BriefingRecord[] = [];
  for (const date of dates) {
    const v = map.get(archiveKey(date));
    if (!v) continue;
    try {
      out.push(JSON.parse(v) as BriefingRecord);
    } catch {
      /* skip */
    }
  }
  return out;
}

export function briefingTodayKst(): string {
  return todayKst();
}
