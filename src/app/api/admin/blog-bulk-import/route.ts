import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { bulkImportNaverBlog } from "@/lib/services/naver-bulk-importer";
import { getSiteSetting } from "@/lib/services/site-settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const blogId = (await getSiteSetting("naver.blogId")) || "attorney_jean";
  const url = new URL(request.url);
  const max = Number(url.searchParams.get("max") ?? 100);
  const translate = url.searchParams.get("translate") === "1";

  const result = await bulkImportNaverBlog({ blogId, maxPosts: max, translate });
  return NextResponse.json({ ok: true, blogId, ...result });
}
