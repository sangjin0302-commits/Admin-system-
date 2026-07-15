"use client";

import { useCallback, useState } from "react";

type Tab = "law" | "prec" | "expc";

type LawItem = {
  lawId: string;
  name: string;
  lawType: string;
  effectiveDate: string;
  promulgationNo: string;
};
type PrecItem = {
  caseId: string;
  caseName: string;
  courtName: string;
  caseNumber: string;
  judgmentDate: string;
  summary: string;
};
type ExpcItem = {
  interpId: string;
  title: string;
  agency: string;
  date: string;
  summary: string;
};

async function callApi(action: string, params: Record<string, unknown>) {
  const res = await fetch("/api/admin/law-research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params })
  });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "요청 실패");
  return json.data;
}

export function LawResearchPanel({ initialKeyword = "" }: { initialKeyword?: string }) {
  const [tab, setTab] = useState<Tab>("law");
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const search = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const action =
        tab === "law" ? "searchLaw" : tab === "prec" ? "searchPrecedent" : "searchInterpretation";
      const data = await callApi(action, { keyword, limit: 15 });
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [tab, keyword]);

  const openDetail = useCallback(async (item: any) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      if (tab === "law") {
        const d = await callApi("getLawArticle", { lawId: item.lawId });
        setDetail({ kind: "law", data: d });
      } else if (tab === "prec") {
        const d = await callApi("getPrecedentDetail", { caseId: item.caseId });
        setDetail({ kind: "prec", data: d });
      } else {
        setDetail({ kind: "expc", data: item });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "상세 조회 실패");
    } finally {
      setDetailLoading(false);
    }
  }, [tab]);

  const tabButton = (id: Tab, label: string) => (
    <button
      key={id}
      onClick={() => {
        setTab(id);
        setResults([]);
        setDetail(null);
      }}
      className={`px-3 py-1.5 text-sm rounded ${
        tab === id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="admin-card p-4 space-y-4">
      <div className="flex gap-2">
        {tabButton("law", "법령 검색")}
        {tabButton("prec", "판례 검색")}
        {tabButton("expc", "해석례 검색")}
      </div>

      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder="키워드 입력 (예: 임대차, 정당방위)"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? "검색중..." : "검색"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {results.length === 0 && !loading && (
            <div className="text-sm text-gray-500">결과가 없습니다.</div>
          )}
          {results.map((it, idx) => (
            <button
              key={idx}
              onClick={() => openDetail(it)}
              className="w-full text-left border rounded p-3 hover:bg-gray-50"
            >
              {tab === "law" && (
                <>
                  <div className="font-medium text-sm">{(it as LawItem).name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(it as LawItem).lawType} · 시행 {(it as LawItem).effectiveDate}
                  </div>
                </>
              )}
              {tab === "prec" && (
                <>
                  <div className="font-medium text-sm">{(it as PrecItem).caseName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(it as PrecItem).courtName} · {(it as PrecItem).caseNumber} ·{" "}
                    {(it as PrecItem).judgmentDate}
                  </div>
                  {(it as PrecItem).summary && (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {(it as PrecItem).summary}
                    </div>
                  )}
                </>
              )}
              {tab === "expc" && (
                <>
                  <div className="font-medium text-sm">{(it as ExpcItem).title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(it as ExpcItem).agency} · {(it as ExpcItem).date}
                  </div>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="border rounded p-3 max-h-[600px] overflow-y-auto bg-gray-50">
          {detailLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
          {!detailLoading && !detail && (
            <div className="text-sm text-gray-400">항목을 선택하면 상세 내용이 표시됩니다.</div>
          )}
          {detail?.kind === "law" && detail.data && (
            <div className="space-y-3">
              <div className="font-semibold">{detail.data.name}</div>
              {(detail.data.articles ?? []).slice(0, 30).map((a: any, i: number) => (
                <div key={i} className="border-b pb-2">
                  <div className="text-xs font-medium text-blue-700">
                    제{a.article}조 {a.title}
                  </div>
                  <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
                    {a.content}
                  </div>
                </div>
              ))}
            </div>
          )}
          {detail?.kind === "prec" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">{detail.data.caseName}</div>
              {detail.data.relatedLaws?.length > 0 && (
                <div className="text-xs">
                  <span className="text-gray-500">관련법령: </span>
                  {detail.data.relatedLaws.join(", ")}
                </div>
              )}
              <div className="text-xs whitespace-pre-wrap text-gray-700">
                {detail.data.fullText?.slice(0, 5000)}
              </div>
            </div>
          )}
          {detail?.kind === "expc" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">{detail.data.title}</div>
              <div className="text-xs text-gray-500">
                {detail.data.agency} · {detail.data.date}
              </div>
              <div className="text-xs whitespace-pre-wrap text-gray-700">
                {detail.data.summary}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
