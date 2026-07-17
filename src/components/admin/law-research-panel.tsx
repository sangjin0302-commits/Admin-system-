"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Group = "법령" | "판례·심판" | "해석" | "서식" | "위원회" | "기타";

const GROUP_ORDER: Group[] = ["법령", "판례·심판", "해석", "서식", "위원회", "기타"];

type TargetSpec = {
  key: string;
  label: string;
  group: Group;
  hasFiles?: boolean;
  verified: boolean;
  supported: boolean;
};

type LawResultItem = {
  target: string;
  id: string;
  title: string;
  agency: string;
  date: string;
  number: string;
  detailUrl: string;
  hwpUrl?: string;
  pdfUrl?: string;
  extra: Record<string, string>;
};

type DetailData = {
  target: string;
  id: string;
  fields: Record<string, string>;
  detailUrl: string;
};

type LawFormFile = {
  formNo: string;
  formType: string;
  title: string;
  hwpUrl: string;
  pdfUrl: string;
};

type DetailPane =
  | { kind: "fields"; data: DetailData; item: LawResultItem }
  | { kind: "formFiles"; files: LawFormFile[]; item: LawResultItem }
  | null;

const LONG_TEXT_THRESHOLD = 200;

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

function LongText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > LONG_TEXT_THRESHOLD;
  return (
    <div>
      <div className="text-xs text-gray-700 whitespace-pre-wrap">
        {isLong && !open ? `${text.slice(0, LONG_TEXT_THRESHOLD)}…` : text}
      </div>
      {isLong && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-[11px] text-blue-700 hover:underline"
        >
          {open ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}

type CitationVerdict = {
  citation: { raw: string; lawName: string; article: string; citedTitle: string };
  status: "verified" | "content_mismatch" | "article_not_found" | "law_not_found" | "unchecked";
  actualTitle: string;
  detail: string;
  layer?: "exact" | "jaccard" | "none";
  score?: number;
};

type CitationVerifyResult = {
  total: number;
  verified: number;
  mismatched: number;
  notFound: number;
  verdicts: CitationVerdict[];
  hallucinationDetected: boolean;
};

/**
 * 인용 검증 — 초안 텍스트를 붙여넣으면 조문 인용을 법제처 원문과 대조한다.
 * AI가 지어낸 조문/제목을 서면에 넣기 전에 잡는 용도.
 */
function CitationVerifyBlock() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CitationVerifyResult | null>(null);

  const run = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = (await callApi("verifyCitations", { text })) as CitationVerifyResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "인용 검증 실패");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [text]);

  const alert = result?.hallucinationDetected ?? false;

  return (
    <div className="admin-card p-4 space-y-3">
      <div>
        <p className="ui-kicker">인용 검증</p>
        <p className="mt-1 text-sm text-text-muted">
          초안 텍스트를 붙여넣으면 「법령명 제N조(제목)」 인용을 법제처 원문과 대조합니다.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="검증할 초안 텍스트를 붙여넣으세요 (예: 「출입국관리법」 제24조(체류자격 변경허가)에 따라…)"
        rows={5}
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <button
        onClick={run}
        disabled={loading || !text.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
      >
        {loading ? "검증중..." : "검증"}
      </button>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {result && result.total === 0 && (
        <div className="text-sm text-gray-500">
          텍스트에서 조문 인용을 찾지 못했습니다.
        </div>
      )}

      {result && result.total > 0 && (
        <div
          className={`rounded border p-3 ${
            alert ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50"
          }`}
        >
          <div
            className={`text-xs font-semibold mb-2 ${
              alert ? "text-red-700" : "text-green-700"
            }`}
          >
            {alert
              ? `⚠️ 인용 오류 ${result.mismatched + result.notFound}건 감지`
              : `✅ 인용 검증 통과 (${result.verified}건)`}
          </div>
          <ul className="space-y-1">
            {result.verdicts.map((v, i) => {
              const ok = v.status === "verified";
              return (
                <li key={`${v.citation.raw}-${i}`} className="flex gap-2 text-xs">
                  <span className={ok ? "text-green-600" : "text-red-600"}>
                    {ok ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-800">
                    <span className="font-medium">{v.citation.raw}</span>
                    <span className="text-gray-600"> — {v.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

type LawFetchStatus =
  | "ok"
  | "empty"
  | "not_permitted"
  | "unknown_target"
  | "env_missing"
  | "upstream_error"
  | "parse_error";

type LawSearchOutcome = {
  status: LawFetchStatus;
  items: LawResultItem[];
  message: string;
  target: string;
};

type TargetHealth = {
  target: string;
  label: string;
  group: string;
  status: LawFetchStatus;
  itemCount: number;
  message: string;
  checkedAt: string;
};

type RegistryDrift = {
  target: string;
  kind: string;
  detail: string;
};

type LawHealthReport = {
  checkedAt: string;
  total: number;
  ok: number;
  empty: number;
  failed: number;
  skipped: number;
  results: TargetHealth[];
  /** 잠금 도입 이전에 저장된 리포트에는 없다 — optional로 둔다. */
  drift?: RegistryDrift[];
  lockedAt?: string;
};

function isFailureStatus(s: LawFetchStatus): boolean {
  return s !== "ok" && s !== "empty";
}

/**
 * target 상태 스트립 — 법제처는 없는 target에도 빈 200을 주므로,
 * "결과 없음"이 실은 파서 불일치인 경우를 여기서 드러낸다.
 * 기본 접힘 — 패널 본 목적(검색)을 가리지 않도록.
 */
function HealthStrip() {
  const [report, setReport] = useState<LawHealthReport | null>(null);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await callApi("getLawHealthReport", {})) as LawHealthReport | null;
        if (alive) setReport(data);
      } catch {
        // 리포트가 아직 없을 수 있다 — 조용히 넘어간다.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const data = (await callApi("runLawHealthCheck", {})) as LawHealthReport;
      setReport(data);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "헬스체크 실패");
    } finally {
      setRunning(false);
    }
  }, []);

  const failed = report?.results.filter((r) => isFailureStatus(r.status)) ?? [];
  const drift = report?.drift ?? [];

  return (
    <div className="admin-card px-4 py-2.5 space-y-2">
      {report?.lockedAt &&
        (drift.length > 0 ? (
          <div className="rounded border border-red-300 bg-red-50 px-2.5 py-2 space-y-1">
            <div className="text-[11px] font-medium text-red-800">
              ⚠️ registry가 검증 기준선에서 벗어났습니다 ({drift.length}건) — 실호출 검증 없이
              수정된 것일 수 있습니다
            </div>
            <ul className="space-y-0.5">
              {drift.map((d, i) => (
                <li key={`${d.target}-${i}`} className="text-[11px] text-red-700">
                  <span className="font-medium">{d.target}</span>
                  <span className="text-red-500"> [{d.kind}]</span> — {d.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-[11px] text-gray-400">
            🔒 검증 기준선 일치 ({report.lockedAt})
          </div>
        ))}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-700">
          {report ? (
            <>
              target 상태: ✅ {report.ok}정상 · ⚪ {report.empty}무결과 · ❌ {report.failed}실패
              <span className="text-gray-400">
                {" "}
                (최근 점검: {new Date(report.checkedAt).toLocaleDateString("ko-KR")})
              </span>
            </>
          ) : (
            <span className="text-gray-400">target 상태: 점검 기록 없음</span>
          )}
        </span>
        <button
          onClick={run}
          disabled={running}
          className="px-2 py-0.5 text-[11px] rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {running ? "점검중..." : "지금 점검"}
        </button>
        {report && failed.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[11px] text-blue-700 hover:underline"
          >
            {open ? "접기" : `실패 ${failed.length}건 보기`}
          </button>
        )}
      </div>

      {error && <div className="text-xs text-red-600">{error}</div>}

      {open && failed.length > 0 && (
        <ul className="space-y-1 border-t pt-2">
          {failed.map((r) => (
            <li key={r.target} className="text-[11px] text-gray-700">
              <span className="text-red-600">✗</span>{" "}
              <span className="font-medium">
                {r.label} ({r.target})
              </span>
              <span className="text-gray-500"> — {r.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LawResearchPanel({ initialKeyword = "" }: { initialKeyword?: string }) {
  const [byGroup, setByGroup] = useState<Record<string, TargetSpec[]>>({});
  const [group, setGroup] = useState<Group>("법령");
  const [target, setTarget] = useState<string>("law");
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LawResultItem[]>([]);
  const [detail, setDetail] = useState<DetailPane>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // prec: 사건번호 정확 검색 / law: 법령명 정확일치
  const [byCaseNumber, setByCaseNumber] = useState(false);
  const [lawExact, setLawExact] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = (await callApi("listTargetsByGroup", {})) as Record<string, TargetSpec[]>;
        if (!alive) return;
        setByGroup(data ?? {});
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "target 목록 조회 실패");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // initialKeyword가 있으면 law target 자동 선택 + 검색어 프리필 (자동 검색은 하지 않음)
  useEffect(() => {
    if (initialKeyword.trim()) {
      setGroup("법령");
      setTarget("law");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(
    () => GROUP_ORDER.filter((g) => (byGroup[g]?.length ?? 0) > 0),
    [byGroup]
  );
  const chips = byGroup[group] ?? [];
  const activeSpec = useMemo(
    () => Object.values(byGroup).flat().find((s) => s.key === target) ?? null,
    [byGroup, target]
  );

  const resetPanes = () => {
    setResults([]);
    setDetail(null);
    setError(null);
  };

  const search = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      if (target === "prec" && byCaseNumber) {
        const data = await callApi("searchPrecedentByNumber", {
          caseNumber: keyword,
          limit: 15
        });
        setResults(Array.isArray(data) ? (data as LawResultItem[]) : []);
      } else if (target === "law" && lawExact) {
        const data = await callApi("searchLawExact", { name: keyword, limit: 15 });
        setResults(Array.isArray(data) ? (data as LawResultItem[]) : []);
      } else {
        // 진단 가능 버전 — 실패를 "결과 없음"으로 뭉개지 않고 원인을 보여준다.
        const outcome = (await callApi("searchTargetDetailed", {
          target,
          keyword,
          limit: 15
        })) as LawSearchOutcome;
        setResults(outcome.items ?? []);
        if (isFailureStatus(outcome.status)) setError(outcome.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [target, keyword, byCaseNumber, lawExact]);

  const openDetail = useCallback(
    async (item: LawResultItem) => {
      if (!item.id) {
        setError("이 항목은 상세 조회용 일련번호가 없습니다.");
        return;
      }
      setDetailLoading(true);
      setDetail(null);
      setError(null);
      try {
        const d = (await callApi("getDetail", { target, id: item.id })) as DetailData | null;
        if (!d) {
          setError("상세 내용을 불러오지 못했습니다.");
          return;
        }
        setDetail({ kind: "fields", data: d, item });
      } catch (e) {
        setError(e instanceof Error ? e.message : "상세 조회 실패");
      } finally {
        setDetailLoading(false);
      }
    },
    [target]
  );

  const openFormFiles = useCallback(async (item: LawResultItem) => {
    setDetailLoading(true);
    setDetail(null);
    setError(null);
    try {
      const files = (await callApi("getLawFormFiles", { mst: item.id })) as LawFormFile[];
      setDetail({ kind: "formFiles", files: files ?? [], item });
    } catch (e) {
      setError(e instanceof Error ? e.message : "서식 파일 조회 실패");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return (
    <div className="space-y-4">
    {/* target 헬스 상태 — 기본 접힘 */}
    <HealthStrip />

    <div className="admin-card p-4 space-y-4">
      {/* Row 1 — 그룹 탭 */}
      <div className="flex gap-2 flex-wrap">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => {
              setGroup(g);
              const first = byGroup[g]?.[0];
              if (first) setTarget(first.key);
              resetPanes();
            }}
            className={`px-3 py-1.5 text-sm rounded ${
              group === g ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Row 2 — target 칩 */}
      <div className="flex gap-2 flex-wrap">
        {chips.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setTarget(s.key);
              resetPanes();
            }}
            className={`px-2.5 py-1 text-xs rounded border ${
              target === s.key
                ? "border-blue-600 text-blue-700 bg-blue-50"
                : "border-gray-200 text-gray-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 활성 target 표시 */}
      {activeSpec && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{activeSpec.label}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded ${
              activeSpec.verified
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {activeSpec.verified ? "실측 검증" : "추정"}
          </span>
        </div>
      )}

      {/* target별 부가 컨트롤 */}
      {target === "prec" && (
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={byCaseNumber}
            onChange={(e) => {
              setByCaseNumber(e.target.checked);
              resetPanes();
            }}
          />
          사건번호로 정확 검색 (예: 2013다51674)
        </label>
      )}
      {target === "law" && (
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={lawExact}
            onChange={(e) => {
              setLawExact(e.target.checked);
              resetPanes();
            }}
          />
          법령명 정확일치
        </label>
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

      {target === "aiSearch" && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          조문 본문까지 검색됩니다
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 결과 목록 */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {results.length === 0 && !loading && (
            <div className="text-sm text-gray-500">결과가 없습니다.</div>
          )}
          {results.map((it, idx) => (
            <div key={`${it.id}-${idx}`} className="border rounded p-3 hover:bg-gray-50">
              <div className="font-medium text-sm">{it.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {[it.agency, it.date, it.number].filter(Boolean).join(" · ")}
              </div>

              {target === "aiSearch" && it.extra["조문내용"] && (
                <div className="mt-2">
                  <LongText text={it.extra["조문내용"]} />
                </div>
              )}

              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={() => openDetail(it)}
                  className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  상세
                </button>
                {it.detailUrl && (
                  <a
                    href={it.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    원문
                  </a>
                )}
                {it.hwpUrl && (
                  <a
                    href={it.hwpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs rounded bg-blue-600 text-white"
                  >
                    ⬇ HWP
                  </a>
                )}
                {it.pdfUrl && (
                  <a
                    href={it.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs rounded bg-red-600 text-white"
                  >
                    ⬇ PDF
                  </a>
                )}
                {target === "law" && it.id && (
                  <button
                    onClick={() => openFormFiles(it)}
                    className="px-2 py-1 text-xs rounded border border-blue-600 text-blue-700 hover:bg-blue-50"
                  >
                    📎 서식·별표 보기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 상세 패널 */}
        <div className="border rounded p-3 max-h-[600px] overflow-y-auto bg-gray-50">
          {detailLoading && <div className="text-sm text-gray-500">불러오는 중...</div>}
          {!detailLoading && !detail && (
            <div className="text-sm text-gray-400">항목을 선택하면 상세 내용이 표시됩니다.</div>
          )}

          {detail?.kind === "formFiles" && (
            <div className="space-y-3">
              <div className="font-semibold">{detail.item.title || "별표·서식"}</div>
              {detail.files.length === 0 && (
                <div className="text-xs text-gray-500">등록된 별표·서식 파일이 없습니다.</div>
              )}
              {detail.files.map((f, i) => (
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

          {detail?.kind === "fields" && (
            <div className="space-y-3">
              <div className="font-semibold">{detail.item.title}</div>
              {detail.data.detailUrl && (
                <a
                  href={detail.data.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-blue-700 hover:underline"
                >
                  원문 보기
                </a>
              )}
              <dl className="space-y-2">
                {Object.entries(detail.data.fields).map(([k, v]) => (
                  <div key={k} className="border-b pb-2">
                    <dt className="text-[11px] font-medium text-blue-700">{k}</dt>
                    <dd className="mt-0.5">
                      {v.length > LONG_TEXT_THRESHOLD ? (
                        <LongText text={v} />
                      ) : (
                        <span className="text-xs text-gray-700">{v}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* 검색 아래 — 초안 인용 검증 */}
    <CitationVerifyBlock />
    </div>
  );
}
