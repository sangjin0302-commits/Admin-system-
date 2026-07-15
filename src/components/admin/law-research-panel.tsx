"use client";

import { useCallback, useState } from "react";

type Tab = "law" | "prec" | "expc" | "admrul" | "form" | "ordin" | "trty";

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

const SEARCH_ACTION: Record<Tab, string> = {
  law: "searchLaw",
  prec: "searchPrecedent",
  expc: "searchInterpretation",
  admrul: "searchAdminRule",
  form: "searchForm",
  ordin: "searchOrdinance",
  trty: "searchTreaty"
};

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
      const data = await callApi(SEARCH_ACTION[tab], { keyword, limit: 15 });
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [tab, keyword]);

  const openDetail = useCallback(
    async (item: any) => {
      setDetailLoading(true);
      setDetail(null);
      try {
        if (tab === "law") {
          const d = await callApi("getLawArticle", { lawId: item.lawId });
          setDetail({ kind: "law", data: d });
        } else if (tab === "prec") {
          const d = await callApi("getPrecedentDetail", { caseId: item.caseId });
          setDetail({ kind: "prec", data: d });
        } else if (tab === "expc") {
          const d = await callApi("getInterpretationDetail", { interpId: item.interpId });
          setDetail({ kind: "expc", data: d ?? item });
        } else if (tab === "admrul") {
          const d = await callApi("getAdminRuleDetail", { ruleId: item.ruleId });
          setDetail({ kind: "admrul", data: d });
        } else if (tab === "form") {
          setDetail({ kind: "form", data: item });
        } else if (tab === "ordin") {
          setDetail({ kind: "ordin", data: item });
        } else if (tab === "trty") {
          setDetail({ kind: "trty", data: item });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "상세 조회 실패");
      } finally {
        setDetailLoading(false);
      }
    },
    [tab]
  );

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
      <div className="flex gap-2 flex-wrap">
        {tabButton("law", "법령")}
        {tabButton("prec", "판례")}
        {tabButton("expc", "해석례")}
        {tabButton("admrul", "행정규칙")}
        {tabButton("form", "서식")}
        {tabButton("ordin", "자치법규")}
        {tabButton("trty", "조약")}
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
                  <div className="font-medium text-sm">{it.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {it.lawType} · 시행 {it.effectiveDate}
                  </div>
                </>
              )}
              {tab === "prec" && (
                <>
                  <div className="font-medium text-sm">{it.caseName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {it.courtName} · {it.caseNumber} · {it.judgmentDate}
                  </div>
                  {it.summary && (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">{it.summary}</div>
                  )}
                </>
              )}
              {tab === "expc" && (
                <>
                  <div className="font-medium text-sm">{it.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {it.agency} · {it.date}
                  </div>
                </>
              )}
              {tab === "admrul" && (
                <>
                  <div className="font-medium text-sm">{it.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {it.agency} · {it.date}
                  </div>
                </>
              )}
              {tab === "form" && (
                <>
                  <div className="font-medium text-sm">{it.formName}</div>
                  <div className="text-xs text-gray-500 mt-1">{it.lawName}</div>
                </>
              )}
              {tab === "ordin" && (
                <>
                  <div className="font-medium text-sm">{it.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {it.region} · {it.date}
                  </div>
                </>
              )}
              {tab === "trty" && (
                <>
                  <div className="font-medium text-sm">{it.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {it.counterpart} · {it.date}
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
                  <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{a.content}</div>
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
                {detail.data.agency}
                {detail.data.date ? ` · ${detail.data.date}` : ""}
              </div>
              {detail.data.question && (
                <div>
                  <div className="text-xs font-medium text-blue-700 mt-2">질의요지</div>
                  <div className="text-xs whitespace-pre-wrap text-gray-700">
                    {detail.data.question}
                  </div>
                </div>
              )}
              {detail.data.answer && (
                <div>
                  <div className="text-xs font-medium text-blue-700 mt-2">회신내용</div>
                  <div className="text-xs whitespace-pre-wrap text-gray-700">
                    {detail.data.answer}
                  </div>
                </div>
              )}
              {!detail.data.question && detail.data.summary && (
                <div className="text-xs whitespace-pre-wrap text-gray-700">
                  {detail.data.summary}
                </div>
              )}
            </div>
          )}
          {detail?.kind === "admrul" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">{detail.data.name}</div>
              <div className="text-xs text-gray-500">{detail.data.agency}</div>
              <div className="text-xs whitespace-pre-wrap text-gray-700">
                {detail.data.content?.slice(0, 8000)}
              </div>
            </div>
          )}
          {detail?.kind === "form" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">{detail.data.formName}</div>
              <div className="text-xs text-gray-500">{detail.data.lawName}</div>
              {detail.data.downloadUrl && (
                <a
                  href={detail.data.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs text-blue-600 underline"
                >
                  서식 다운로드
                </a>
              )}
            </div>
          )}
          {detail?.kind === "ordin" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">{detail.data.name}</div>
              <div className="text-xs text-gray-500">
                {detail.data.region} · 시행 {detail.data.date}
              </div>
            </div>
          )}
          {detail?.kind === "trty" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">{detail.data.name}</div>
              <div className="text-xs text-gray-500">
                {detail.data.counterpart} · {detail.data.date}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
