"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const NAVY = "#1a3c5f";
const GOLD = "#c9a961";
const IVORY = "#faf6ef";

const PIE_COLORS = [
  NAVY,
  GOLD,
  "#3a6b9f",
  "#d4b97a",
  "#2a5680",
  "#8b7340",
  "#4a7db5",
];

type MonthlyCount = { month: string; count: number };
type DistributionItem = { name: string; value: number };

type Props = {
  monthlyInquiries: MonthlyCount[];
  monthlyCases: MonthlyCount[];
  typeDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];
  winRate: number;
  totalInquiries: number;
  totalCases: number;
};

export function KPICharts({
  monthlyInquiries,
  monthlyCases,
  typeDistribution,
  statusDistribution,
  winRate,
  totalInquiries,
  totalCases,
}: Props) {
  // Merge monthly data for combined area chart
  const monthlyTrend = monthlyInquiries.map((item, idx) => ({
    month: item.month,
    inquiries: item.count,
    cases: monthlyCases[idx]?.count ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="총 문의" value={totalInquiries} />
        <SummaryCard label="총 사건" value={totalCases} />
        <SummaryCard label="수임률" value={`${winRate}%`} />
      </div>

      {/* Monthly Trends */}
      <ChartCard title="월별 문의/사건 추이">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="inquiries"
              name="문의"
              stroke={NAVY}
              fill={NAVY}
              fillOpacity={0.15}
            />
            <Area
              type="monotone"
              dataKey="cases"
              name="사건"
              stroke={GOLD}
              fill={GOLD}
              fillOpacity={0.15}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inquiry Type Distribution */}
        <ChartCard title="문의 유형 분포">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={(props: any) =>
                  `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {typeDistribution.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={PIE_COLORS[idx % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard title="사건 상태 분포">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="건수" fill={NAVY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="rounded-lg border p-6 text-center shadow-sm"
      style={{ backgroundColor: IVORY, borderColor: "#e8e0d0" }}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: NAVY }}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border p-4 shadow-sm"
      style={{ backgroundColor: "#ffffff", borderColor: "#e8e0d0" }}
    >
      <h2 className="mb-4 text-lg font-semibold" style={{ color: NAVY }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
