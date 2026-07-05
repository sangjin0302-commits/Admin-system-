/**
 * 틱톡/쇼츠 30초 세로영상 (9:16) 자동 생성.
 *
 * 입력: topic (자유 텍스트) 또는 auto (최근 문의/Q&A 에서 자동 선택)
 * 산출: 30초 스크립트 + TTS + 3-5장 세로형 슬라이드 SVG (1080x1920)
 */

import { prisma } from "@/lib/prisma/client";
import { callHaiku, saveSlideSvgs, synthesizeMp3 } from "@/lib/services/marketing-tts-helper";
import { logger } from "@/lib/utils/logger";

export type ShortVideoBundle = {
  id: string;
  topic: string;
  script: string;
  captions: string[];
  audioUrl: string | null;
  slideUrls: string[];
  generatedAt: string;
  tts: "openai" | "none";
};

const SYSTEM_PROMPT =
  "You write 30-second Korean short-form video scripts for TikTok/YouTube Shorts about administrative law. Output STRICT JSON only (no code fences): {\"script\":\"...\",\"captions\":[\"...\",\"...\"]}. script is 60-80 Korean characters (about 30 seconds spoken). captions is an array of 3-5 short slide captions (max 12 chars each) shown as text overlays. Punchy hook first sentence. End with CTA: ETHOS 행정사사무소.";

export async function generateShortVideo(input: { topic?: string }): Promise<
  | { ok: true; bundle: ShortVideoBundle }
  | { ok: false; reason: "NO_TOPIC" | "AI_UNAVAILABLE" }
> {
  const topic = input.topic?.trim() || (await autoPickTopic());
  if (!topic) return { ok: false, reason: "NO_TOPIC" };

  const raw = await callHaiku({
    system: SYSTEM_PROMPT,
    user: `주제: ${topic}`,
    maxTokens: 800,
  });
  if (!raw) return { ok: false, reason: "AI_UNAVAILABLE" };
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { ok: false, reason: "AI_UNAVAILABLE" };
  let parsed: { script?: unknown; captions?: unknown };
  try {
    parsed = JSON.parse(m[0]);
  } catch (err) {
    logger.warn("[shorts] JSON 파싱 실패", err);
    return { ok: false, reason: "AI_UNAVAILABLE" };
  }
  const script = typeof parsed.script === "string" ? parsed.script : "";
  const captions = Array.isArray(parsed.captions)
    ? (parsed.captions as unknown[]).filter((c): c is string => typeof c === "string")
    : [];
  if (!script || captions.length === 0) return { ok: false, reason: "AI_UNAVAILABLE" };

  const id = `short_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const svgs = captions.map((c, i) => makeVerticalSlide(c, i, captions.length));
  const slideUrls = await saveSlideSvgs({ feature: "shorts", id, svgs });
  const tts = await synthesizeMp3({ feature: "shorts", id, text: script });

  const bundle: ShortVideoBundle = {
    id,
    topic,
    script,
    captions,
    audioUrl: tts.audioUrl,
    slideUrls,
    generatedAt: new Date().toISOString(),
    tts: tts.audioUrl ? "openai" : "none",
  };
  await prisma.siteSetting.upsert({
    where: { key: `shorts.bundle.${id}` },
    create: { key: `shorts.bundle.${id}`, value: JSON.stringify(bundle) },
    update: { value: JSON.stringify(bundle) },
  });
  return { ok: true, bundle };
}

async function autoPickTopic(): Promise<string | null> {
  // 최근 문의 카테고리·질문에서 자동 픽업
  try {
    const recent = await prisma.inquiry.findFirst({
      orderBy: { createdAt: "desc" },
      select: { title: true, description: true, inquiryType: true },
    });
    if (!recent) return null;
    return (
      recent.title?.trim() ||
      recent.inquiryType?.toString() ||
      recent.description?.slice(0, 60) ||
      null
    );
  } catch {
    return null;
  }
}

function makeVerticalSlide(caption: string, index: number, total: number): string {
  const text = escapeXml(caption);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bg${index}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B1B3B"/>
      <stop offset="100%" stop-color="#1A2E5C"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg${index})"/>
  <rect x="0" y="0" width="1080" height="18" fill="#C9A24B"/>
  <rect x="0" y="1902" width="1080" height="18" fill="#C9A24B"/>
  <text x="540" y="120" fill="#C9A24B" font-size="34" font-family="'Noto Sans KR', sans-serif" text-anchor="middle">ETHOS 행정사</text>
  <text x="540" y="960" fill="#F5EFE0" font-size="110" font-weight="800" font-family="'Noto Sans KR', sans-serif" text-anchor="middle">${text}</text>
  <text x="540" y="1820" fill="#C9A24B" font-size="30" font-family="'Noto Sans KR', sans-serif" text-anchor="middle">${index + 1} / ${total}</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function listRecentShortVideos(limit = 20): Promise<ShortVideoBundle[]> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "shorts.bundle." } },
    orderBy: { key: "desc" },
    take: limit,
  });
  const out: ShortVideoBundle[] = [];
  for (const r of rows) {
    try {
      out.push(JSON.parse(r.value) as ShortVideoBundle);
    } catch {
      /* skip */
    }
  }
  return out;
}
