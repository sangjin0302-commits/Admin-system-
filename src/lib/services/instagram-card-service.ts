/**
 * 인스타그램 카드뉴스 생성.
 *
 * 입력: sourceType (precedent|blog|news) + sourceId | 자유 텍스트
 * 산출: 5-10 슬라이드 SVG (1080x1080 정사각형) + 캡션 텍스트
 *
 * 브랜드: 네이비 배경 (#0B1B3B) + 골드 액센트 (#C9A24B)
 *
 * TODO(INSTAGRAM API): 인스타 비즈니스 계정 + Graph API 필요.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { callHaiku, saveSlideSvgs } from "@/lib/services/marketing-tts-helper";

export type InstagramSourceType = "precedent" | "blog" | "news";

export type InstagramCardBundle = {
  id: string;
  sourceType: InstagramSourceType | "custom";
  sourceId: string | null;
  title: string;
  caption: string;
  hashtags: string[];
  slides: { heading: string; body: string }[];
  slideUrls: string[];
  generatedAt: string;
};

const SYSTEM_PROMPT =
  "You design Korean Instagram card-news slides for an administrative-law firm. Output STRICT JSON only (no code fences): {\"title\":\"...\",\"caption\":\"...\",\"hashtags\":[\"#태그1\",\"#태그2\"],\"slides\":[{\"heading\":\"...\",\"body\":\"...\"}]}. Requirements: exactly 5-8 slides (1 cover + 3-6 content + 1 CTA to ETHOS 행정사사무소). heading max 20 chars, body max 80 chars. Caption 100-200 chars, plain Korean, one CTA line at end. 6-10 hashtags in Korean+English.";

export async function generateInstagramCards(input: {
  sourceType: InstagramSourceType | "custom";
  sourceId?: string;
  customText?: string;
}): Promise<
  | { ok: true; bundle: InstagramCardBundle }
  | { ok: false; reason: "SOURCE_NOT_FOUND" | "AI_UNAVAILABLE" | "MISSING_INPUT" }
> {
  const material = await resolveMaterial(input);
  if (!material) return { ok: false, reason: input.sourceType === "custom" ? "MISSING_INPUT" : "SOURCE_NOT_FOUND" };

  const raw = await callHaiku({ system: SYSTEM_PROMPT, user: material, maxTokens: 2500 });
  if (!raw) return { ok: false, reason: "AI_UNAVAILABLE" };
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { ok: false, reason: "AI_UNAVAILABLE" };
  let parsed: {
    title?: string;
    caption?: string;
    hashtags?: unknown;
    slides?: unknown;
  };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.warn("[instagram] JSON 파싱 실패", err);
    return { ok: false, reason: "AI_UNAVAILABLE" };
  }
  const slides = Array.isArray(parsed.slides)
    ? (parsed.slides as unknown[])
        .map((s) => {
          if (!s || typeof s !== "object") return null;
          const rec = s as Record<string, unknown>;
          const heading = typeof rec.heading === "string" ? rec.heading : "";
          const body = typeof rec.body === "string" ? rec.body : "";
          return heading ? { heading, body } : null;
        })
        .filter((s): s is { heading: string; body: string } => !!s)
    : [];
  if (slides.length === 0) return { ok: false, reason: "AI_UNAVAILABLE" };

  const hashtags = Array.isArray(parsed.hashtags)
    ? (parsed.hashtags as unknown[]).filter((h): h is string => typeof h === "string")
    : [];

  const id = `ig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const svgs = slides.map((s, i) => makeCardSvg(s, i, slides.length));
  const slideUrls = await saveSlideSvgs({ feature: "instagram", id, svgs });

  const bundle: InstagramCardBundle = {
    id,
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? null,
    title: typeof parsed.title === "string" ? parsed.title : slides[0].heading,
    caption: typeof parsed.caption === "string" ? parsed.caption : "",
    hashtags,
    slides,
    slideUrls,
    generatedAt: new Date().toISOString(),
  };

  await prisma.siteSetting.upsert({
    where: { key: `instagram.card.${id}` },
    create: { key: `instagram.card.${id}`, value: JSON.stringify(bundle) },
    update: { value: JSON.stringify(bundle) },
  });
  return { ok: true, bundle };
}

async function resolveMaterial(input: {
  sourceType: InstagramSourceType | "custom";
  sourceId?: string;
  customText?: string;
}): Promise<string | null> {
  if (input.sourceType === "custom") {
    if (!input.customText?.trim()) return null;
    return input.customText.trim().slice(0, 4000);
  }
  if (!input.sourceId) return null;
  if (input.sourceType === "blog") {
    const post = await prisma.blogPost.findUnique({
      where: { id: input.sourceId },
      select: { title: true, body: true, excerpt: true },
    });
    if (!post) return null;
    return `제목: ${post.title}\n요약: ${post.excerpt}\n본문:\n${post.body
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 3000)}`;
  }
  if (input.sourceType === "precedent") {
    // 판례 모델은 프로젝트마다 다를 수 있어 optional. Precedent 없으면 SiteSetting 기반 요약 시도.
    const setting = await prisma.siteSetting.findUnique({
      where: { key: `precedent.summary.${input.sourceId}` },
    });
    if (setting?.value) return setting.value.slice(0, 3000);
    return null;
  }
  if (input.sourceType === "news") {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: `podcast.news.recent` },
    });
    if (!setting?.value) return null;
    try {
      const arr = JSON.parse(setting.value) as string[];
      return `법률 뉴스 헤드라인:\n${arr.join("\n")}`;
    } catch {
      return null;
    }
  }
  return null;
}

function makeCardSvg(slide: { heading: string; body: string }, index: number, total: number): string {
  const isCover = index === 0;
  const isCta = index === total - 1;
  const heading = escapeXml(slide.heading);
  const body = escapeXml(slide.body);
  const accent = isCover || isCta ? "#C9A24B" : "#F5EFE0";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <rect width="1080" height="1080" fill="#0B1B3B"/>
  <rect x="0" y="0" width="1080" height="12" fill="#C9A24B"/>
  <rect x="0" y="1068" width="1080" height="12" fill="#C9A24B"/>
  <text x="80" y="140" fill="#C9A24B" font-size="26" font-family="'Noto Sans KR', sans-serif">ETHOS 행정사사무소</text>
  <text x="80" y="${isCover ? 520 : 300}" fill="${accent}" font-size="${isCover ? 84 : 60}" font-weight="700" font-family="'Noto Sans KR', sans-serif">${heading}</text>
  ${wrapBody(body, 80, isCover ? 640 : 420)}
  <text x="80" y="1000" fill="#C9A24B" font-size="22" font-family="'Noto Sans KR', sans-serif">${index + 1} / ${total}</text>
  ${isCta ? `<text x="80" y="920" fill="#C9A24B" font-size="30" font-family="'Noto Sans KR', sans-serif">ethos-admin.kr · 상담 예약</text>` : ""}
</svg>`;
}

function wrapBody(text: string, x: number, y: number, maxCharsPerLine = 22): string {
  const words = text.split(/(?<=[.!?。])\s+|\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxCharsPerLine) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines
    .slice(0, 5)
    .map(
      (l, i) =>
        `<text x="${x}" y="${y + i * 60}" fill="#F5EFE0" font-size="38" font-family="'Noto Sans KR', sans-serif">${l}</text>`,
    )
    .join("");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function listRecentInstagramBundles(limit = 20): Promise<InstagramCardBundle[]> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "instagram.card." } },
    orderBy: { key: "desc" },
    take: limit,
  });
  const out: InstagramCardBundle[] = [];
  for (const r of rows) {
    try {
      out.push(JSON.parse(r.value) as InstagramCardBundle);
    } catch {
      /* skip */
    }
  }
  return out;
}
