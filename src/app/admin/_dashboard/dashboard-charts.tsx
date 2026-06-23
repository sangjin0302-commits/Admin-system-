"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  type PieLabelRenderProps,
} from "recharts";

import { Card } from "@/components/ui/card";

type PipelineItem = {
  key: string;
  label: string;
  count: number;
};

type CategoryItem = {
  label: string;
  count: number;
};

const PALETTE = [
  "#1a3c5f",
  "#c9a961",
  "#2e6ea6",
  "#a88647",
  "#4a90c4",
];

export function DashboardCharts({
  pipeline,
  casesByCategory,
}: {
  pipeline: PipelineItem[];
  casesByCategory: CategoryItem[];
}) {
  const totalCases = casesByCategory.reduce((s, c) => s + c.count, 0);
  const hasCategoryData = totalCases > 0;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* 문의 파이프라인 바 차트 */}
      <Card className="p-6">
        <p className="ui-kicker">Pipeline</p>
        <h3 className="mt-2 ui-section-title">문의 단계별 현황</h3>
        <div className="mt-5 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={pipeline}
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={82}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(v) => [`${v ?? 0}건`, "건수"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {pipeline.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 업무 분야별 사건 분포 도넛 */}
      <Card className="p-6">
        <p className="ui-kicker">Cases by Area</p>
        <h3 className="mt-2 ui-section-title">업무 분야별 사건 분포</h3>
        {hasCategoryData ? (
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={casesByCategory}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="75%"
                  paddingAngle={2}
                  label={({ name, percent }: PieLabelRenderProps) =>
                    (percent ?? 0) > 0.05 ? `${name} ${Math.round((percent ?? 0) * 100)}%` : ""
                  }
                  labelLine={false}
                >
                  {casesByCategory.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v ?? 0}건`, "건수"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-5 flex h-56 items-center justify-center text-sm text-text-muted">
            진행 중인 사건이 없습니다
          </div>
        )}
      </Card>
    </div>
  );
}
