import { NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { crossPostToNaver } from "@/lib/services/blog-cross-post-service";
import { logger } from "@/lib/utils/logger";

export async function POST(request: Request) {
  try {
    const enabled = await isFeatureEnabled("blog_cross_post_naver");
    if (!enabled) {
      return NextResponse.json({ error: "기능이 비활성화되어 있습니다" }, { status: 403 });
    }

    const { blogId } = (await request.json()) as { blogId: string };
    if (!blogId) {
      return NextResponse.json({ error: "blogId가 필요합니다" }, { status: 400 });
    }

    const result = await crossPostToNaver(blogId);
    return NextResponse.json(result);
  } catch (err) {
    logger.error("Blog cross-post error:", err);
    const message = err instanceof Error ? err.message : "변환 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
