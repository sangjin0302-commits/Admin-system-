"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";

import type { MonthlyCount, CategoryCount } from "@/lib/services/admin-stats";

const KRW = new Intl.NumberFormat("ko-KR");

const COLORS = [
  "rgb(26 60 95)",       // deep navy
  "rgb(201 169 97)",     // gold
  "rgb(40 112 76)",      // success green
  "rgb(168 134 71)",     // gold-deep
  "rgb(184 130 60)",     // warm gold
  "rgb(92 84 68)"        // muted
];

function formatWon(value: number) {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}천만`;
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`;
  return KRW.format(value);
}

export function RevenueChart({ data }: { data: MonthlyCount[] }) {
  const chartData = data.map((m) => ({
    month: m.month.slice(5),
    매출: m.revenueWon
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgb(26 60 95)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="rgb(26 60 95)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(224 215 195)" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgb(92 84 68)" }} />
        <YAxis tick={{ fontSize: 11, fill: "rgb(92 84 68)" }} tickFormatter={formatWon} width={60} />
        <Tooltip
          formatter={(value) => [`${KRW.format(Number(value))}원`, "매출"]}
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid rgb(224 215 195)",
            boxShadow: "0 10px 28px rgba(16,24,32,0.06)"
          }}
        />
        <Area
          type="monotone"
          dataKey="매출"
          stroke="rgb(26 60 95)"
          strokeWidth={2.5}
          fill="url(#revGrad)"
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CasesChart({ data }: { data: MonthlyCount[] }) {
  const chartData = data.map((m) => ({
    month: m.month.slice(5),
    문의: m.newInquiries,
    신규: m.newCases,
    종결: m.closedCases
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(224 215 195)" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgb(92 84 68)" }} />
        <YAxis tick={{ fontSize: 11, fill: "rgb(92 84 68)" }} width={36} />
        <Tooltip
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid rgb(224 215 195)",
            boxShadow: "0 10px 28px rgba(16,24,32,0.06)"
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="문의" fill="rgb(201 169 97)" radius={[4, 4, 0, 0]} animationDuration={800} />
        <Bar dataKey="신규" fill="rgb(26 60 95)" radius={[4, 4, 0, 0]} animationDuration={1000} />
        <Bar dataKey="종결" fill="rgb(40 112 76)" radius={[4, 4, 0, 0]} animationDuration={1200} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({ data }: { data: CategoryCount[] }) {
  const chartData = data.map((c) => ({ name: c.label, value: c.total }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          animationDuration={1000}
          animationEasing="ease-out"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={{ strokeWidth: 1, stroke: "rgb(224 215 195)" }}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${Number(value)}건`, String(name)]}
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid rgb(224 215 195)",
            boxShadow: "0 10px 28px rgba(16,24,32,0.06)"
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
