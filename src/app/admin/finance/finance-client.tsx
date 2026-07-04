"use client";

import { useEffect, useState, useCallback } from "react";

interface Report {
  year: number;
  month: number;
  revenue: number;
  paymentCount: number;
  unpaid: number;
  unpaidCount: number;
  refunds: number;
  refundCount: number;
  taxEstimate: { vat: number; incomeTax: number; total: number; note: string };
  netIncome: number;
  inquiryCount: number;
  byCategory: Array<{ category: string; revenue: number; count: number }>;
  byService: Array<{ service: string; revenue: number; count: number }>;
}

interface TrendPoint {
  year: number;
  month: number;
  revenue: number;
  net: number;
}

interface Props {
  initialYear: number;
  initialMonth: number;
}

export default function FinanceClient({ initialYear, initialMonth }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<Report | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/finance/report?year=${year}&month=${month}&trend=1`);
      const data = await res.json();
      if (data.ok) {
        setReport(data.report);
        setTrend(data.trend);
      } else {
        setError(data.error ?? "실패");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportPdf() {
    // 브라우저 print dialog → PDF 저장
    window.print();
  }

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>월간 재무 리포트</h1>
        <div className="no-print" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 2, year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <button onClick={load} style={btn("#06c")}>새로고침</button>
          <button onClick={exportPdf} style={btn("#0a7")}>PDF 내보내기</button>
        </div>
      </div>

      {loading && <div>로딩 중...</div>}
      {error && <div style={{ color: "#c00" }}>오류: {error}</div>}

      {report && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            <KpiCard label="매출" value={report.revenue} count={report.paymentCount} color="#0a7" />
            <KpiCard label="미수금" value={report.unpaid} count={report.unpaidCount} color="#e80" />
            <KpiCard label="환불" value={report.refunds} count={report.refundCount} color="#c00" />
            <KpiCard label="예상 세금" value={report.taxEstimate.total} color="#666" />
            <KpiCard label="순이익" value={report.netIncome} color="#06c" />
          </section>

          <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
            세금 상세: 부가세 {report.taxEstimate.vat.toLocaleString()}원 · 소득세 {report.taxEstimate.incomeTax.toLocaleString()}원 · {report.taxEstimate.note}
          </p>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div style={panel}>
              <h2 style={h2}>카테고리별 매출</h2>
              <CategoryPie data={report.byCategory} />
              <table style={{ width: "100%", fontSize: 13, marginTop: 12 }}>
                <tbody>
                  {report.byCategory.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td style={{ textAlign: "right" }}>{c.revenue.toLocaleString()}원</td>
                      <td style={{ textAlign: "right", color: "#888" }}>{c.count}건</td>
                    </tr>
                  ))}
                  {report.byCategory.length === 0 && <tr><td colSpan={3} style={{ color: "#888" }}>데이터 없음</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={panel}>
              <h2 style={h2}>서비스별 매출 Top 10</h2>
              <table style={{ width: "100%", fontSize: 13 }}>
                <tbody>
                  {report.byService.map((s) => (
                    <tr key={s.service}>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.service}
                      </td>
                      <td style={{ textAlign: "right" }}>{s.revenue.toLocaleString()}원</td>
                      <td style={{ textAlign: "right", color: "#888" }}>{s.count}</td>
                    </tr>
                  ))}
                  {report.byService.length === 0 && <tr><td colSpan={3} style={{ color: "#888" }}>데이터 없음</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {trend && (
            <section style={panel}>
              <h2 style={h2}>최근 12개월 매출 추이</h2>
              <TrendLine data={trend} />
            </section>
          )}

          <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
            문의: {report.inquiryCount}건 · 리포트 기간: {new Date(report.year, report.month - 1, 1).toLocaleDateString("ko-KR")}
          </p>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, count, color }: { label: string; value: number; count?: number; color: string }) {
  return (
    <div style={{ border: "1px solid #ddd", borderTop: `3px solid ${color}`, borderRadius: 6, padding: 12, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{value.toLocaleString()}원</div>
      {typeof count === "number" && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{count}건</div>}
    </div>
  );
}

function CategoryPie({ data }: { data: Array<{ category: string; revenue: number }> }) {
  const total = data.reduce((s, d) => s + d.revenue, 0);
  if (total === 0) return <div style={{ color: "#888", fontSize: 13 }}>데이터 없음</div>;
  const cx = 100;
  const cy = 100;
  const r = 80;
  const colors = ["#0a7", "#06c", "#e80", "#c06", "#666", "#a0c"];
  let start = 0;
  const segs: Array<{ path: string; color: string; label: string }> = [];
  data.forEach((d, i) => {
    const frac = d.revenue / total;
    const end = start + frac * Math.PI * 2;
    const x1 = cx + r * Math.cos(start - Math.PI / 2);
    const y1 = cy + r * Math.sin(start - Math.PI / 2);
    const x2 = cx + r * Math.cos(end - Math.PI / 2);
    const y2 = cy + r * Math.sin(end - Math.PI / 2);
    const large = frac > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    segs.push({ path, color: colors[i % colors.length], label: d.category });
    start = end;
  });
  return (
    <svg viewBox="0 0 200 200" width={200} height={200}>
      {segs.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1}>
          <title>{s.label}</title>
        </path>
      ))}
    </svg>
  );
}

function TrendLine({ data }: { data: TrendPoint[] }) {
  const w = 800;
  const h = 200;
  const pad = 30;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const step = data.length > 1 ? (w - 2 * pad) / (data.length - 1) : 0;
  const pts = data.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.revenue / max) * (h - 2 * pad);
    return `${x},${y}`;
  });
  const netPts = data.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (Math.max(0, d.net) / max) * (h - 2 * pad);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w }}>
      <polyline fill="none" stroke="#06c" strokeWidth={2} points={pts.join(" ")} />
      <polyline fill="none" stroke="#0a7" strokeWidth={2} strokeDasharray="4 3" points={netPts.join(" ")} />
      {data.map((d, i) => {
        const x = pad + i * step;
        return (
          <g key={i}>
            <circle cx={x} cy={h - pad - (d.revenue / max) * (h - 2 * pad)} r={3} fill="#06c" />
            <text x={x} y={h - 8} fontSize={10} textAnchor="middle" fill="#666">{d.month}월</text>
          </g>
        );
      })}
      <text x={pad} y={20} fontSize={11} fill="#06c">매출</text>
      <text x={pad + 50} y={20} fontSize={11} fill="#0a7">순이익</text>
    </svg>
  );
}

const panel: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 6, padding: 16, background: "#fff" };
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 600, marginBottom: 10 };
function btn(color: string): React.CSSProperties {
  return { padding: "8px 14px", background: color, color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 500 };
}
