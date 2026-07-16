"use client";

import { useCallback, useState } from "react";

type Tab =
  | "law"
  | "prec"
  | "decc"
  | "expc"
  | "cgm"
  | "admrul"
  | "ordin"
  | "form";

type FormScope = "form" | "admbyl" | "ordinbyl";

type LawFormFile = {
  formNo: string;
  formType: string;
  title: string;
  hwpUrl: string;
  pdfUrl: string;
};

const MINISTRIES = [
  { key: "molit", label: "국토교통부" },
  { key: "moel", label: "고용노동부" },
  { key: "nts", label: "국세청" }
] as const;

type MinistryKey = (typeof MINISTRIES)[number]["key"];

const FORM_SCOPE_ACTION: Record<FormScope, string> = {
  form: "searchForm",
  admbyl: "searchAdminRuleForm",
  ordinbyl: "searchOrdinanceForm"
};

const SEARCH_ACTION: Record<Exclude<Tab, "cgm" | "form">, string> = {
  law: "searchLaw",
  prec: "searchPrecedent",
  decc: "searchAdminJudgment",
  expc: "searchInterpretation",
  admrul: "searchAdminRule",
  ordin: "searchOrdinance"
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
  const [formScope, setFormScope] = useState<FormScope>("form");
  const [ministry, setMinistry] = useState<MinistryKey>("molit");
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
      let data: unknown;
      if (tab === "cgm") {
        data = await callApi("searchMinistryInterpretation", {
          ministry,
          keyword,
          limit: 15
        });
      } else if (tab === "form") {
        data = await callApi(FORM_SCOPE_ACTION[formScope], { keyword, limit: 15 });
      } else {
        data = await callApi(SEARCH_ACTION[tab], { keyword, limit: 15 });
      }
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [tab, keyword, ministry, formScope]);

  const openDetail = useCallback(
    async (item: any) => {
      setDetailLoading(true);
      setDetail(null);
      setError(null);
      try {
        if (tab === "law") {
          const d = await callApi("getLawDetail", { mst: item.mst });
          setDetail({ kind: "law", data: d, item });
        } else if (tab === "prec") {
          const d = await callApi("getPrecedentDetail", { caseId: item.caseId });
          setDetail({ kind: "prec", data: d ?? item });
        } else if (tab === "decc") {
          const d = await callApi("getAdminJudgmentDetail", { deccId: item.deccId });
          setDetail({ kind: "decc", data: d ?? item, item });
        } else if (tab === "expc") {
          const d = await callApi("getInterpretationDetail", { interpId: item.interpId });
          setDetail({ kind: "expc", data: d ?? item });
        } else if (tab === "cgm") {
          const d = await callApi("getMinistryInterpretationDetail", {
            ministry,
            interpId: item.interpId
          });
          setDetail({ kind: "expc", data: d ?? item });
        } else if (tab === "admrul") {
          const d = await callApi("getAdminRuleDetail", { ruleId: item.ruleId });
          setDetail({ kind: "admrul", data: d ?? item });
        } else if (tab === "ordin") {
          setDetail({ kind: "ordin", data: item });
        } else if (tab === "form") {
          setDetail({ kind: "form", data: item });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "상세 조회 실패");
      } finally {
        setDetailLoading(false);
      }
    },
    [tab, ministry]
  );

  const openFormFiles = useCallback(async (item: any) => {
    setDetailLoading(true);
    setDetail(null);
    setError(null);
    try {
      const files = (await callApi("getLawFormFiles", { mst: item.mst })) as LawFormFile[];
      setDetail({ kind: "formFiles", files: files ?? [], item });
    } catch (e) {
      setError(e instanceof Error ? e.message : "서식 파일 조회 실패");
    } finally {
      setDetailLoading(false);
    }
  }, []);

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
        {tabButton("decc", "행정심판 재결례")}
        {tabButton("expc", "법령해석례")}
        {tabButton("cgm", "부처 유권해석")}
        {tabButton("admrul", "행정규칙")}
        {tabButton("ordin", "자치법규")}
        {tabButton("form", "별표·서식")}
      </div>

      {tab === "cgm" && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">부처</label>
          <select
            value={ministry}
            onChange={(e) => {
              setMinistry(e.target.value as MinistryKey);
              setResults([]);
              setDetail(null);
            }}
            className="border rounded px-2 py-1.5 text-sm"
          >
            {MINISTRIES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === "form" && (
        <div className="flex gap-2 flex-wrap">
          {(
            [
              ["form", "법령 별표"],
              ["admbyl", "행정규칙 별표"],
              ["ordinbyl", "자치법규 별표"]
            ] as const
          ).map(([scope, label]) => (
            <button
              key={scope}
              onClick={() => {
                setFormScope(scope);
                setResults([]);
                setDetail(null);
              }}
              className={`px-2.5 py-1 text-xs rounded border ${
                formScope === scope
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search();
          }}
          placeholder="키워드 입력 (예: 건축허가, 영업정지)"
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
            <div key={idx} className="border rounded p-3 hover:bg-gray-50">
              <button onClick={() => openDetail(it)} className="w-full text-left">
                {tab === "law" && (
                  <>
                    <div className="font-medium text-sm">{it.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {it.lawType} · 시행 {it.effectiveDate}
                      {it.ministry ? ` · ${it.ministry}` : ""}
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
                {tab === "decc" && (
                  <>
                    <div className="font-medium text-sm">{it.caseName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {it.agency} · {it.caseNumber} · {it.date}
                    </div>
                  </>
                )}
                {(tab === "expc" || tab === "cgm") && (
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
                      {it.ruleType ? ` · ${it.ruleType}` : ""}
                    </div>
                  </>
                )}
                {tab === "ordin" && (
                  <>
                    <div className="font-medium text-sm">{it.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {it.region} · 시행 {it.date}
                    </div>
                  </>
                )}
                {tab === "form" && (
                  <>
                    <div className="font-medium text-sm">{it.formName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {it.lawName}
                      {it.formType ? ` · ${it.formType}` : ""}
                    </div>
                  </>
                )}
              </button>

              {tab === "law" && it.mst && (
                <button
                  onClick={() => openFormFiles(it)}
                  className="mt-2 px-2 py-1 text-xs rounded border border-blue-600 text-blue-700 hover:bg-blue-50"
                >
                  📎 서식·별표 보기
                </button>
              )}
              {tab === "form" && it.mst && (
                <button
                  onClick={() => openFormFiles(it)}
                  className="mt-2 px-2 py-1 text-xs rounded border border-blue-600 text-blue-700 hover:bg-blue-50"
                >
                  📎 파일 받기
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="border rounded p-3 max-h-[600px] overflow-y-auto bg-gray-50">
          {detailLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
          {!detailLoading && !detail && (
            <div className="text-sm text-gray-400">항목을 선택하면 상세 내용이 표시됩니다.</div>
          )}

          {detail?.kind === "formFiles" && (
            <div className="space-y-3">
              <div className="font-semibold">
                {detail.item?.name || detail.item?.formName || "별표·서식"}
              </div>
              {detail.files.length === 0 && (
                <div className="text-xs text-gray-500">
                  등록된 별표·서식 파일이 없습니다.
                </div>
              )}
              {detail.files.map((f: LawFormFile, i: number) => (
                <div key={i} className="border rounded bg-white p-2">
                  <div className="text-xs font-medium text-gray-800">
                    {f.formType} {f.formNo} {f.title}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {f.hwpUrl && (
                      <a
                        href={f.hwpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs rounded bg-blue-600 text-white"
                      >
                        ⬇ HWP
                      </a>
                    )}
                    {f.pdfUrl && (
                      <a
                        href={f.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs rounded bg-red-600 text-white"
                      >
                        ⬇ PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {detail?.kind === "law" && detail.data && (
            <div className="space-y-3">
              <div className="font-semibold">
                {detail.data.법령명_한글 ?? detail.data.기본정보?.법령명_한글 ?? detail.item?.name}
              </div>
              {(() => {
                const raw = detail.data?.조문?.조문단위 ?? detail.data?.조문단위 ?? [];
                const articles = Array.isArray(raw) ? raw : [raw];
                return articles.slice(0, 30).map((a: any, i: number) => (
                  <div key={i} className="border-b pb-2">
                    <div className="text-xs font-medium text-blue-700">
                      {a?.조문번호 ? `제${a.조문번호}조` : ""} {a?.조문제목 ?? ""}
                    </div>
                    <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
                      {typeof a?.조문내용 === "string" ? a.조문내용 : ""}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {detail?.kind === "prec" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">
                {detail.data.사건명 ?? detail.data.caseName}
              </div>
              <div className="text-xs text-gray-500">
                {detail.data.법원명 ?? detail.data.courtName} ·{" "}
                {detail.data.사건번호 ?? detail.data.caseNumber}
              </div>
              <div className="text-xs whitespace-pre-wrap text-gray-700">
                {String(
                  detail.data.판례내용 ?? detail.data.판결요지 ?? detail.data.summary ?? ""
                ).slice(0, 8000)}
              </div>
            </div>
          )}

          {detail?.kind === "decc" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">
                {detail.data.사건명 ?? detail.data.caseName ?? detail.item?.caseName}
              </div>
              <div className="text-xs text-gray-500">
                {detail.data.처분청 ?? detail.item?.agency} ·{" "}
                {detail.data.사건번호 ?? detail.item?.caseNumber} ·{" "}
                {detail.data.의결일자 ?? detail.item?.date}
              </div>
              <div className="text-xs whitespace-pre-wrap text-gray-700">
                {String(
                  detail.data.주문 ?? detail.data.재결요지 ?? detail.data.이유 ?? ""
                ).slice(0, 8000)}
              </div>
            </div>
          )}

          {detail?.kind === "expc" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">
                {detail.data.안건명 ?? detail.data.title}
              </div>
              <div className="text-xs text-gray-500">
                {detail.data.회신기관명 ?? detail.data.agency}
                {detail.data.회신일자 || detail.data.date
                  ? ` · ${detail.data.회신일자 ?? detail.data.date}`
                  : ""}
              </div>
              {(detail.data.질의요지 || detail.data.question) && (
                <div>
                  <div className="text-xs font-medium text-blue-700 mt-2">질의요지</div>
                  <div className="text-xs whitespace-pre-wrap text-gray-700">
                    {detail.data.질의요지 ?? detail.data.question}
                  </div>
                </div>
              )}
              {(detail.data.회답 || detail.data.answer) && (
                <div>
                  <div className="text-xs font-medium text-blue-700 mt-2">회답</div>
                  <div className="text-xs whitespace-pre-wrap text-gray-700">
                    {detail.data.회답 ?? detail.data.answer}
                  </div>
                </div>
              )}
              {detail.data.이유 && (
                <div>
                  <div className="text-xs font-medium text-blue-700 mt-2">이유</div>
                  <div className="text-xs whitespace-pre-wrap text-gray-700">
                    {String(detail.data.이유).slice(0, 8000)}
                  </div>
                </div>
              )}
            </div>
          )}

          {detail?.kind === "admrul" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">
                {detail.data.행정규칙명 ?? detail.data.name}
              </div>
              <div className="text-xs text-gray-500">
                {detail.data.소관부처명 ?? detail.data.agency}
              </div>
              <div className="text-xs whitespace-pre-wrap text-gray-700">
                {String(detail.data.조문내용 ?? detail.data.내용 ?? "").slice(0, 8000)}
              </div>
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

          {detail?.kind === "form" && detail.data && (
            <div className="space-y-2">
              <div className="font-semibold">{detail.data.formName}</div>
              <div className="text-xs text-gray-500">
                {detail.data.lawName}
                {detail.data.formType ? ` · ${detail.data.formType}` : ""}
              </div>
              {detail.data.mst ? (
                <button
                  onClick={() => openFormFiles(detail.data)}
                  className="px-2 py-1 text-xs rounded border border-blue-600 text-blue-700 hover:bg-blue-50"
                >
                  📎 파일 받기 (HWP/PDF)
                </button>
              ) : (
                <div className="text-xs text-gray-500">
                  이 별표는 연결된 법령 일련번호가 없어 파일을 조회할 수 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
