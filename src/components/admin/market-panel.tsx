"use client";

import { useCallback, useEffect, useState } from "react";

type Tab = "competitors" | "sentiment" | "trends";

type Dashboard = {
  totals: { documents: number; relevant: number; competitors: number };
  lastCollectedAt: string | null;
  sentimentBreakdown: { sentiment: string; count: number }[];
  risingTopics: { topic: string; count: number }[];
  recentRisks: { title: string; url: string; riskFlags: string[]; collectedAt: string }[];
};

type Competitor = {
  competitorKey: string;
  displayName: string;
  mainTopics: string[];
  regionTags: string[];
  postingFreq7d: number;
  postingFreq30d: number;
  visibilityScore: number;
  engagementScore: number;
};

type CompetitorDoc = {
  title: string;
  url: string;
  snippet: string;
  publishedAt: string | null;
  sentiment: string;
};

type MarketDoc = {
  title: string;
  url: string;
  snippet: string;
  sourceType: string;
  sentiment: string;
  docType: string;
  riskFlags: string[];
  publisherName: string | null;
  publishedAt: string | null;
};

type Trend = {
  keyword: string;
  points: { period: string; ratio: number }[];
  latest: number;
  change: number;
};

type Report = { ok: boolean; report: string; model?: string; generatedAt: string; skipped?: string };

async function callApi(action: string, params: Record<string, unknown> = {}) {
  const res = await fetch("/api/admin/market", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params })
  });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "요청 실패");
  return json.data;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

const SENTIMENT_LABEL: Record<string, string> = {
  positive: "긍정",
  negative: "부정",
  neutral: "중립"
};

function sentimentClass(sentiment: string) {
  if (sentiment === "positive") return "bg-green-100 text-green-800";
  if (sentiment === "negative") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">
      {children}
    </span>
  );
}

export function MarketPanel() {
  const [tab, setTab] = useState<Tab>("competitors");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [competitorDocs, setCompetitorDocs] = useState<CompetitorDoc[]>([]);
  const [negativeDocs, setNegativeDocs] = useState<MarketDoc[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, c] = await Promise.all([callApi("getDashboard"), callApi("listCompetitors")]);
      setDashboard(d as Dashboard);
      setCompetitors(c as Competitor[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const openCompetitor = useCallback(async (key: string) => {
    setSelected(key);
    setCompetitorDocs([]);
    try {
      const data = (await callApi("getCompetitor", { competitorKey: key })) as {
        documents: CompetitorDoc[];
      };
      setCompetitorDocs(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "경쟁사 상세 조회 실패");
    }
  }, []);

  const loadSentiment = useCallback(async () => {
    try {
      const docs = (await callApi("listDocuments", { sentiment: "negative", limit: 20 })) as MarketDoc[];
      setNegativeDocs(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "문서 조회 실패");
    }
  }, []);

  const loadTrends = useCallback(async () => {
    try {
      setTrends((await callApi("getTrends")) as Trend[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "트렌드 조회 실패");
    }
  }, []);

  useEffect(() => {
    if (tab === "sentiment" && negativeDocs.length === 0) void loadSentiment();
    if (tab === "trends" && trends.length === 0) void loadTrends();
  }, [tab, negativeDocs.length, trends.length, loadSentiment, loadTrends]);

  const collectNow = useCallback(async () => {
    setBusy("collect");
    setError(null);
    try {
      await callApi("collectNow");
      await loadDashboard();
      setNegativeDocs([]);
      setTrends([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수집 실패");
    } finally {
      setBusy(null);
    }
  }, [loadDashboard]);

  const generateReport = useCallback(async () => {
    setBusy("report");
    setError(null);
    try {
      setReport((await callApi("generateReport")) as Report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "리포트 생성 실패");
    } finally {
      setBusy(null);
    }
  }, []);

  const selectedCompetitor = competitors.find((c) => c.competitorKey === selected) ?? null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="admin-card-static border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="admin-card-static p-4">
          <div className="text-xs text-gray-500">수집 문서</div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "—" : dashboard?.totals.documents ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            분석 대상 {dashboard?.totals.relevant ?? 0}건 (수험 글 제외)
          </div>
        </div>
        <div className="admin-card-static p-4">
          <div className="text-xs text-gray-500">경쟁사</div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "—" : dashboard?.totals.competitors ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">블로그 발행처 기준 자동 식별</div>
        </div>
        <div className="admin-card-static p-4">
          <div className="text-xs text-gray-500">최근 수집일</div>
          <div className="mt-1 text-2xl font-bold">
            {loading ? "—" : formatDate(dashboard?.lastCollectedAt ?? null)}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">매일 배치(content-sync) 자동 수집</div>
        </div>
      </div>

      {/* 액션 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={collectNow}
          disabled={busy !== null}
          className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {busy === "collect" ? "수집 중…" : "지금 수집"}
        </button>
        <button
          onClick={generateReport}
          disabled={busy !== null}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 disabled:opacity-50"
        >
          {busy === "report" ? "생성 중…" : "AI 리포트 생성"}
        </button>
        <span className="text-[11px] text-gray-500">AI 호출 — 1시간 캐시</span>
      </div>

      {/* AI 리포트 */}
      {report && (
        <div className="admin-card-static p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">AI 시장 리포트</h2>
            <span className="text-[11px] text-gray-500">
              {report.model ? `${report.model} · ` : ""}
              {formatDate(report.generatedAt)}
            </span>
          </div>
          {report.ok ? (
            <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700">{report.report}</div>
          ) : (
            <div className="text-xs text-gray-500">
              {report.skipped === "no_data"
                ? "수집된 데이터가 없습니다. 먼저 '지금 수집'을 실행해 주세요."
                : "리포트를 생성하지 못했습니다."}
            </div>
          )}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200">
        {(
          [
            ["competitors", "경쟁사"],
            ["sentiment", "여론"],
            ["trends", "급상승"]
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-xs font-medium ${
              tab === key ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 경쟁사 탭 */}
      {tab === "competitors" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="admin-card-static p-3">
            <h2 className="mb-2 text-sm font-semibold">경쟁사 목록</h2>
            {loading ? (
              <div className="text-xs text-gray-500">불러오는 중…</div>
            ) : competitors.length === 0 ? (
              <div className="text-xs text-gray-500">
                식별된 경쟁사가 없습니다. &apos;지금 수집&apos;을 실행해 주세요.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {competitors.map((c) => (
                  <li key={c.competitorKey}>
                    <button
                      onClick={() => openCompetitor(c.competitorKey)}
                      className={`w-full px-1 py-2 text-left hover:bg-gray-50 ${
                        selected === c.competitorKey ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-gray-900">{c.displayName}</span>
                        <span className="shrink-0 text-[11px] text-gray-500">
                          노출 {c.visibilityScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        게시 7일 {c.postingFreq7d}건 · 30일 {c.postingFreq30d}건
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.mainTopics.slice(0, 4).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                        {c.regionTags.slice(0, 3).map((r) => (
                          <Tag key={r}>{r}</Tag>
                        ))}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-card-static p-3">
            <h2 className="mb-2 text-sm font-semibold">
              {selectedCompetitor ? `${selectedCompetitor.displayName} 문서` : "경쟁사 문서"}
            </h2>
            {!selected ? (
              <div className="text-xs text-gray-500">왼쪽에서 경쟁사를 선택하세요.</div>
            ) : competitorDocs.length === 0 ? (
              <div className="text-xs text-gray-500">문서가 없습니다.</div>
            ) : (
              <ul className="space-y-2">
                {competitorDocs.map((d) => (
                  <li key={d.url} className="border-b border-gray-100 pb-2">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      {d.title}
                    </a>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${sentimentClass(d.sentiment)}`}>
                        {SENTIMENT_LABEL[d.sentiment] ?? d.sentiment}
                      </span>
                      <span className="text-[11px] text-gray-500">{formatDate(d.publishedAt)}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] text-gray-600">{d.snippet}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 여론 탭 */}
      {tab === "sentiment" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="admin-card-static p-3">
            <h2 className="mb-2 text-sm font-semibold">여론 분포</h2>
            {(dashboard?.sentimentBreakdown.length ?? 0) === 0 ? (
              <div className="text-xs text-gray-500">데이터가 없습니다.</div>
            ) : (
              <ul className="space-y-2">
                {dashboard?.sentimentBreakdown.map((s) => {
                  const total = dashboard.sentimentBreakdown.reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <li key={s.sentiment}>
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span>{SENTIMENT_LABEL[s.sentiment] ?? s.sentiment}</span>
                        <span>
                          {s.count}건 ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-gray-100">
                        <div className="h-1.5 rounded bg-gray-700" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <h3 className="mb-2 mt-4 text-sm font-semibold">최근 위험 신호</h3>
            {(dashboard?.recentRisks.length ?? 0) === 0 ? (
              <div className="text-xs text-gray-500">감지된 위험 신호가 없습니다.</div>
            ) : (
              <ul className="space-y-1.5">
                {dashboard?.recentRisks.slice(0, 8).map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-700 hover:underline"
                    >
                      {r.title}
                    </a>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {r.riskFlags.map((f) => (
                        <span key={f} className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                          {f}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-card-static p-3">
            <h2 className="mb-2 text-sm font-semibold">최근 부정 문서</h2>
            {negativeDocs.length === 0 ? (
              <div className="text-xs text-gray-500">부정 문서가 없습니다.</div>
            ) : (
              <ul className="space-y-2">
                {negativeDocs.map((d) => (
                  <li key={d.url} className="border-b border-gray-100 pb-2">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      {d.title}
                    </a>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <Tag>{d.sourceType}</Tag>
                      <Tag>{d.docType}</Tag>
                      <span className="text-[11px] text-gray-500">{d.publisherName ?? "—"}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] text-gray-600">{d.snippet}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 급상승 탭 */}
      {tab === "trends" && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="admin-card-static p-3">
            <h2 className="mb-2 text-sm font-semibold">데이터랩 검색 트렌드 (30일)</h2>
            {trends.length === 0 ? (
              <div className="text-xs text-gray-500">
                트렌드 데이터가 없습니다. 네이버 데이터랩 키가 설정되어 있는지 확인해 주세요.
              </div>
            ) : (
              <ul className="space-y-2">
                {trends.map((t) => (
                  <li key={t.keyword} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-medium text-gray-900">{t.keyword}</span>
                    <span className="text-[11px] text-gray-500">
                      최근 {t.latest.toFixed(1)}
                      <span className={t.change >= 0 ? "ml-2 text-green-700" : "ml-2 text-red-700"}>
                        {t.change >= 0 ? "▲" : "▼"} {Math.abs(t.change)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-card-static p-3">
            <h2 className="mb-2 text-sm font-semibold">주제 분포 (최근 30일)</h2>
            {(dashboard?.risingTopics.length ?? 0) === 0 ? (
              <div className="text-xs text-gray-500">데이터가 없습니다.</div>
            ) : (
              <ul className="space-y-2">
                {dashboard?.risingTopics.map((t) => {
                  const max = dashboard.risingTopics[0]?.count || 1;
                  return (
                    <li key={t.topic}>
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span>{t.topic}</span>
                        <span>{t.count}건</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-gray-100">
                        <div
                          className="h-1.5 rounded bg-gray-700"
                          style={{ width: `${Math.round((t.count / max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
