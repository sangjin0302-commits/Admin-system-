import { withJsonHandler } from "@/lib/utils/api-handler";
import { importNaverBlogPosts } from "@/lib/services/naver-rss-importer";

export const POST = withJsonHandler<unknown, unknown>(
  async () => {
    const result = await importNaverBlogPosts({ translate: true });
    return { ok: true, ...result };
  },
  { logScope: "blog-import", errorMessage: "블로그 가져오기 실패" }
);
