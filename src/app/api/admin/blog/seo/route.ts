import { generateBlogSEO } from "@/lib/services/blog-seo-service";
import { withJsonHandler } from "@/lib/utils/api-handler";

type BlogSeoBody = { title?: string; body?: string; category?: string };

export const POST = withJsonHandler<BlogSeoBody>(
  async (body) => {
    return generateBlogSEO(body.title!, body.body!, body.category ?? "general");
  },
  {
    logScope: "admin/blog/seo",
    errorMessage: "SEO 생성 실패",
    validate: (body) =>
      body && body.title && body.body ? null : "title과 body는 필수입니다"
  }
);
