import { prisma } from "@/lib/prisma/client";

export type ReportPeriod = "weekly" | "monthly" | "quarterly";

export type ReportSection = {
  title: string;
  metrics: { label: string; value: string | number; change?: number }[];
  insights: string[];
};

export type BusinessReport = {
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  summary: string;
  sections: ReportSection[];
};

function periodDays(period: ReportPeriod): number {
  if (period === "weekly") return 7;
  if (period === "monthly") return 30;
  return 90;
}

function periodBounds(period: ReportPeriod) {
  const days = periodDays(period);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const prevEnd = startDate;
  const prevStart = new Date(prevEnd.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate, prevStart, prevEnd };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function buildInquirySection(
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
): Promise<ReportSection> {
  const [current, previous] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: startDate, lt: endDate } } }),
    prisma.inquiry.count({ where: { createdAt: { gte: prevStart, lt: prevEnd } } }),
  ]);

  const byType = await prisma.inquiry.groupBy({
    by: ["inquiryType"],
    where: { createdAt: { gte: startDate, lt: endDate } },
    _count: { _all: true },
  });
  const topType = [...byType].sort((a, b) => b._count._all - a._count._all)[0];

  const change = pctChange(current, previous);

  const insights: string[] = [];
  if (change >= 20) insights.push(`Inquiry volume up ${change}% vs prior period — capacity check recommended.`);
  else if (change <= -20) insights.push(`Inquiry volume down ${change}% — review marketing channels.`);
  else insights.push(`Inquiry volume stable (${change >= 0 ? "+" : ""}${change}%).`);
  if (topType) {
    insights.push(`Top inquiry type: ${topType.inquiryType} (${topType._count._all} inquiries).`);
  }

  return {
    title: "Inquiries",
    metrics: [
      { label: "New Inquiries", value: current, change },
      { label: "Previous Period", value: previous },
      { label: "Top Type", value: topType?.inquiryType ?? "-" },
    ],
    insights,
  };
}

async function buildCaseSection(
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
): Promise<ReportSection> {
  const [current, previous, closed] = await Promise.all([
    prisma.caseMatter.count({ where: { createdAt: { gte: startDate, lt: endDate } } }),
    prisma.caseMatter.count({ where: { createdAt: { gte: prevStart, lt: prevEnd } } }),
    prisma.caseMatter.count({ where: { closedAt: { gte: startDate, lt: endDate } } }),
  ]);

  const change = pctChange(current, previous);
  const insights: string[] = [];
  insights.push(`${current} new cases opened, ${closed} closed this period.`);
  if (closed > current) insights.push("Net case backlog shrinking — good operational health.");
  if (current > closed * 1.5 && closed > 0) insights.push("Intake outpacing closure — review staffing.");

  return {
    title: "Cases",
    metrics: [
      { label: "Opened", value: current, change },
      { label: "Closed", value: closed },
      { label: "Net", value: current - closed },
    ],
    insights,
  };
}

async function buildRevenueSection(
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
): Promise<ReportSection> {
  const [currentMemos, previousMemos] = await Promise.all([
    prisma.caseAccountingMemo.findMany({
      where: { paidAt: { gte: startDate, lt: endDate } },
      select: { paidAmount: true },
    }),
    prisma.caseAccountingMemo.findMany({
      where: { paidAt: { gte: prevStart, lt: prevEnd } },
      select: { paidAmount: true },
    }),
  ]);

  const currentRevenue = currentMemos.reduce((a, m) => a + (m.paidAmount ?? 0), 0);
  const previousRevenue = previousMemos.reduce((a, m) => a + (m.paidAmount ?? 0), 0);
  const change = pctChange(currentRevenue, previousRevenue);
  const avgDeal =
    currentMemos.length > 0
      ? Math.round(currentRevenue / currentMemos.length)
      : 0;

  const insights: string[] = [];
  insights.push(
    `Revenue ${change >= 0 ? "grew" : "fell"} ${Math.abs(change)}% vs prior period (₩${currentRevenue.toLocaleString()} vs ₩${previousRevenue.toLocaleString()}).`,
  );
  if (avgDeal > 0) insights.push(`Average deal size: ₩${avgDeal.toLocaleString()}.`);

  return {
    title: "Revenue",
    metrics: [
      { label: "Revenue", value: `₩${currentRevenue.toLocaleString()}`, change },
      { label: "Prev Revenue", value: `₩${previousRevenue.toLocaleString()}` },
      { label: "Avg Deal", value: `₩${avgDeal.toLocaleString()}` },
      { label: "Payments", value: currentMemos.length },
    ],
    insights,
  };
}

async function buildConversionSection(
  startDate: Date,
  endDate: Date,
  prevStart: Date,
  prevEnd: Date,
): Promise<ReportSection> {
  const [inqCurr, casesCurr, inqPrev, casesPrev] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: startDate, lt: endDate } } }),
    prisma.caseMatter.count({
      where: { inquiry: { createdAt: { gte: startDate, lt: endDate } } },
    }),
    prisma.inquiry.count({ where: { createdAt: { gte: prevStart, lt: prevEnd } } }),
    prisma.caseMatter.count({
      where: { inquiry: { createdAt: { gte: prevStart, lt: prevEnd } } },
    }),
  ]);

  const currRate = inqCurr > 0 ? Math.round((casesCurr / inqCurr) * 1000) / 10 : 0;
  const prevRate = inqPrev > 0 ? Math.round((casesPrev / inqPrev) * 1000) / 10 : 0;
  const change = Math.round((currRate - prevRate) * 10) / 10;

  const insights: string[] = [];
  insights.push(`Conversion rate: ${currRate}% (was ${prevRate}%).`);
  if (currRate < 10 && inqCurr > 10) {
    insights.push("Low conversion — examine intake-to-case handoff.");
  } else if (currRate > 40) {
    insights.push("Strong conversion — current channels qualified well.");
  }

  return {
    title: "Conversion",
    metrics: [
      { label: "Conversion Rate", value: `${currRate}%`, change },
      { label: "Prior Rate", value: `${prevRate}%` },
      { label: "Inquiries → Cases", value: `${casesCurr} / ${inqCurr}` },
    ],
    insights,
  };
}

async function buildTopPerformersSection(
  startDate: Date,
  endDate: Date,
): Promise<ReportSection> {
  const assignedCases = await prisma.caseMatter.groupBy({
    by: ["assignedTo"],
    where: {
      createdAt: { gte: startDate, lt: endDate },
      assignedTo: { not: null },
    },
    _count: { _all: true },
  });

  const ranked = [...assignedCases]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 3);

  const topPaidMemos = await prisma.caseAccountingMemo.findMany({
    where: { paidAt: { gte: startDate, lt: endDate } },
    orderBy: { paidAmount: "desc" },
    take: 3,
    select: {
      paidAmount: true,
      caseMatter: { select: { title: true, caseNo: true } },
    },
  });

  const metrics: ReportSection["metrics"] = [];
  ranked.forEach((r, i) => {
    metrics.push({
      label: `#${i + 1} Assignee`,
      value: `${r.assignedTo ?? "-"} (${r._count._all} cases)`,
    });
  });
  topPaidMemos.forEach((m, i) => {
    metrics.push({
      label: `Top Deal #${i + 1}`,
      value: `${m.caseMatter.caseNo ?? m.caseMatter.title} — ₩${(m.paidAmount ?? 0).toLocaleString()}`,
    });
  });

  const insights: string[] = [];
  if (ranked[0]?.assignedTo) {
    insights.push(`Highest case load: ${ranked[0].assignedTo} (${ranked[0]._count._all} cases).`);
  }
  if (topPaidMemos[0]?.paidAmount) {
    insights.push(`Largest deal closed: ₩${topPaidMemos[0].paidAmount.toLocaleString()}.`);
  }
  if (metrics.length === 0) {
    metrics.push({ label: "Top Performers", value: "No data" });
  }

  return { title: "Top Performers", metrics, insights };
}

export async function generateReport(period: ReportPeriod): Promise<BusinessReport> {
  const { startDate, endDate, prevStart, prevEnd } = periodBounds(period);

  const sections = await Promise.all([
    buildInquirySection(startDate, endDate, prevStart, prevEnd),
    buildCaseSection(startDate, endDate, prevStart, prevEnd),
    buildRevenueSection(startDate, endDate, prevStart, prevEnd),
    buildConversionSection(startDate, endDate, prevStart, prevEnd),
    buildTopPerformersSection(startDate, endDate),
  ]);

  const revenueSection = sections[2];
  const inquirySection = sections[0];
  const revenueChange =
    revenueSection.metrics.find((m) => m.label === "Revenue")?.change ?? 0;
  const inquiryChange =
    inquirySection.metrics.find((m) => m.label === "New Inquiries")?.change ?? 0;

  const summary =
    `${period[0].toUpperCase()}${period.slice(1)} report (${startDate.toISOString().slice(0, 10)} – ${endDate.toISOString().slice(0, 10)}). ` +
    `Revenue ${revenueChange >= 0 ? "up" : "down"} ${Math.abs(revenueChange)}%, ` +
    `inquiries ${inquiryChange >= 0 ? "up" : "down"} ${Math.abs(inquiryChange)}% vs prior period.`;

  return { period, startDate, endDate, summary, sections };
}

function escapeHtml(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateReportHTML(report: BusinessReport): string {
  const periodLabel = report.period.charAt(0).toUpperCase() + report.period.slice(1);
  const sectionsHtml = report.sections
    .map((sec) => {
      const metricsHtml = sec.metrics
        .map(
          (m) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;color:#666">${escapeHtml(m.label)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;font-weight:600">${escapeHtml(m.value)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;color:${
            (m.change ?? 0) >= 0 ? "#16a34a" : "#dc2626"
          }">${m.change != null ? `${m.change >= 0 ? "+" : ""}${m.change}%` : ""}</td>
        </tr>`,
        )
        .join("");
      const insightsHtml = sec.insights
        .map((i) => `<li>${escapeHtml(i)}</li>`)
        .join("");
      return `
      <section style="margin:24px 0">
        <h2 style="color:#1a3c5f;font-size:18px;border-bottom:2px solid #c9a961;padding-bottom:4px">${escapeHtml(sec.title)}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">${metricsHtml}</table>
        <ul style="margin-top:8px;color:#333;font-size:14px">${insightsHtml}</ul>
      </section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(periodLabel)} Business Report</title></head>
<body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:760px;margin:0 auto;padding:32px;color:#222">
  <header>
    <div style="color:#c9a961;font-size:12px;letter-spacing:.1em;text-transform:uppercase">Business Report</div>
    <h1 style="color:#1a3c5f;margin:4px 0">${escapeHtml(periodLabel)} Report</h1>
    <div style="color:#666;font-size:14px">${report.startDate.toISOString().slice(0, 10)} – ${report.endDate.toISOString().slice(0, 10)}</div>
    <p style="margin-top:12px;line-height:1.5">${escapeHtml(report.summary)}</p>
  </header>
  ${sectionsHtml}
</body></html>`;
}

export function generateReportMarkdown(report: BusinessReport): string {
  const periodLabel = report.period.charAt(0).toUpperCase() + report.period.slice(1);
  const lines: string[] = [];
  lines.push(`# ${periodLabel} Business Report`);
  lines.push("");
  lines.push(
    `**Period:** ${report.startDate.toISOString().slice(0, 10)} – ${report.endDate.toISOString().slice(0, 10)}`,
  );
  lines.push("");
  lines.push(report.summary);
  lines.push("");

  for (const section of report.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push("| Metric | Value | Change |");
    lines.push("| --- | --- | --- |");
    for (const m of section.metrics) {
      const change =
        m.change != null ? `${m.change >= 0 ? "+" : ""}${m.change}%` : "";
      lines.push(`| ${m.label} | ${m.value} | ${change} |`);
    }
    lines.push("");
    if (section.insights.length > 0) {
      lines.push("**Insights:**");
      for (const insight of section.insights) {
        lines.push(`- ${insight}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
