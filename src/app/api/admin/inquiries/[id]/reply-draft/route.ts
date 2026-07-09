/**
 * VV1: 문의 → 첫 답변 초안 자동생성.
 *
 * POST /api/admin/inquiries/{id}/reply-draft
 * Response: { draft: string, model: string }
 *
 * Claude Haiku로 문의 내용 기반 첫 답장 초안 생성.
 * 문체: 친근+실무. 3~5줄. 다음 액션 명시.
 *
 * Feature flag: `reply_draft_auto`
 */

import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import { getRelatedBlogPosts } from "@/lib/services/blog-recommend-service";
import { getPromptVariant } from "@/lib/services/prompt-ab-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `당신은 ETHOS 행정사사무소의 사장 Jean입니다. 문의를 받고 첫 답장 초안을 씁니다.

원칙:
- 친근하지만 실무 중심. 존댓말.
- 3~5줄로 짧게.
- 첫 줄: 인사 + 문의 확인.
- 중간: 상황 이해했다는 짧은 확인 + 다음 액션 1개 (통화 예약 / 서류 요청 / 상세 상담 안내).
- 끝: 서명 없이 마무리 문장.
- 견적 금액 언급 금지. "안내드리겠습니다" 정도로.
- 마크다운 없음. 이모지 없음.`;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.reply-draft");
  if (!(await isFeatureEnabled("reply_draft_auto"))) {
    return api.error(403, "답장 초안 자동생성이 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  try {
    const { id } = await ctx.params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: {
        contactName: true,
        title: true,
        description: true,
        inquiryType: true,
        urgencyLevel: true,
      },
    });
    if (!inquiry) return api.error(404, "문의 없음", { code: "NOT_FOUND" });

    const prompt = `[문의자] ${inquiry.contactName ?? "고객님"}
[유형] ${inquiry.inquiryType}
[긴급도] ${inquiry.urgencyLevel}
[제목] ${inquiry.title}
[내용]
${inquiry.description}

위 문의에 대한 첫 답장 초안을 작성해주세요.`;

    // III2: reply_prompt_ab — 활성 시 프롬프트 A/B 변형 적용
    let systemPrompt = SYSTEM;
    let abVariantId: string | null = null;
    try {
      if (await isFeatureEnabled("reply_prompt_ab")) {
        const variant = getPromptVariant("reply_draft", id);
        if (variant) {
          systemPrompt = `${SYSTEM}\n\n${variant.systemSuffix}`;
          abVariantId = variant.id;
          try {
            logger.info(
              `[reply-draft.ab] taskType=reply_draft inquiryId=${id} variantId=${variant.id}`
            );
          } catch {
            /* best-effort */
          }
        }
      }
    } catch (flagErr) {
      logger.warn("[reply-draft] reply_prompt_ab flag check failed", flagErr);
    }

    // BBB2: 3버전 요청 지원 — ?variants=3
    const url = new URL(_req.url);
    const wantVariants = url.searchParams.get("variants") === "3"
      && (await isFeatureEnabled("reply_draft_variants").catch(() => false));

    if (wantVariants) {
      const variantSystem = `${systemPrompt}

이번에는 같은 문의에 대해 톤이 다른 3가지 버전을 작성합니다.
응답 형식 (구분자 정확히 유지, 다른 텍스트 금지):
===친근===
<친근하고 따뜻한 버전>
===공식===
<공식적이고 정중한 버전>
===실무===
<핵심만 간결한 실무 버전>`;
      const res = await smartInvoke("drafting", prompt, {
        system: variantSystem,
        maxTokens: 900,
      });
      const text = res.text ?? "";
      const pick = (label: string) => {
        const m = text.match(new RegExp(`===${label}===\\s*([\\s\\S]*?)(?====|$)`));
        return m?.[1]?.trim() ?? "";
      };
      const variants = {
        friendly: pick("친근"),
        formal: pick("공식"),
        practical: pick("실무"),
      };
      if (!variants.friendly && !variants.formal && !variants.practical) {
        return api.error(500, "파싱 실패", { code: "PARSE_FAILED" });
      }
      return api.ok({ variants, model: res.model, abVariantId });
    }

    const res = await smartInvoke("drafting", prompt, {
      system: systemPrompt,
      maxTokens: 400,
    });
    let draft = res.text?.trim() ?? "";
    if (!draft) return api.error(500, "빈 응답", { code: "EMPTY_RESPONSE" });

    if (await isFeatureEnabled("inquiry_blog_recommend").catch(() => false)) {
      const keywords = inquiry.title.split(/\s+/).filter((w) => w.length >= 2);
      const posts = await getRelatedBlogPosts(inquiry.inquiryType, keywords);
      if (posts.length > 0) {
        draft += "\n\n관련 글:\n" + posts.map((p) => `- ${p.title}: /blog/${p.slug}`).join("\n");
      }
    }

    return api.ok({ draft, model: res.model, abVariantId });
  } catch (err) {
    api.logError(err);
    return api.error(500, "초안 생성 실패", { code: "DRAFT_FAILED" });
  }
}
