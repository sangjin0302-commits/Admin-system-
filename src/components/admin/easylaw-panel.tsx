"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  LifeLawSearchItem,
  LifeClassItem,
  LifeAreaItem,
  LifeGenericItem,
  LifeCaseItem,
  LifeCaseBundle,
  EngAreaItem,
  EngRuleClassItem,
  EngContentItem,
  MqnaClassItem,
  MqnaQaItem,
  MqnaDetail
} from "@/lib/services/easylaw-service";

type Tab = "search" | "browse" | "english" | "mqna";

async function callApi(action: string, params: Record<string, unknown> = {}) {
  const res = await fetch("/api/admin/easylaw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params })
  });
  const json = await res.json();
  if (!json?.ok) throw new Error(json?.error || "요청 실패");
  return json.data;
}

function FieldList({ items }: { items: LifeGenericItem[] }) {
  if (items.length === 0) {
    return <div className="text-xs text-gray-500">결과가 없습니다.</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <dl key={idx} className="border rounded p-2 text-xs space-y-0.5">
          {Object.entries(it.fields).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="text-gray-500 shrink-0 min-w-[7rem]">{k}</dt>
              <dd className="text-gray-800 break-all">{v}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}

function CaseSection({ title, items }: { title: string; items: LifeGenericItem[] }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold">
        {title} <span className="text-xs text-gray-400">({items.length})</span>
      </h3>
      <FieldList items={items} />
    </section>
  );
}

/** 판시사항/판결요지 등 장문 — 기본 8줄 클램프 + 더보기 토글 */
function LongText({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] font-medium text-gray-500">{label}</div>
      <div
        className={`text-xs text-gray-800 whitespace-pre-wrap ${open ? "" : "line-clamp-[8]"}`}
      >
        {text}
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] text-blue-700 hover:underline"
      >
        {open ? "접기" : "더보기"}
      </button>
    </div>
  );
}

function CaseList({ items }: { items: LifeCaseItem[] }) {
  if (items.length === 0) {
    return <div className="text-xs text-gray-500">결과가 없습니다.</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((it, idx) => {
        const crumb = [it.className, it.itemName].filter(Boolean).join(" > ");
        return (
          <article key={idx} className="border rounded p-2.5 space-y-1.5">
            <div className="text-sm font-medium text-gray-900 break-words">
              {it.display || "(표시 정보 없음)"}
            </div>
            {crumb && <div className="text-xs text-gray-400">{crumb}</div>}
            <LongText label="판시사항" text={it.issue} />
            <LongText label="판결요지" text={it.gist} />
          </article>
        );
      })}
    </div>
  );
}

function CaseItemSection({ title, items }: { title: string; items: LifeCaseItem[] }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold">
        {title} <span className="text-xs text-gray-400">({items.length})</span>
      </h3>
      <CaseList items={items} />
    </section>
  );
}

export function EasylawPanel() {
  const [tab, setTab] = useState<Tab>("search");
  const [error, setError] = useState<string | null>(null);

  // Tab 1 — 통합검색
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<LifeLawSearchItem[]>([]);
  const [bundle, setBundle] = useState<LifeCaseBundle | null>(null);
  const [bundleLoading, setBundleLoading] = useState(false);

  // Tab 2 — 생활분야 탐색
  const [classes, setClasses] = useState<LifeClassItem[]>([]);
  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [areas, setAreas] = useState<LifeAreaItem[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [notices, setNotices] = useState<LifeGenericItem[]>([]);
  const [lawsSystem, setLawsSystem] = useState<LifeGenericItem[]>([]);
  const [areaDetailLoading, setAreaDetailLoading] = useState(false);

  // Tab 3 — 영문 생활법령
  const [engAreas, setEngAreas] = useState<EngAreaItem[]>([]);
  const [engActiveArea, setEngActiveArea] = useState<string | null>(null);
  const [engClasses, setEngClasses] = useState<EngRuleClassItem[]>([]);
  const [engClassesLoading, setEngClassesLoading] = useState(false);
  const [engContent, setEngContent] = useState<EngContentItem[]>([]);
  const [engContentLoading, setEngContentLoading] = useState(false);

  // Tab 4 — 백문백답
  const [mqnaClasses, setMqnaClasses] = useState<MqnaClassItem[]>([]);
  const [mqnaActive, setMqnaActive] = useState<string | null>(null);
  const [mqnaQa, setMqnaQa] = useState<MqnaQaItem[]>([]);
  const [mqnaQaLoading, setMqnaQaLoading] = useState(false);
  const [mqnaDetail, setMqnaDetail] = useState<MqnaDetail | null>(null);
  const [mqnaDetailLoading, setMqnaDetailLoading] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setBundle(null);
    try {
      setResults((await callApi("searchLifeLaw", { query, page: 1, pageSize: 10 })) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
    } finally {
      setSearching(false);
    }
  }, [query]);

  const openBundle = useCallback(async (item: LifeLawSearchItem) => {
    setBundleLoading(true);
    setBundle(null);
    setError(null);
    try {
      setBundle(
        (await callApi("getLifeCaseBundle", {
          csmSeq: item.csmSeq,
          ccfNo: item.ccfNo,
          cciNo: item.cciNo,
          cnpClsNo: item.cnpClsNo
        })) ?? null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "판례 조회 실패");
    } finally {
      setBundleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "browse" || classes.length > 0) return;
    (async () => {
      try {
        setClasses((await callApi("listLifeClasses")) ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "분류 조회 실패");
      }
    })();
  }, [tab, classes.length]);

  const openClass = useCallback(async (id: string) => {
    setActiveClass(id);
    setAreasLoading(true);
    setAreas([]);
    setNotices([]);
    setLawsSystem([]);
    setError(null);
    try {
      setAreas((await callApi("listLifeAreas", { csmAstSeq: id })) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생활분야 조회 실패");
    } finally {
      setAreasLoading(false);
    }
  }, []);

  const openArea = useCallback(async (csmSeq: string) => {
    setAreaDetailLoading(true);
    setNotices([]);
    setLawsSystem([]);
    setError(null);
    try {
      const [n, s] = await Promise.all([
        callApi("getLifeAskNotices", { csmSeq }),
        callApi("getLifeLawsSystem", { csmSeq })
      ]);
      setNotices(n ?? []);
      setLawsSystem(s ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "상세 조회 실패");
    } finally {
      setAreaDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "english" || engAreas.length > 0) return;
    (async () => {
      try {
        setEngAreas((await callApi("listEnglishAreas")) ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "영문 분야 조회 실패");
      }
    })();
  }, [tab, engAreas.length]);

  const openEngArea = useCallback(async (csmSeq: string) => {
    setEngActiveArea(csmSeq);
    setEngClassesLoading(true);
    setEngClasses([]);
    setEngContent([]);
    setError(null);
    try {
      setEngClasses((await callApi("listEnglishRuleClasses", { csmSeq })) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "영문 분류 조회 실패");
    } finally {
      setEngClassesLoading(false);
    }
  }, []);

  const openEngContent = useCallback(async (c: EngRuleClassItem) => {
    setEngContentLoading(true);
    setEngContent([]);
    setError(null);
    try {
      setEngContent(
        (await callApi("getEnglishContent", {
          csmSeq: c.csmSeq,
          ccfNo: c.ccfNo,
          cciNo: c.cciNo,
          cnpClsNo: c.cnpClsNo
        })) ?? []
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "영문 본문 조회 실패");
    } finally {
      setEngContentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "mqna" || mqnaClasses.length > 0) return;
    (async () => {
      try {
        setMqnaClasses((await callApi("listMqnaClasses")) ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "백문백답 분류 조회 실패");
      }
    })();
  }, [tab, mqnaClasses.length]);

  const openMqnaClass = useCallback(async (c: MqnaClassItem) => {
    setMqnaActive(`${c.onhunqnaAstSeq}:${c.onhunqueAstSeq}`);
    setMqnaQaLoading(true);
    setMqnaQa([]);
    setMqnaDetail(null);
    setError(null);
    try {
      setMqnaQa(
        (await callApi("listMqnaQa", {
          onhunqnaAstSeq: c.onhunqnaAstSeq,
          onhunqueAstSeq: c.onhunqueAstSeq
        })) ?? []
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "백문백답 목록 조회 실패");
    } finally {
      setMqnaQaLoading(false);
    }
  }, []);

  const openMqnaDetail = useCallback(async (q: MqnaQaItem) => {
    setMqnaDetailLoading(true);
    setMqnaDetail(null);
    setError(null);
    try {
      setMqnaDetail(
        (await callApi("getMqnaDetail", {
          onhunqnaAstSeq: q.onhunqnaAstSeq,
          onhunqueSeq: q.onhunqueSeq
        })) ?? null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "상세 조회 실패");
    } finally {
      setMqnaDetailLoading(false);
    }
  }, []);

  const tabButton = (id: Tab, label: string) => (
    <button
      key={id}
      onClick={() => {
        setTab(id);
        setError(null);
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
        {tabButton("search", "통합검색")}
        {tabButton("browse", "생활분야 탐색")}
        {tabButton("english", "영문 생활법령")}
        {tabButton("mqna", "백문백답")}
      </div>

      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
        일일 100회 제한 — 결과는 24시간 캐시됩니다
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {tab === "search" && (
        <>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search();
              }}
              placeholder="키워드 입력 (예: 건축 인허가)"
              className="flex-1 border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={search}
              disabled={searching}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              {searching ? "검색중..." : "검색"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {results.length === 0 && !searching && (
                <div className="text-sm text-gray-500">결과가 없습니다.</div>
              )}
              {results.map((it, idx) => (
                <div key={idx} className="border rounded p-3 hover:bg-gray-50 space-y-1">
                  <div className="font-medium text-sm">{it.title}</div>
                  {it.tree && <div className="text-xs text-gray-400">{it.tree}</div>}
                  {it.summary && <div className="text-xs text-gray-600">{it.summary}</div>}
                  <button
                    onClick={() => openBundle(it)}
                    className="mt-1 px-2 py-1 text-xs rounded border border-blue-600 text-blue-700"
                  >
                    📚 판례·재결례 보기
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {bundleLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
              {!bundleLoading && !bundle && (
                <div className="text-sm text-gray-500">
                  왼쪽 결과에서 &quot;판례·재결례 보기&quot;를 눌러 주세요.
                </div>
              )}
              {bundle && (
                <>
                  <CaseItemSection title="대법원판례" items={bundle.precedents} />
                  <CaseItemSection title="행정심판재결례" items={bundle.adminReferees} />
                  <CaseItemSection title="헌재결정례" items={bundle.constitutional} />
                  <CaseItemSection title="법령해석례" items={bundle.interpretations} />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "browse" && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {classes.length === 0 && (
              <div className="text-sm text-gray-500">분류를 불러오는 중...</div>
            )}
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => openClass(c.id)}
                className={`px-2.5 py-1 text-xs rounded border ${
                  activeClass === c.id
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {areasLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
              {!areasLoading && areas.length === 0 && (
                <div className="text-sm text-gray-500">분류를 선택해 주세요.</div>
              )}
              {areas.map((a, idx) => (
                <button
                  key={idx}
                  onClick={() => openArea(a.csmSeq)}
                  className="w-full text-left border rounded p-3 hover:bg-gray-50"
                >
                  <div className="font-medium text-sm">{a.title}</div>
                  {a.summary && <div className="text-xs text-gray-600 mt-0.5">{a.summary}</div>}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {areaDetailLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
              {!areaDetailLoading && notices.length === 0 && lawsSystem.length === 0 && (
                <div className="text-sm text-gray-500">생활분야 항목을 선택해 주세요.</div>
              )}
              {(notices.length > 0 || lawsSystem.length > 0) && (
                <>
                  <CaseSection title="주요 궁금사항" items={notices} />
                  <CaseSection title="법령체계도" items={lawsSystem} />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {tab === "english" && (
        <>
          <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-1">
            외국인 고객 상담 시 영문 자료로 활용
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {engAreas.length === 0 && (
                <div className="text-sm text-gray-500">영문 분야를 불러오는 중...</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {engAreas.map((a) => (
                  <button
                    key={a.csmSeq}
                    onClick={() => openEngArea(a.csmSeq)}
                    className={`text-left border rounded p-3 hover:bg-gray-50 ${
                      engActiveArea === a.csmSeq ? "border-blue-600 bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-medium text-sm">{a.title}</div>
                    {a.description && (
                      <div className="text-xs text-gray-600 mt-0.5 line-clamp-3">
                        {a.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {engClassesLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
              {!engClassesLoading && engClasses.length === 0 && (
                <div className="text-sm text-gray-500">분야를 선택해 주세요.</div>
              )}
              <div className="flex gap-1.5 flex-wrap">
                {engClasses.map((c, idx) => (
                  <button
                    key={`${c.cnpClsNo}-${idx}`}
                    onClick={() => openEngContent(c)}
                    className="px-2.5 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {c.name || "(no name)"}
                  </button>
                ))}
              </div>

              {engContentLoading && <div className="text-sm text-gray-500">본문 조회 중...</div>}
              {engContent.map((c, idx) => (
                <article key={idx} className="border rounded p-2.5 space-y-1.5">
                  <LongText label="Content" text={c.body} />
                  <LongText label="Rule" text={c.ruleDesc} />
                </article>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "mqna" && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {mqnaClasses.length === 0 && (
              <div className="text-sm text-gray-500">분류를 불러오는 중...</div>
            )}
            {mqnaClasses.map((c, idx) => {
              const id = `${c.onhunqnaAstSeq}:${c.onhunqueAstSeq}`;
              return (
                <button
                  key={`${id}-${idx}`}
                  onClick={() => openMqnaClass(c)}
                  className={`px-2.5 py-1 text-xs rounded border ${
                    mqnaActive === id
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {c.categoryName || c.areaName || "(분류)"}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {mqnaQaLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
              {!mqnaQaLoading && mqnaQa.length === 0 && (
                <div className="text-sm text-gray-500">분류를 선택해 주세요.</div>
              )}
              {mqnaQa.map((q, idx) => (
                <article key={`${q.onhunqueSeq}-${idx}`} className="border rounded p-3 space-y-1.5">
                  <div className="font-medium text-sm break-words">
                    {q.question || "(질문 없음)"}
                  </div>
                  {q.subject && <div className="text-xs text-gray-400">{q.subject}</div>}
                  <LongText label="답변" text={q.answer} />
                  <button
                    onClick={() => openMqnaDetail(q)}
                    className="mt-1 px-2 py-1 text-xs rounded border border-blue-600 text-blue-700"
                  >
                    상세
                  </button>
                </article>
              ))}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {mqnaDetailLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
              {!mqnaDetailLoading && !mqnaDetail && (
                <div className="text-sm text-gray-500">&quot;상세&quot;를 눌러 주세요.</div>
              )}
              {mqnaDetail && (
                <>
                  <section className="space-y-1">
                    <h3 className="text-sm font-semibold">
                      첨부파일{" "}
                      <span className="text-xs text-gray-400">({mqnaDetail.files.length})</span>
                    </h3>
                    {mqnaDetail.files.length === 0 && (
                      <div className="text-xs text-gray-500">결과가 없습니다.</div>
                    )}
                    {mqnaDetail.files.map((f, idx) => (
                      <div key={idx} className="text-xs">
                        {f.url ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline break-all"
                          >
                            {f.name || f.url} {f.ext && `(${f.ext})`}
                          </a>
                        ) : (
                          <span className="text-gray-600">{f.name}</span>
                        )}
                      </div>
                    ))}
                  </section>

                  <section className="space-y-1">
                    <h3 className="text-sm font-semibold">
                      관련 법령{" "}
                      <span className="text-xs text-gray-400">({mqnaDetail.laws.length})</span>
                    </h3>
                    {mqnaDetail.laws.length === 0 && (
                      <div className="text-xs text-gray-500">결과가 없습니다.</div>
                    )}
                    {mqnaDetail.laws.map((l, idx) => (
                      <div key={idx} className="text-xs text-gray-800">
                        {l.name}
                      </div>
                    ))}
                  </section>

                  <section className="space-y-1">
                    <h3 className="text-sm font-semibold">
                      관련 생활법령{" "}
                      <span className="text-xs text-gray-400">({mqnaDetail.related.length})</span>
                    </h3>
                    {mqnaDetail.related.length === 0 && (
                      <div className="text-xs text-gray-500">결과가 없습니다.</div>
                    )}
                    {mqnaDetail.related.map((r, idx) => (
                      <div key={idx} className="text-xs">
                        {r.linkUrl ? (
                          <a
                            href={r.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline break-all"
                          >
                            {r.title || r.linkUrl}
                          </a>
                        ) : (
                          <span className="text-gray-800">{r.title}</span>
                        )}
                        {r.className && <span className="text-gray-400"> · {r.className}</span>}
                      </div>
                    ))}
                  </section>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
