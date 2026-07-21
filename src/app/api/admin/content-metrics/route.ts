import { NextResponse } from "next/server";

import {
  listWeeks,
  upsertWeek,
  deleteWeek,
  getAreaRanking,
  type WeekInput
} from "@/lib/services/content-metrics-service";

// 인증은 /api/admin/* 미들웨어(Basic Auth + IP allowlist)에서 처리.

export async function GET() {
  const [weeks, ranking] = await Promise.all([listWeeks(), getAreaRanking()]);
  return NextResponse.json({ ok: true, weeks, ranking });
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.weekStart !== "string" || !body.weekStart.trim()) {
    return NextResponse.json({ ok: false, error: "기준 주 시작일(weekStart)은 필수입니다." }, { status: 400 });
  }

  const referral = Array.isArray(body.naverReferral)
    ? body.naverReferral
        .map((s: unknown) => {
          const o = s as { label?: unknown; pct?: unknown };
          const label = typeof o?.label === "string" ? o.label.trim() : "";
          const pct = toNum(o?.pct);
          return label && pct !== null ? { label, pct } : null;
        })
        .filter(Boolean)
    : null;

  const topItems = Array.isArray(body.topItems)
    ? body.topItems
        .map((t: unknown) => {
          const o = t as { channel?: unknown; rank?: unknown; title?: unknown; area?: unknown; views?: unknown };
          const channel = o?.channel === "LINKEDIN" ? "LINKEDIN" : "NAVER";
          const title = typeof o?.title === "string" ? o.title.trim() : "";
          if (!title) return null;
          return {
            channel: channel as "NAVER" | "LINKEDIN",
            rank: toNum(o?.rank) ?? 0,
            title,
            area: typeof o?.area === "string" ? o.area : null,
            views: toNum(o?.views)
          };
        })
        .filter(Boolean)
    : [];

  const input: WeekInput = {
    weekStart: body.weekStart.trim(),
    weekEnd: typeof body.weekEnd === "string" ? body.weekEnd : null,
    updatedOn: typeof body.updatedOn === "string" ? body.updatedOn : null,
    naverViews: toNum(body.naverViews),
    naverRevisitRate: toNum(body.naverRevisitRate),
    naverAiCitations: toNum(body.naverAiCitations),
    naverReferral: referral as WeekInput["naverReferral"],
    naverInquiries: toNum(body.naverInquiries),
    naverInquiryNote: typeof body.naverInquiryNote === "string" ? body.naverInquiryNote : null,
    liImpressions: toNum(body.liImpressions),
    liMemberReach: toNum(body.liMemberReach),
    liFollowers: toNum(body.liFollowers),
    liFollowerDelta: toNum(body.liFollowerDelta),
    insight: typeof body.insight === "string" ? body.insight : null,
    topItems: topItems as WeekInput["topItems"]
  };

  try {
    const res = await upsertWeek(input);
    return NextResponse.json({ ok: true, id: res.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 실패";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id 필요" }, { status: 400 });
  try {
    await deleteWeek(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "삭제 실패";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
