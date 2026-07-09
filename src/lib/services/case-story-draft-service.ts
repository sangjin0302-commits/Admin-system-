import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { smartInvoke } from "@/lib/services/smart-ai-client";

function stripPII(text: string): string {
  if (!text) return "";
  return text
    .replace(/\d{4}[가-힣]{1,3}\d{2,7}/g, "[사건번호]")
    .replace(/\d{6}[-\s]?\d{7}/g, "[주민번호]")
    .replace(/\b[A-Z]{1,2}\d{7,9}\b/g, "[여권번호]")
    .replace(/\b0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}\b/g, "[전화]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[이메일]")
    .replace(/[가-힣A-Za-z0-9]+\s*(주식회사|㈜|\(주\)|주식|유한회사)/g, "[회사]")
    .replace(/[가-힣]{2,4}(씨|님|고객|의뢰인|대표)/g, "[의뢰인]");
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) + "-" + Date.now().toString(36);
}

export async function generateCaseStoryDraft(caseId: string): Promise<{ blogPostId: string } | null> {
  if (!(await isFeatureEnabled("case_close_story_draft"))) return null;

  try {
    const caseMatter = await prisma.caseMatter.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        title: true,
        matterType: true,
        category: true,
        summary: true,
        inquiry: {
          select: {
            title: true,
            description: true,
            inquiryType: true,
          },
        },
      },
    });

    if (!caseMatter) {
      logger.warn("[case-story-draft] CaseMatter not found", { caseId });
      return null;
    }

    const anonymizedSummary = stripPII(caseMatter.summary ?? "");
    const anonymizedInquiry = stripPII(caseMatter.inquiry?.description ?? "");

    const prompt = `다음 행정사 사건 정보를 바탕으로 500단어 분량의 사례 연구를 한국어로 작성하세요.
모든 개인정보(이름, 회사, 연락처 등)는 이미 제거되었습니다. 남아있다면 "의뢰인", "A사" 등으로 치환하세요.

[사건유형] ${caseMatter.matterType}
[카테고리] ${caseMatter.category}
[제목] ${stripPII(caseMatter.title)}
[요약] ${anonymizedSummary}
[원래 문의유형] ${caseMatter.inquiry?.inquiryType ?? "N/A"}
[원래 문의내용] ${anonymizedInquiry}

구성:
1. 상황 (의뢰 배경)
2. 과제 (핵심 쟁점)
3. 해결 과정 (ETHOS의 접근)
4. 결과 및 시사점

톤: 전문적이면서 읽기 쉬운 블로그 스타일. 마크다운 없이 순수 텍스트.`;

    const res = await smartInvoke("drafting", prompt, {
      system: "당신은 ETHOS 행정사사무소의 마케팅 담당자입니다. 익명화된 사례 스토리를 블로그 초안으로 작성합니다.",
      maxTokens: 1500,
    });

    const body = res.text?.trim();
    if (!body) {
      logger.warn("[case-story-draft] Empty AI response", { caseId });
      return null;
    }

    const title = `[사례] ${stripPII(caseMatter.title)}`;
    const slug = toSlug(title);

    const blogPost = await prisma.blogPost.create({
      data: {
        slug,
        title,
        body,
        excerpt: body.slice(0, 150) + "…",
        category: caseMatter.category.toLowerCase(),
        tags: JSON.stringify([caseMatter.matterType, "사례", "case-study"]),
        published: false,
        source: "ai-case-story-draft",
        authorName: "ETHOS 행정사사무소",
      },
    });

    logger.info("[case-story-draft] Draft created", { caseId, blogPostId: blogPost.id });
    return { blogPostId: blogPost.id };
  } catch (err) {
    logger.error("[case-story-draft] Failed", { caseId, err });
    return null;
  }
}
