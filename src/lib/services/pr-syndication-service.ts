/**
 * PR 자동 배포 (블로그 → 다채널 톤 어댑테이션).
 *
 * 지원 채널: 네이버 블로그, 페이스북, 링크드인, 텔레그램.
 * OAuth 자동 게시는 향후 구현 (TODO). 현재는 Claude Haiku 로 채널별 문안을
 * 생성 → 어드민 UI 에서 미리보기 & 수동 복사.
 *
 * 결과 저장: SiteSetting key = "pr.syndication.{postId}", value = JSON(SyndicationRecord)
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export type SyndicationChannel = "naver" | "facebook" | "linkedin" | "telegram";

export const CHANNEL_LABEL: Record<SyndicationChannel, string> = {
  naver: "네이버 블로그",
  facebook: "페이스북 페이지",
  linkedin: "링크드인",
  telegram: "Telegram 채널",
};

export const CHANNEL_ORDER: SyndicationChannel[] = ["naver", "facebook", "linkedin", "telegram"];

const CHANNEL_PROMPTS: Record<SyndicationChannel, string> = {
  naver:
    "네이버 블로그 스타일로 재작성. 친근한 존댓말, 소제목·이모지 활용, 800~1200자. 첫 줄에 후킹 문장. 실무 팁 3개 포함. 마지막에 '자세한 상담은 ETHOS 행정사사무소로 문의' 안내.",
  facebook:
    "페이스북 페이지 포스트 스타일. 300~500자, 이모지 2~4개, 첫 줄 후킹, 마지막에 CTA 링크 안내. 해시태그 3~5개 마지막에.",
  linkedin:
    "링크드인 프로페셔널 톤. 300~500자, 이모지 최소화, 인사이트 중심. 통찰·실무 관점·업계 트렌드. 마지막 한 줄 CTA.",
  telegram:
    "Telegram 채널 공지 스타일. 150~250자, 핵심 요약만, 이모지 1~2개, 마지막에 링크. MarkdownV2 특수문자는 이스케이프 없이 일반 텍스트로.",
};

export type SyndicationChannelOutput = {
  channel: SyndicationChannel;
  text: string;
  generatedAt: string;
  posted?: boolean;
  postedAt?: string;
};

export type SyndicationRecord = {
  postId: string;
  slug: string;
  title: string;
  channels: SyndicationChannelOutput[];
  updatedAt: string;
};

function siteSettingKey(postId: string): string {
  return `pr.syndication.${postId}`;
}

export async function getSyndication(postId: string): Promise<SyndicationRecord | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: siteSettingKey(postId) } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as SyndicationRecord;
    return parsed;
  } catch (err) {
    logger.warn("[pr-syndication] read failed", err);
    return null;
  }
}

async function saveSyndication(record: SyndicationRecord): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: siteSettingKey(record.postId) },
    create: { key: siteSettingKey(record.postId), value: JSON.stringify(record) },
    update: { value: JSON.stringify(record) },
  });
}

async function adaptForChannel(
  channel: SyndicationChannel,
  title: string,
  body: string,
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    logger.warn("[pr-syndication] ANTHROPIC_API_KEY not set — returning fallback");
    return fallbackAdaptation(channel, title, body);
  }

  const plainBody = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
  const userMsg = `제목: ${title}\n\n본문:\n${plainBody}\n\n위 블로그 글을 아래 지침에 맞춰 재구성해줘.\n지침: ${CHANNEL_PROMPTS[channel]}\n\n출력: 재구성된 텍스트만. 설명이나 안내 문구 없이.`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system:
          "You adapt Korean legal/administrative blog posts into channel-specific promotional text. Output ONLY the adapted text — no preface, no JSON, no markdown fences.",
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) {
      logger.warn("[pr-syndication] anthropic error", res.status);
      return fallbackAdaptation(channel, title, body);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim();
    if (!text) return fallbackAdaptation(channel, title, body);
    return text.slice(0, 4000);
  } catch (err) {
    logger.warn("[pr-syndication] exception", err);
    return fallbackAdaptation(channel, title, body);
  }
}

function fallbackAdaptation(channel: SyndicationChannel, title: string, body: string): string {
  const plain = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const excerpt = plain.slice(0, 300);
  switch (channel) {
    case "naver":
      return `[${title}]\n\n${excerpt}...\n\n자세한 내용은 ETHOS 행정사사무소 블로그에서 확인하실 수 있습니다.`;
    case "facebook":
      return `📢 ${title}\n\n${excerpt.slice(0, 240)}...\n\n#행정사 #ETHOS #비자 #행정심판`;
    case "linkedin":
      return `${title}\n\n${excerpt.slice(0, 300)}...\n\n실무 관점의 자세한 분석은 ETHOS 블로그에서 확인하실 수 있습니다.`;
    case "telegram":
      return `📰 ${title}\n\n${excerpt.slice(0, 180)}...`;
  }
}

export async function syndicatePost(input: {
  postId: string;
  slug: string;
  title: string;
  body: string;
  channels?: SyndicationChannel[];
}): Promise<SyndicationRecord> {
  const channels = input.channels ?? CHANNEL_ORDER;
  const outputs: SyndicationChannelOutput[] = [];
  for (const ch of channels) {
    const text = await adaptForChannel(ch, input.title, input.body);
    outputs.push({
      channel: ch,
      text: text ?? "",
      generatedAt: new Date().toISOString(),
      posted: false,
    });
  }
  const record: SyndicationRecord = {
    postId: input.postId,
    slug: input.slug,
    title: input.title,
    channels: outputs,
    updatedAt: new Date().toISOString(),
  };
  await saveSyndication(record);
  return record;
}

/**
 * 블로그 발행 훅. feature flag "pr_syndication" 이 켜져 있을 때만 실행.
 * 실패해도 발행 흐름은 막지 않도록 예외를 삼킴.
 */
export async function onBlogPublished(postId: string): Promise<void> {
  try {
    const { isFeatureEnabled } = await import("@/lib/services/feature-flags-service");
    if (!(await isFeatureEnabled("pr_syndication"))) return;
    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post || !post.published) return;
    await syndicatePost({
      postId: post.id,
      slug: post.slug,
      title: post.title,
      body: post.body,
    });
  } catch (err) {
    logger.warn("[pr-syndication] onBlogPublished failed", err);
  }
}

export async function markChannelPosted(
  postId: string,
  channel: SyndicationChannel,
): Promise<SyndicationRecord | null> {
  const record = await getSyndication(postId);
  if (!record) return null;
  const idx = record.channels.findIndex((c) => c.channel === channel);
  if (idx < 0) return null;
  record.channels[idx] = {
    ...record.channels[idx],
    posted: true,
    postedAt: new Date().toISOString(),
  };
  record.updatedAt = new Date().toISOString();
  await saveSyndication(record);
  return record;
}
