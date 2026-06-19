import { prisma } from "@/lib/prisma/client";

export type RevenueDataPoint = {
  month: string;
  actualRevenue: number;
  predictedRevenue?: number;
  lowerBound?: number;
  upperBound?: number;
};

export type ForecastResult = {
  historical: RevenueDataPoint[];
  forecast: RevenueDataPoint[];
  modelType: string;
  confidence: number;
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function linearRegression(points: number[]): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: points[0] };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += points[i];
    sumXY += i * points[i];
    sumX2 += i * i;
  }
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export async function getHistoricalRevenue(
  months: number,
): Promise<RevenueDataPoint[]> {
  const now = new Date();
  const startMonth = new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1,
  );

  const memos = await prisma.caseAccountingMemo.findMany({
    where: {
      paidAt: { gte: startMonth },
      paidAmount: { not: null },
    },
    select: { paidAt: true, paidAmount: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    buckets.set(monthKey(addMonths(startMonth, i)), 0);
  }

  for (const memo of memos) {
    if (!memo.paidAt) continue;
    const key = monthKey(memo.paidAt);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + (memo.paidAmount ?? 0));
    }
  }

  return Array.from(buckets.entries()).map(([month, actualRevenue]) => ({
    month,
    actualRevenue,
  }));
}

export async function forecastRevenue(months: number): Promise<ForecastResult> {
  const history = await getHistoricalRevenue(12);

  if (history.length < 3) {
    const avg =
      history.length > 0
        ? history.reduce((a, p) => a + p.actualRevenue, 0) / history.length
        : 0;
    const lastDate =
      history.length > 0
        ? new Date(`${history[history.length - 1].month}-01`)
        : new Date();
    const forecast: RevenueDataPoint[] = [];
    for (let i = 1; i <= months; i++) {
      forecast.push({
        month: monthKey(addMonths(lastDate, i)),
        actualRevenue: 0,
        predictedRevenue: avg,
        lowerBound: avg * 0.5,
        upperBound: avg * 1.5,
      });
    }
    return {
      historical: history,
      forecast,
      modelType: "flat-average",
      confidence: 0.3,
    };
  }

  const values = history.map((p) => p.actualRevenue);
  const { slope, intercept } = linearRegression(values);

  // Residuals -> std dev for confidence band
  const predictedHistory = values.map((_, i) => slope * i + intercept);
  const residuals = values.map((v, i) => v - predictedHistory[i]);
  const mean = residuals.reduce((a, r) => a + r, 0) / residuals.length;
  const variance =
    residuals.reduce((a, r) => a + (r - mean) ** 2, 0) / residuals.length;
  const stdDev = Math.sqrt(variance);

  const histAvg = values.reduce((a, v) => a + v, 0) / values.length;
  const confidence = Math.max(
    0.3,
    Math.min(0.95, 1 - stdDev / (Math.abs(histAvg) + 1)),
  );

  const historical: RevenueDataPoint[] = history.map((p) => ({ ...p }));
  const lastDate = new Date(`${history[history.length - 1].month}-01`);
  const forecast: RevenueDataPoint[] = [];

  for (let i = 1; i <= months; i++) {
    const x = values.length - 1 + i;
    const predicted = Math.max(0, slope * x + intercept);
    forecast.push({
      month: monthKey(addMonths(lastDate, i)),
      actualRevenue: 0,
      predictedRevenue: Math.round(predicted),
      lowerBound: Math.max(0, Math.round(predicted - stdDev)),
      upperBound: Math.round(predicted + stdDev),
    });
  }

  return {
    historical,
    forecast,
    modelType: "linear-regression",
    confidence,
  };
}
