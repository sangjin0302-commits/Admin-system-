import { z } from "zod";

import { createAdminRequestContext, safeReadJsonBody, firstZodMessage } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  listQuestions,
  answerQuestion,
  moderateQuestion,
  isValidStatus,
  getQuestion,
} from "@/lib/services/community-service";
import { prisma } from "@/lib/prisma/client";
import { assertBlogCreateAllowed, BlogContentPolicyError } from "@/lib/services/blog-content-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.community.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1") || 1;

  try {
    const result = await listQuestions({
      status: isValidStatus(status) ? status : undefined,
      page,
      perPage: 30,
    });
    return api.ok({ ok: true, ...result });
  } catch (err) {
    api.logError(err);
    return api.error(500, "질문 목록 조회 실패", { code: "COMMUNITY_LIST_FAILED" });
  }
}

const AnswerSchema = z.object({
  action: z.literal("answer"),
  id: z.string().min(1),
  answer: z.string().min(1),
});

const ModerateSchema = z.object({
  action: z.literal("moderate"),
  id: z.string().min(1),
  status: z.string().min(1),
});

const PromoteSchema = z.object({
  action: z.literal("promote"),
  id: z.string().min(1),
});

const BodySchema = z.discriminatedUnion("action", [AnswerSchema, ModerateSchema, PromoteSchema]);

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
  return base || `qna-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.community.action");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const parsed = await safeReadJsonBody(req);
  if (!parsed.ok) return api.error(400, "잘못된 요청 본문", { code: "INVALID_JSON" });
  const validation = BodySchema.safeParse(parsed.body);
  if (!validation.success) {
    return api.error(400, firstZodMessage(validation.error, "잘못된 입력"), { code: "INVALID_INPUT" });
  }

  try {
    if (validation.data.action === "answer") {
      const updated = await answerQuestion({
        id: validation.data.id,
        answer: validation.data.answer,
        answeredBy: "ETHOS 행정사사무소",
      });
      if (!updated) return api.error(404, "질문을 찾을 수 없습니다", { code: "NOT_FOUND" });
      return api.ok({ ok: true, item: updated });
    }
    if (validation.data.action === "moderate") {
      if (!isValidStatus(validation.data.status)) {
        return api.error(400, "잘못된 상태", { code: "INVALID_STATUS" });
      }
      const updated = await moderateQuestion(validation.data.id, validation.data.status);
      if (!updated) return api.error(404, "질문을 찾을 수 없습니다", { code: "NOT_FOUND" });
      return api.ok({ ok: true, item: updated });
    }
    if (validation.data.action === "promote") {
      const q = await getQuestion(validation.data.id);
      if (!q) return api.error(404, "질문을 찾을 수 없습니다", { code: "NOT_FOUND" });
      if (q.status !== "ANSWERED" || !q.answer) {
        return api.error(400, "답변된 질문만 승격할 수 있습니다", { code: "NOT_ANSWERED" });
      }
      let slug = slugify(q.title);
      // Ensure uniqueness
      let suffix = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
        const existing = await prisma.blogPost
          .findUnique({ where: { slug: candidate } })
          .catch(() => null);
        if (!existing) {
          slug = candidate;
          break;
        }
        suffix += 1;
        if (suffix > 20) break;
      }
      // 정책: 네이버 수입글 외 임의 생성 차단.
      try {
        assertBlogCreateAllowed(undefined);
      } catch (e) {
        if (e instanceof BlogContentPolicyError) {
          return api.error(403, e.message, { code: e.code });
        }
        throw e;
      }
      const post = await prisma.blogPost.create({
        data: {
          slug,
          title: q.title,
          excerpt: q.body.slice(0, 200),
          body: `<h3>질문</h3>\n<p>${escapeHtml(q.body)}</p>\n<h3>답변</h3>\n${q.answer}`,
          category: q.category,
          published: false, // draft
        },
      });
      return api.ok({ ok: true, blogPostId: post.id, slug: post.slug });
    }
    return api.error(400, "알 수 없는 액션", { code: "UNKNOWN_ACTION" });
  } catch (err) {
    api.logError(err);
    return api.error(500, "처리 실패", { code: "COMMUNITY_ACTION_FAILED" });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
