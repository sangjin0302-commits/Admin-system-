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

/** 기간 enum → 화면 표기. period 문자열 자체는 라우트·비교에 쓰이므로 바꾸지 않는다. */
const PERIOD_LABEL: Record<ReportPeriod, string> = {
  weekly: "주간",
  monthly: "월간",
  quarterly: "분기",
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

/** 사람이 읽는 날짜(예: 2026. 7. 19.). CSV·파일명 등 기계용은 ISO를 그대로 쓴다. */
function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(d);
}

/** 부호 붙은 퍼센트 표기(예: +12.3%, -5%). */
function signedPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}%`;
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
  if (change >= 20) insights.push(`문의량이 직전 기간 대비 ${change}% 증가 — 처리 여력 점검이 필요합니다.`);
  else if (change <= -20) insights.push(`문의량이 ${Math.abs(change)}% 감소 — 마케팅 채널을 점검하세요.`);
  else insights.push(`문의량은 안정적입니다(${signedPct(change)}).`);
  if (topType) {
    insights.push(`가장 많은 문의 유형: ${topType.inquiryType} (${topType._count._all}건).`);
  }

  return {
    title: "문의",
    metrics: [
      { label: "신규 문의", value: current, change },
      { label: "직전 기간", value: previous },
      { label: "최다 유형", value: topType?.inquiryType ?? "-" },
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
  insights.push(`이번 기간 신규 사건 ${current}건 착수, ${closed}건 종결.`);
  if (closed > current) insights.push("미결 사건이 줄고 있습니다 — 운영 건전성 양호.");
  if (current > closed * 1.5 && closed > 0) insights.push("착수가 종결을 앞지릅니다 — 인력 배치를 점검하세요.");

  return {
    title: "사건",
    metrics: [
      { label: "착수", value: current, change },
      { label: "종결", value: closed },
      { label: "순증", value: current - closed },
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
    `매출이 직전 기간 대비 ${Math.abs(change)}% ${change >= 0 ? "증가" : "감소"} (₩${currentRevenue.toLocaleString()} / 이전 ₩${previousRevenue.toLocaleString()}).`,
  );
  if (avgDeal > 0) insights.push(`건당 평균 수임료: ₩${avgDeal.toLocaleString()}.`);

  return {
    title: "매출",
    metrics: [
      { label: "매출", value: `₩${currentRevenue.toLocaleString()}`, change },
      { label: "직전 매출", value: `₩${previousRevenue.toLocaleString()}` },
      { label: "건당 평균", value: `₩${avgDeal.toLocaleString()}` },
      { label: "결제 건수", value: currentMemos.length },
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
  insights.push(`수임 전환율: ${currRate}% (이전 ${prevRate}%).`);
  if (currRate < 10 && inqCurr > 10) {
    insights.push("전환율이 낮습니다 — 문의에서 사건으로 넘어가는 단계를 점검하세요.");
  } else if (currRate > 40) {
    insights.push("전환율이 높습니다 — 현재 유입 채널의 질이 좋습니다.");
  }

  return {
    title: "전환",
    metrics: [
      { label: "전환율", value: `${currRate}%`, change },
      { label: "직전 전환율", value: `${prevRate}%` },
      { label: "문의 → 사건", value: `${casesCurr} / ${inqCurr}` },
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
      label: `담당 ${i + 1}위`,
      value: `${r.assignedTo ?? "-"} (${r._count._all}건)`,
    });
  });
  topPaidMemos.forEach((m, i) => {
    metrics.push({
      label: `최고 수임료 ${i + 1}위`,
      value: `${m.caseMatter.caseNo ?? m.caseMatter.title} — ₩${(m.paidAmount ?? 0).toLocaleString()}`,
    });
  });

  const insights: string[] = [];
  if (ranked[0]?.assignedTo) {
    insights.push(`사건을 가장 많이 맡은 담당: ${ranked[0].assignedTo} (${ranked[0]._count._all}건).`);
  }
  if (topPaidMemos[0]?.paidAmount) {
    insights.push(`최고 수임료: ₩${topPaidMemos[0].paidAmount.toLocaleString()}.`);
  }
  if (metrics.length === 0) {
    metrics.push({ label: "담당별 실적", value: "데이터 없음" });
  }

  return { title: "담당별 실적", metrics, insights };
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
  // 아래 라벨은 위 섹션에서 만든 것과 정확히 일치해야 한다("매출", "신규 문의").
  const revenueChange =
    revenueSection.metrics.find((m) => m.label === "매출")?.change ?? 0;
  const inquiryChange =
    inquirySection.metrics.find((m) => m.label === "신규 문의")?.change ?? 0;

  const summary =
    `${PERIOD_LABEL[period]} 리포트 (${fmtDate(startDate)} ~ ${fmtDate(endDate)}). ` +
    `직전 기간 대비 매출 ${Math.abs(revenueChange)}% ${revenueChange >= 0 ? "증가" : "감소"}, ` +
    `문의 ${Math.abs(inquiryChange)}% ${inquiryChange >= 0 ? "증가" : "감소"}.`;

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
  const periodLabel = PERIOD_LABEL[report.period];
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
<html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(periodLabel)} 비즈니스 리포트</title></head>
<body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:760px;margin:0 auto;padding:32px;color:#222">
  <header>
    <div style="color:#c9a961;font-size:12px;letter-spacing:.1em;text-transform:uppercase">Business Report</div>
    <h1 style="color:#1a3c5f;margin:4px 0">${escapeHtml(periodLabel)} 리포트</h1>
    <div style="color:#666;font-size:14px">${fmtDate(report.startDate)} ~ ${fmtDate(report.endDate)}</div>
    <p style="margin-top:12px;line-height:1.5">${escapeHtml(report.summary)}</p>
  </header>
  ${sectionsHtml}
</body></html>`;
}

export function generateReportMarkdown(report: BusinessReport): string {
  const periodLabel = PERIOD_LABEL[report.period];
  const lines: string[] = [];
  lines.push(`# ${periodLabel} 비즈니스 리포트`);
  lines.push("");
  lines.push(
    `**기간:** ${fmtDate(report.startDate)} ~ ${fmtDate(report.endDate)}`,
  );
  lines.push("");
  lines.push(report.summary);
  lines.push("");

  for (const section of report.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push("| 지표 | 값 | 증감 |");
    lines.push("| --- | --- | --- |");
    for (const m of section.metrics) {
      const change =
        m.change != null ? `${m.change >= 0 ? "+" : ""}${m.change}%` : "";
      lines.push(`| ${m.label} | ${m.value} | ${change} |`);
    }
    lines.push("");
    if (section.insights.length > 0) {
      lines.push("**분석:**");
      for (const insight of section.insights) {
        lines.push(`- ${insight}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
