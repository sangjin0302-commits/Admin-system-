import { NextRequest, NextResponse } from "next/server";
import { runCronGroup, CRON_GROUPS } from "@/lib/services/cron-dispatcher-service";
import { logger } from "@/lib/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ group: string }> },
) {
  const { group } = await params;

  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate group
  if (!CRON_GROUPS[group]) {
    return NextResponse.json(
      { error: `Unknown cron group: ${group}`, available: Object.keys(CRON_GROUPS) },
      { status: 404 },
    );
  }

  // Build base URL
  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : new URL(request.url).origin;

  logger.info(`[cron-batch] Starting group "${group}" (${CRON_GROUPS[group].length} tasks)`);

  const start = Date.now();
  const result = await runCronGroup(group, baseUrl, cronSecret);
  const totalDuration = Date.now() - start;

  const failed = result.results.filter((r) => r.status >= 400);
  if (failed.length > 0) {
    logger.warn(`[cron-batch] Group "${group}" completed with ${failed.length} failures`, { failed });
  }

  logger.info(`[cron-batch] Group "${group}" done in ${totalDuration}ms`);

  return NextResponse.json({
    ...result,
    totalDuration,
    summary: {
      total: result.results.length,
      ok: result.results.length - failed.length,
      failed: failed.length,
    },
  });
}
