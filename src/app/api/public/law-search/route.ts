import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { publicLawSearch } from "@/lib/services/public-law-search-service";
import { checkPublicLawLimit } from "@/lib/security/public-law-ratelimit";

export const runtime = "nodejs";

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: Request) {
  const enabled = await isFeatureEnabled("public_law_search");
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 404 });
  }

  const ip = getClientIp(request);
  const limit = await checkPublicLawLimit(ip);
  if (!limit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "일일 조회 3회를 모두 사용하셨습니다. 내일 다시 시도해주세요.",
        remaining: 0,
        resetAt: limit.resetAt
      },
      { status: 429 }
    );
  }

  let body: { keyword?: unknown };
  try {
    body = (await request.json()) as { keyword?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
  if (keyword.length < 2 || keyword.length > 100) {
    return NextResponse.json(
      { ok: false, error: "검색어는 2자 이상 100자 이하로 입력해 주세요." },
      { status: 400 }
    );
  }

  try {
    const data = await publicLawSearch(keyword);
    return NextResponse.json({
      ok: true,
      data,
      remaining: limit.remaining,
      resetAt: limit.resetAt
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
