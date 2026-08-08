"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { id: string; title: string; agency: string; category: string; dateMs: number; url: string | null };
type Stats = {
  total: number;
  last7: number;
  last30: number;
  latestDate: string | null;
  byAgency: { agency: string; count: number }[];
};

/**
 * 홈 관보 티저 — 최신 관보 3건 + 통계를 비동기로 불러 보여준다.
 * 봇 미설정/실패/빈 응답이면 **아무것도 렌더하지 않는다**(홈 깨짐 방지).
 */
export function HomeGazetteTeaser({ lang = "ko" }: { lang?: "ko" | "en" }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/public/gazette-latest", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setItems(Array.isArray(d?.items) ? d.items : []);
        setStats(d?.stats ?? null);
      })
      .catch(() => setItems([]));
    return () => ctrl.abort();
  }, []);

  if (!items || items.length === 0) return null; // 로딩 중·빈 응답이면 숨김

  const t = (ko: string, en: string) => (lang === "en" ? en : ko);
  // timeZone 을 반드시 고정한다. 이 컴포넌트는 클라이언트 컴포넌트라 서버에서도 한 번
  // 렌더되는데, 서버(Vercel=UTC)와 브라우저(KST)의 기준시가 달라 자정을 걸친 항목에서
  // 날짜가 하루 어긋난다. 그러면 React 가 하이드레이션 텍스트 불일치(#418)로 트리를 버리고
  // 클라이언트에서 다시 그린다 — 데이터에 따라 터져서 재현이 들쭉날쭉했다.
  const fmt = (ms: number) =>
    ms > 0
      ? new Date(ms).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR", {
          timeZone: "Asia/Seoul",
        })
      : "";

  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="ethos-eyebrow">Official Gazette</p>
            <h2 className="ethos-display mt-2 text-2xl sm:text-3xl">{t("최신 관보", "Latest Gazette")}</h2>
            <p className="mt-1 text-sm text-text-muted">
              {t("외국인·행정 실무에 영향을 주는 최신 법령·고시", "Recent statutes and notices relevant to your case")}
            </p>
          </div>
          <Link
            href={lang === "en" ? "/gazette?lang=en" : "/gazette"}
            className="shrink-0 text-sm font-semibold text-primary hover:text-gold-deep"
          >
            {t("전체 보기 →", "View all →")}
          </Link>
        </div>

        {/* 관보 통계 — 총 수집·최근 7일·기관별 상위(봇 /items/stats). 없으면 숨김. */}
        {stats && stats.total > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-gold/20 bg-gold-soft/10 px-5 py-3 text-sm">
            <span className="text-text-muted">
              {t("총 수집", "Total collected")}{" "}
              <strong className="font-serif text-base text-primary">{stats.total.toLocaleString()}</strong>{t("건", "")}
            </span>
            <span className="text-text-muted">
              {t("최근 7일", "Last 7 days")}{" "}
              <strong className="text-gold-deep">{stats.last7.toLocaleString()}</strong>{t("건", "")}
            </span>
            <span className="text-text-muted">
              {t("최근 30일", "Last 30 days")}{" "}
              <strong className="text-gold-deep">{stats.last30.toLocaleString()}</strong>{t("건", "")}
            </span>
            {stats.byAgency.length > 0 && (
              <span className="text-text-muted">
                {t("기관별", "By agency")}:{" "}
                {stats.byAgency.slice(0, 3).map((a, i) => (
                  <span key={a.agency}>
                    {i > 0 ? " · " : ""}
                    {a.agency} <span className="text-text-strong">{a.count}</span>
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {items.map((g) => {
            const inner = (
              <div className="flex flex-col gap-1 px-5 py-3.5 transition hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-4">
                <div className="flex shrink-0 items-center gap-2 sm:w-44">
                  {g.dateMs > 0 && <span className="text-[11px] text-text-muted">{fmt(g.dateMs)}</span>}
                </div>
                <span className="min-w-0 flex-1 truncate font-serif text-sm font-semibold text-primary">
                  {g.title}
                  {g.url && <span className="ml-1 text-xs text-text-muted" aria-hidden>↗</span>}
                </span>
                {g.agency && <span className="shrink-0 text-[11px] text-text-muted">{g.agency}</span>}
              </div>
            );
            const safeUrl = g.url && /^https?:\/\//i.test(g.url) ? g.url : null; // javascript:/data: 스킴 차단
            return (
              <li key={g.id}>
                {safeUrl ? (
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer nofollow" className="block">
                    {inner}
                  </a>
                ) : (
                  <Link href={lang === "en" ? "/gazette?lang=en" : "/gazette"} className="block">
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
