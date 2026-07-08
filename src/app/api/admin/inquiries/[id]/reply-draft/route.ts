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

    const res = await smartInvoke("drafting", prompt, {
      system: SYSTEM,
      maxTokens: 400,
    });
    const draft = res.text?.trim() ?? "";
    if (!draft) return api.error(500, "빈 응답", { code: "EMPTY_RESPONSE" });

    return api.ok({ draft, model: res.model });
  } catch (err) {
    api.logError(err);
    return api.error(500, "초안 생성 실패", { code: "DRAFT_FAILED" });
  }
}
