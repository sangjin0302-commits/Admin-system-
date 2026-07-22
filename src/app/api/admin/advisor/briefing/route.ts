import { generateBriefingPdf, type BriefingItem } from "@/lib/pdf/generate";
import { buildAdvisorReport, type AdvicePriority } from "@/lib/services/advisor-service";

const PRIORITY_LABEL: Record<AdvicePriority, string> = {
  high: "긴급",
  medium: "주의",
  low: "참고",
  good: "루틴"
};

/** 운영 참모 일일 브리핑 PDF. /api/admin/* — Basic Auth 보호. */
export async function POST() {
  try {
    const report = await buildAdvisorReport();
    const m = report.metrics;
    const metricsLine = `신규문의 ${m.newInquiries} · 정체상담 ${m.staleInquiries} · 진행사건 ${m.openCases} · 기한임박 ${m.dueSoon} · 기한경과 ${m.overdue} · 액션미설정 ${m.noNextAction}`;

    const order: AdvicePriority[] = ["high", "medium", "low", "good"];
    const items: BriefingItem[] = [...report.cards]
      .sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority))
      .map((c) => ({ priorityLabel: PRIORITY_LABEL[c.priority], title: c.title, detail: c.detail }));

    const date = new Date().toISOString().slice(0, 10);
    const pdf = await generateBriefingPdf({ date, metricsLine, items });

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="briefing-${date}.pdf"`
      }
    });
  } catch (error) {
    console.error("admin/advisor/briefing POST failed", error);
    return Response.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
