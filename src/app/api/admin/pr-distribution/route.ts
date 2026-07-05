import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { prisma } from "@/lib/prisma/client";
import {
  getSyndication,
  syndicatePost,
  markChannelPosted,
  CHANNEL_ORDER,
  type SyndicationChannel,
} from "@/lib/services/pr-syndication-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_CHANNELS = new Set<SyndicationChannel>(CHANNEL_ORDER);

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.pr.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: {
        id: true,
        slug: true,
        title: true,
        publishedAt: true,
        category: true,
      },
    });
    const records = await Promise.all(posts.map((p) => getSyndication(p.id)));
    return api.ok({
      ok: true,
      items: posts.map((p, i) => ({ post: p, syndication: records[i] })),
    });
  } catch (err) {
    api.logError(err);
    return api.error(500, "목록 조회 실패", { code: "PR_LIST_FAILED" });
  }
}

const RegenerateSchema = z.object({
  action: z.literal("regenerate"),
  postId: z.string().min(1),
});
const MarkPostedSchema = z.object({
  action: z.literal("mark_posted"),
  postId: z.string().min(1),
  channel: z.string().min(1),
});
const BodySchema = z.discriminatedUnion("action", [RegenerateSchema, MarkPostedSchema]);

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.pr.action");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = BodySchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    if (validation.data.action === "regenerate") {
      const post = await prisma.blogPost.findUnique({ where: { id: validation.data.postId } });
      if (!post) return api.error(404, "블로그 글을 찾을 수 없습니다", { code: "NOT_FOUND" });
      const record = await syndicatePost({
        postId: post.id,
        slug: post.slug,
        title: post.title,
        body: post.body,
      });
      return api.ok({ ok: true, record });
    }
    if (validation.data.action === "mark_posted") {
      const channel = validation.data.channel as SyndicationChannel;
      if (!VALID_CHANNELS.has(channel)) {
        return api.error(400, "잘못된 채널", { code: "INVALID_CHANNEL" });
      }
      const record = await markChannelPosted(validation.data.postId, channel);
      if (!record) return api.error(404, "배포 기록을 찾을 수 없습니다", { code: "NOT_FOUND" });
      return api.ok({ ok: true, record });
    }
    return api.error(400, "알 수 없는 액션", { code: "UNKNOWN_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "처리 실패", { code: "PR_ACTION_FAILED" });
  }
}
