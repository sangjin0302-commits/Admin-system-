"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ForecastResult, RevenueDataPoint } from "@/lib/services/revenue-prediction-service";

const NAVY = "#1a3c5f";
const GOLD = "#c9a961";

type ChartPoint = {
  month: string;
  actual: number | null;
  predicted: number | null;
  band: [number, number] | null;
};

function toChartData(forecast: ForecastResult): ChartPoint[] {
  const historical: ChartPoint[] = forecast.historical.map((p) => ({
    month: p.month,
    actual: p.actualRevenue,
    predicted: null,
    band: null,
  }));
  const future: ChartPoint[] = forecast.forecast.map((p: RevenueDataPoint) => ({
    month: p.month,
    actual: null,
    predicted: p.predictedRevenue ?? null,
    band:
      p.lowerBound != null && p.upperBound != null
        ? [p.lowerBound, p.upperBound]
        : null,
  }));

  // Bridge: last historical point also seeds predicted line so the dashed segment connects visually.
  if (historical.length > 0 && future.length > 0) {
    const lastHist = historical[historical.length - 1];
    lastHist.predicted = lastHist.actual;
  }

  return [...historical, ...future];
}

export function ForecastChart({ forecast }: { forecast: ForecastResult }) {
  const data = toChartData(forecast);

  return (
    <div className="w-full" style={{ height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => v.toLocaleString()}
          />
          <Tooltip
            formatter={(value: any) =>
              typeof value === "number" ? value.toLocaleString() : String(value ?? "")
            }
          />
          <Legend />

          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill={GOLD}
            fillOpacity={0.18}
            name="신뢰 구간"
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="actual"
            name="실제 매출"
            stroke={NAVY}
            strokeWidth={2.5}
            dot={{ r: 3, fill: NAVY }}
            connectNulls={false}
          />

          <Line
            type="monotone"
            dataKey="predicted"
            name="예측 매출"
            stroke={GOLD}
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: GOLD }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
