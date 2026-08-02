import { withJsonHandler } from "@/lib/utils/api-handler";
import { backfillNaverPostBodies } from "@/lib/services/naver-rss-importer";

export const POST = withJsonHandler<unknown, unknown>(
  async (_body, req) => {
    const max = Number(new URL(req.url).searchParams.get("max") ?? "8");
    const result = await backfillNaverPostBodies({ max });
    return { ok: true, ...result };
  },
  { logScope: "blog-backfill-body", errorMessage: "본문 백필 실패" }
);
