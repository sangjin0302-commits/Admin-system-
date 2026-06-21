import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import {
  triggerFullSync,
  triggerNaverCollect,
  triggerReindex,
  triggerSyncNotion,
} from "@/lib/services/market-analyze-client";

export const dynamic = "force-dynamic";

const ACTIONS = {
  "collect-naver": () => triggerNaverCollect("general"),
  "collect-market": () => triggerNaverCollect("market"),
  "collect-trends": () => triggerNaverCollect("trends"),
  "full-sync": () => triggerFullSync(),
  reindex: () => triggerReindex(),
  "sync-notion": () => triggerSyncNotion(),
} as const;

type ActionKey = keyof typeof ACTIONS;

export async function POST(_req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const fn = ACTIONS[action as ActionKey];
  if (!fn) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
  try {
    const result = await fn();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    logger.error(`[market-bot:proxy:${action}] failed`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "실행 실패" },
      { status: 500 }
    );
  }
}
