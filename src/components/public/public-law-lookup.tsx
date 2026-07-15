"use client";

import Link from "next/link";
import { useState } from "react";

type LawItem = {
  lawId: string;
  name: string;
  lawType: string;
  effectiveDate: string;
};
type PrecItem = {
  caseName: string;
  courtName: string;
  caseNumber: string;
  judgmentDate: string;
};
type InterpItem = { title: string; agency: string; date: string };

type SearchResponse =
  | {
      ok: true;
      data: { laws: LawItem[]; precedents: PrecItem[]; interpretations: InterpItem[] };
      remaining: number;
      resetAt: number;
    }
  | { ok: false; error: string; remaining?: number; resetAt?: number };

const LAW_GO_KR = "https://www.law.go.kr";

function lawLink(name: string) {
  return `${LAW_GO_KR}/법령/${encodeURIComponent(name)}`;
}
function precedentLink(caseNumber: string) {
  return `${LAW_GO_KR}/판례/(${encodeURIComponent(caseNumber)})`;
}
function interpretationLink(title: string) {
  return `${LAW_GO_KR}/법령해석/${encodeURIComponent(title)}`;
}

const DAILY_LIMIT = 3;

const DisclaimerBanner = ({ tone }: { tone: "top" | "bottom" }) => (
  <div
    className={`rounded-2xl border p-4 text-sm leading-6 ${
      tone === "top"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-gold/40 bg-surface-muted/60 text-text-muted"
    }`}
  >
    {tone === "top" ? (
      <p>
        <span className="mr-1" aria-hidden>⚠️</span>
        <strong>참고용 자료입니다. 법률 자문이 아닙니다.</strong> 정확한 검토는 상담을 통해
        진행됩니다.
      </p>
    ) : (
      <p>위 자료는 참고용이며, 사안별 정확한 검토는 상담이 필요합니다.</p>
    )}
  </div>
);

export function PublicLawLookup() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const kw = keyword.trim();
    if (kw.length < 2) {
      setResult({ ok: false, error: "검색어는 2자 이상 입력해 주세요." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/public/law-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: kw })
      });
      const json = (await res.json()) as SearchResponse;
      setResult(json);
      if (typeof json.remaining === "number") setRemaining(json.remaining);
    } catch {
      setResult({ ok: false, error: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  const data = result?.ok ? result.data : null;
  const isLimited =
    result && !result.ok && typeof result.remaining === "number" && result.remaining === 0;

  return (
    <div className="space-y-6">
      <DisclaimerBanner tone="top" />

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 출입국관리법, 행정심판, 체류자격 변경"
          maxLength={100}
          className="flex-1 rounded-xl border border-gold/40 bg-surface px-4 py-3 text-sm text-text-strong outline-none focus:border-primary"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-text-strong disabled:opacity-60"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      <p className="text-right text-xs text-text-muted">
        오늘 남은 조회: <strong>{remaining ?? DAILY_LIMIT}회</strong> / {DAILY_LIMIT}회
      </p>

      {result && !result.ok && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            isLimited
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <p>{result.error}</p>
          {isLimited && (
            <p className="mt-2 text-xs">
              바로 검토가 필요하시면 아래 <strong>전문가 상담 신청</strong>을 이용해 주세요.
            </p>
          )}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          <ResultGroup
            title="관련 법령"
            emptyMsg="관련 법령이 없습니다."
            count={data.laws.length}
          >
            <ul className="space-y-2">
              {data.laws.map((l, i) => (
                <li
                  key={`${l.lawId}-${i}`}
                  className="rounded-xl border border-gold/30 bg-surface p-4"
                >
                  <a
                    href={lawLink(l.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-base font-bold text-primary hover:underline"
                  >
                    {l.name}
                  </a>
                  <p className="mt-1 text-xs text-text-muted">
                    {[l.lawType, l.effectiveDate && `시행 ${l.effectiveDate}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </ResultGroup>

          <ResultGroup
            title="관련 판례"
            emptyMsg="관련 판례가 없습니다."
            count={data.precedents.length}
          >
            <ul className="space-y-2">
              {data.precedents.map((p, i) => (
                <li
                  key={`${p.caseNumber}-${i}`}
                  className="rounded-xl border border-gold/30 bg-surface p-4"
                >
                  <a
                    href={precedentLink(p.caseNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-sm font-bold text-primary hover:underline"
                  >
                    {p.caseName || p.caseNumber}
                  </a>
                  <p className="mt-1 text-xs text-text-muted">
                    {[p.courtName, p.caseNumber, p.judgmentDate].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </ResultGroup>

          <ResultGroup
            title="관련 해석례"
            emptyMsg="관련 해석례가 없습니다."
            count={data.interpretations.length}
          >
            <ul className="space-y-2">
              {data.interpretations.map((it, i) => (
                <li
                  key={`${it.title}-${i}`}
                  className="rounded-xl border border-gold/30 bg-surface p-4"
                >
                  <a
                    href={interpretationLink(it.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-sm font-bold text-primary hover:underline"
                  >
                    {it.title}
                  </a>
                  <p className="mt-1 text-xs text-text-muted">
                    {[it.agency, it.date].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </ResultGroup>
        </div>
      )}

      <DisclaimerBanner tone="bottom" />

      <div className="rounded-2xl border border-gold/40 bg-primary/5 p-6 text-center">
        <p className="font-serif text-lg font-bold text-primary">
          사안별 정확한 검토가 필요하신가요?
        </p>
        <p className="mt-2 text-sm text-text-muted">
          제목 검색만으로는 판단이 어렵습니다. 사실관계와 자료를 확인한 전문가 검토를 받아보세요.
        </p>
        <Link
          href="/consult"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-panel transition hover:bg-text-strong"
        >
          전문가 상담 신청 →
        </Link>
      </div>
    </div>
  );
}

function ResultGroup({
  title,
  count,
  emptyMsg,
  children
}: {
  title: string;
  count: number;
  emptyMsg: string;
  children: React.ReactNode;
}) {
  return (
    <details open className="rounded-2xl border border-gold/30 bg-surface-muted/30 p-4">
      <summary className="cursor-pointer font-serif text-sm font-bold text-primary">
        {title} <span className="text-text-muted">({count})</span>
      </summary>
      <div className="mt-3">
        {count === 0 ? <p className="text-xs text-text-muted">{emptyMsg}</p> : children}
      </div>
    </details>
  );
}
