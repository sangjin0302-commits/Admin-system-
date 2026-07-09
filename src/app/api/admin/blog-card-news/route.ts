import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.blog-card-news");
  if (!(await isFeatureEnabled("blog_to_card_news"))) {
    return api.error(403, "카드뉴스 생성 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { blogId?: string };
    if (!body.blogId) return api.error(400, "blogId 필수", { code: "INVALID_INPUT" });

    const post = await prisma.blogPost.findUnique({ where: { id: body.blogId } });
    if (!post) return api.error(404, "블로그 글 없음", { code: "NOT_FOUND" });

    const content = post.body.slice(0, 3000);
    const system = `당신은 카드뉴스 콘텐츠 기획 전문가입니다.
주어진 블로그 글에서 핵심 포인트 4~5개를 추출해 카드뉴스 슬라이드로 구성하세요.

출력 형식 (JSON만 출력, 설명 금지):
{"slides":[{"slideNumber":1,"title":"슬라이드 제목","body":"본문 2~3줄"}]}

원칙:
- 각 슬라이드는 독립적으로 이해 가능해야 함
- 첫 슬라이드는 전체 주제 요약 (타이틀 카드)
- 마지막 슬라이드는 CTA (문의/상담 유도)
- 한국어, 쉽고 간결한 표현`;

    const res = await smartInvoke("summarize", content, { system, maxTokens: 1000 });
    const text = res.text?.trim() ?? "";

    let slides: { slideNumber: number; title: string; body: string }[];
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] ?? text);
      slides = parsed.slides;
    } catch {
      return api.error(500, "슬라이드 파싱 실패", { code: "PARSE_FAILED" });
    }

    return api.ok({ ok: true, slides, model: res.model });
  } catch (err) {
    api.logError(err);
    return api.error(500, "카드뉴스 생성 실패", { code: "CARD_NEWS_FAILED" });
  }
}
