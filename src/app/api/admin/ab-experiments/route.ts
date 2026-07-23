import { NextResponse } from "next/server";

import {
  getTestResults,
  listTests,
  loadExperimentsFromSetting,
  saveExperiment,
  setExperimentPaused,
} from "@/lib/services/ab-test-service";

export const dynamic = "force-dynamic";

export async function GET() {
  await loadExperimentsFromSetting();
  const tests = listTests();
  const experiments = tests.map((t) => {
    const result = getTestResults(t.key);
    const totalViews = result.variants.reduce((s, v) => s + v.views, 0);
    return {
      key: t.key,
      name: t.name,
      variants: t.variants,
      weights: t.weights ?? t.variants.map(() => 1),
      active: t.active,
      totalViews,
      results: result.variants.map((v) => ({
        name: v.name,
        views: v.views,
        conversions: v.conversions,
        rate: v.rate,
        share: totalViews > 0 ? v.views / totalViews : 0,
      })),
      winner: result.winner,
    };
  });
  return NextResponse.json({ experiments });
}

export async function POST(req: Request) {
  let body: {
    key?: unknown;
    name?: unknown;
    variants?: unknown;
    weights?: unknown;
    active?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const variants = Array.isArray(body.variants)
    ? body.variants.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim())
    : [];
  const weights = Array.isArray(body.weights)
    ? body.weights.map((w) => Number(w)).filter((w) => Number.isFinite(w) && w > 0)
    : undefined;

  if (!key || !name || variants.length < 2) {
    return NextResponse.json(
      { error: "key, name과 2개 이상 variant가 필요합니다" },
      { status: 400 },
    );
  }
  if (weights && weights.length !== variants.length) {
    return NextResponse.json(
      { error: "weights 개수가 variants와 일치해야 합니다" },
      { status: 400 },
    );
  }

  try {
    await saveExperiment({
      key,
      name,
      variants,
      weights,
      active: body.active !== false,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ab-experiments] save failed", err);
    return NextResponse.json(
      { error: "저장 실패" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request) {
  let body: { key?: unknown; paused?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof body.key !== "string" || typeof body.paused !== "boolean") {
    return NextResponse.json({ error: "key(string), paused(boolean) 필요" }, { status: 400 });
  }
  await setExperimentPaused(body.key, body.paused);
  return NextResponse.json({ ok: true });
}
