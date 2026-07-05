/**
 * 유튜브 자동 컨텐츠 생성.
 *
 * 입력: BlogPost id
 * 산출:
 *   1) 5-8분 스크립트 (Haiku)
 *   2) 섹션별 슬라이드 텍스트
 *   3) TTS mp3 (OPENAI_API_KEY 있으면)
 *   4) 슬라이드 SVG (네이비/골드 브랜드)
 *
 * 저장: SiteSetting `youtube.bundle.{blogPostId}` = JSON YoutubeBundle
 * 파일: public/generated/youtube/{blogPostId}.mp3, {blogPostId}/{n}.svg
 *
 * TODO(YOUTUBE UPLOAD): 유튜브 데이터 API v3 (OAuth2) 자동 업로드는 별도.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { callHaiku, saveSlideSvgs, synthesizeMp3 } from "@/lib/services/marketing-tts-helper";

const BUNDLE_PREFIX = "youtube.bundle.";

export type YoutubeSection = {
  heading: string;
  bullets: string[];
  narration: string;
};

export type YoutubeBundle = {
  blogPostId: string;
  title: string;
  script: string;
  sections: YoutubeSection[];
  audioUrl: string | null;
  slideUrls: string[];
  generatedAt: string;
  tts: "openai" | "none";
};

const SYSTEM_PROMPT =
  "You convert Korean legal/administrative blog posts into YouTube video scripts. Output STRICT JSON only (no code fences): {\"sections\":[{\"heading\":\"...\",\"bullets\":[\"...\",\"...\"],\"narration\":\"...\"}]}. Requirements: 5-8 sections, each narration 60-100 Korean characters spoken naturally, bullets are short slide points (max 6 words), total spoken length ~5-8 minutes. Include a cover section (heading = video title) and a closing CTA section pointing to ETHOS 행정사사무소.";

function bundleKey(blogPostId: string): string {
  return `${BUNDLE_PREFIX}${blogPostId}`;
}

function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeSlideSvg(section: YoutubeSection, index: number, total: number): string {
  const isCover = index === 0;
  const bullets = section.bullets
    .slice(0, 6)
    .map(
      (b, i) =>
        `<text x="120" y="${300 + i * 60}" fill="#F5EFE0" font-size="34" font-family="'Noto Sans KR', sans-serif">• ${escapeXml(
          b,
        )}</text>`,
    )
    .join("");
  const heading = escapeXml(section.heading);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <rect width="1920" height="1080" fill="#0B1B3B"/>
  <rect x="0" y="0" width="1920" height="14" fill="#C9A24B"/>
  <text x="120" y="180" fill="#C9A24B" font-size="28" font-family="'Noto Sans KR', sans-serif">ETHOS 행정사사무소</text>
  <text x="120" y="${isCover ? 500 : 230}" fill="#F5EFE0" font-size="${isCover ? 96 : 56}" font-weight="700" font-family="'Noto Sans KR', sans-serif">${heading}</text>
  ${isCover ? "" : bullets}
  <text x="120" y="1020" fill="#C9A24B" font-size="24" font-family="'Noto Sans KR', sans-serif">${index + 1} / ${total}</text>
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

async function generateSections(title: string, body: string): Promise<YoutubeSection[] | null> {
  const user = `제목: ${title}\n\n본문:\n${stripHtml(body).slice(0, 6000)}`;
  const raw = await callHaiku({ system: SYSTEM_PROMPT, user, maxTokens: 3000 });
  if (!raw) return null;
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]) as { sections?: unknown };
    if (!Array.isArray(parsed.sections)) return null;
    const sections: YoutubeSection[] = [];
    for (const s of parsed.sections) {
      if (!s || typeof s !== "object") continue;
      const rec = s as Record<string, unknown>;
      const heading = typeof rec.heading === "string" ? rec.heading : "";
      const narration = typeof rec.narration === "string" ? rec.narration : "";
      const bullets = Array.isArray(rec.bullets)
        ? (rec.bullets as unknown[]).filter((b): b is string => typeof b === "string")
        : [];
      if (heading && narration) sections.push({ heading, bullets, narration });
    }
    return sections.length ? sections : null;
  } catch (err) {
    logger.warn("[youtube] JSON 파싱 실패", err);
    return null;
  }
}

export async function generateYoutubeBundle(
  blogPostId: string,
  opts?: { force?: boolean },
): Promise<
  | { ok: true; bundle: YoutubeBundle }
  | { ok: false; reason: "POST_NOT_FOUND" | "AI_UNAVAILABLE" }
> {
  if (!opts?.force) {
    const existing = await getYoutubeBundle(blogPostId);
    if (existing) return { ok: true, bundle: existing };
  }
  const post = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
    select: { id: true, title: true, body: true },
  });
  if (!post) return { ok: false, reason: "POST_NOT_FOUND" };

  const sections = await generateSections(post.title, post.body);
  if (!sections) return { ok: false, reason: "AI_UNAVAILABLE" };

  const script = sections.map((s) => `[${s.heading}] ${s.narration}`).join("\n\n");
  const svgs = sections.map((s, i) => makeSlideSvg(s, i, sections.length));
  const slideUrls = await saveSlideSvgs({ feature: "youtube", id: blogPostId, svgs });
  const ttsText = sections.map((s) => s.narration).join(" ");
  const tts = await synthesizeMp3({ feature: "youtube", id: blogPostId, text: ttsText });

  const bundle: YoutubeBundle = {
    blogPostId,
    title: post.title,
    script,
    sections,
    audioUrl: tts.audioUrl,
    slideUrls,
    generatedAt: new Date().toISOString(),
    tts: tts.audioUrl ? "openai" : "none",
  };

  await prisma.siteSetting.upsert({
    where: { key: bundleKey(blogPostId) },
    create: { key: bundleKey(blogPostId), value: JSON.stringify(bundle) },
    update: { value: JSON.stringify(bundle) },
  });
  return { ok: true, bundle };
}

export async function getYoutubeBundle(blogPostId: string): Promise<YoutubeBundle | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: bundleKey(blogPostId) } });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as YoutubeBundle;
  } catch {
    return null;
  }
}

export async function listBlogPostsForYoutube(): Promise<
  { id: string; title: string; publishedAt: Date | null; hasBundle: boolean }[]
> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { id: true, title: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: posts.map((p) => bundleKey(p.id)) } },
    select: { key: true },
  });
  const bundled = new Set(rows.map((r) => r.key));
  return posts.map((p) => ({ ...p, hasBundle: bundled.has(bundleKey(p.id)) }));
}
