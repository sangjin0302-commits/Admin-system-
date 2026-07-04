/**
 * Inquiry heatmap service — aggregates Inquiry.createdAt into a 7×24 grid
 * (day-of-week × hour-of-day) for both inflow and conversion (WON).
 *
 * Time zone: Asia/Seoul (KST, UTC+9). All bucketing is computed in KST so
 * the "요일 × 시간" grid matches the operator's mental model.
 *
 * No persistence — reads from prisma.Inquiry directly.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type HeatmapGrid = number[][]; // [7][24] — 0 = Monday, 6 = Sunday

export type HeatmapResult = {
  inflow: HeatmapGrid;
  conversion: HeatmapGrid;
  date_range: { from: string; to: string; days: number };
  totals: { inflow: number; conversion: number };
  topInflowHours: { hour: number; count: number }[];
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function emptyGrid(): HeatmapGrid {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
}

/**
 * Convert a UTC Date into (dayIdx 0-6 Mon..Sun, hour 0-23) in KST.
 */
function bucket(d: Date): { day: number; hour: number } {
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  // getUTC* on the shifted Date gives us KST clock fields
  const jsDow = kst.getUTCDay(); // 0=Sun..6=Sat
  const day = (jsDow + 6) % 7; // Mon=0..Sun=6
  const hour = kst.getUTCHours();
  return { day, hour };
}

export async function getInquiryHeatmap(days: number = 30): Promise<HeatmapResult> {
  const safeDays = Math.max(1, Math.min(365, Math.floor(days)));
  const to = new Date();
  const from = new Date(to.getTime() - safeDays * 24 * 60 * 60 * 1000);

  const inflow = emptyGrid();
  const conversion = emptyGrid();
  let inflowTotal = 0;
  let conversionTotal = 0;

  try {
    const rows = await prisma.inquiry.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, status: true },
    });
    for (const r of rows) {
      const { day, hour } = bucket(r.createdAt);
      inflow[day][hour] += 1;
      inflowTotal += 1;
      if (r.status === "WON") {
        conversion[day][hour] += 1;
        conversionTotal += 1;
      }
    }
  } catch (err) {
    logger.warn("[inquiry-heatmap] query failed", err);
  }

  // Top-3 inflow hours across the whole week
  const hourTotals = Array.from({ length: 24 }, (_, h) =>
    inflow.reduce((acc, dayRow) => acc + dayRow[h], 0)
  );
  const topInflowHours = hourTotals
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    inflow,
    conversion,
    date_range: { from: from.toISOString(), to: to.toISOString(), days: safeDays },
    totals: { inflow: inflowTotal, conversion: conversionTotal },
    topInflowHours,
  };
}
