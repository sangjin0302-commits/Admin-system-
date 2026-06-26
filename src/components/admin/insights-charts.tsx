"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NAVY = "#1a3c5f";
const GOLD = "#c9a961";
const GOLD_DEEP = "#a88647";
const MUTED = "#9b9583";
const PIE_COLORS = [NAVY, GOLD, GOLD_DEEP, "#3e5f7e", "#7a6849", "#bea882"];

const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #c9a961",
  borderRadius: 8,
  fontSize: 12,
};

export function WeeklyInquiriesChart({ data }: { data: Array<{ day: string; count: number }> }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0d7c3" />
          <XAxis dataKey="day" tick={{ fill: MUTED, fontSize: 11 }} />
          <YAxis tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: NAVY, fontWeight: 700 }} />
          <Line type="monotone" dataKey="count" stroke={NAVY} strokeWidth={2} dot={{ fill: GOLD, r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const sliced = useMemo(() => data.slice(0, 6), [data]);
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={sliced}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            label={(entry: { name?: string; value?: number }) => `${entry.name ?? ""} ${entry.value ?? ""}`}
            labelLine={false}
          >
            {sliced.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: NAVY, fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusBarChart({ data }: { data: Array<{ status: string; count: number }> }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0d7c3" />
          <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="status" tick={{ fill: NAVY, fontSize: 11 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: NAVY, fontWeight: 700 }} />
          <Bar dataKey="count" fill={GOLD} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
