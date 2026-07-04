import { NextResponse } from "next/server";

import {
  getNaverReviewSummary,
  saveNaverReviews,
  type NaverReview
} from "@/lib/services/naver-review-service";

export async function GET() {
  const summary = await getNaverReviewSummary();
  return NextResponse.json({ ok: true, summary });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { reviews?: unknown } | null;
  if (!body || !Array.isArray(body.reviews)) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  await saveNaverReviews(body.reviews as NaverReview[]);
  const summary = await getNaverReviewSummary();
  return NextResponse.json({ ok: true, summary });
}
