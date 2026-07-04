import Link from "next/link";

import { auditAllPublished } from "@/lib/services/seo-audit-service";

export const dynamic = "force-dynamic";

type Filter = "all" | "needs-work" | "good" | "excellent";

function normalizeFilter(raw: string | undefined): Filter {
  if (raw === "needs-work" || raw === "good" || raw === "excellent") return raw;
  return "all";
}

function scoreClass(score: number): string {
  if (score >= 85) return "text-green-700";
  if (score >= 70) return "text-blue-700";
  return "text-red-700";
}

export default async function AdminSeoAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filterRaw = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const filter = normalizeFilter(filterRaw);

  const all = await auditAllPublished();
  const sorted = [...all].sort((a, b) => a.score - b.score);
  const filtered = sorted.filter((r) => {
    if (filter === "needs-work") return r.score < 70;
    if (filter === "good") return r.score >= 70 && r.score < 85;
    if (filter === "excellent") return r.score >= 85;
    return true;
  });

  const avg =
    all.length > 0 ? Math.round(all.reduce((acc, r) => acc + r.score, 0) / all.length) : 0;

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">마케팅 · 콘텐츠 품질</p>
          <h2 className="mt-2 text-xl font-semibold text-text-strong">콘텐츠 SEO 감사</h2>
          <p className="mt-2 text-sm text-text-muted">
            게시된 블로그 글을 규칙 기반으로 자동 감사하고, 개선이 필요한 글을 우선 노출합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(
            [
              ["all", "전체"],
              ["needs-work", "개선 필요 (<70)"],
              ["good", "양호 (70-84)"],
              ["excellent", "우수 (85+)"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/marketing/seo-audit${key === "all" ? "" : `?filter=${key}`}`}
              className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
                key === filter
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-text-muted"
              } inline-flex items-center`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="ui-kicker">감사 대상 글</p>
          <p className="mt-2 text-2xl font-semibold text-text-strong">{all.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="ui-kicker">평균 점수</p>
          <p className="mt-2 text-2xl font-semibold text-text-strong">{avg}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="ui-kicker">개선 필요 글</p>
          <p className="mt-2 text-2xl font-semibold text-text-strong">
            {all.filter((r) => r.score < 70).length}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/40 text-xs">
            <tr>
              <th className="px-3 py-2 text-left">제목</th>
              <th className="px-3 py-2 text-right">점수</th>
              <th className="px-3 py-2 text-right">이슈</th>
              <th className="px-3 py-2 text-right">단어수</th>
              <th className="px-3 py-2 text-right">내부/외부 링크</th>
              <th className="px-3 py-2 text-right">이미지 (alt 누락)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-text-muted">
                  이 필터에 해당하는 글이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.slug} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer">
                        <span className="font-medium text-text-strong">{a.title}</span>
                        <span className="ml-2 text-xs text-text-muted">/{a.slug}</span>
                      </summary>
                      <div className="mt-2 space-y-2 rounded-md border border-line bg-surface-muted/30 p-3 text-xs">
                        <div>
                          <p className="ui-kicker">이슈</p>
                          {a.issues.length === 0 ? (
                            <p className="mt-1 text-text-muted">감지된 이슈 없음</p>
                          ) : (
                            <ul className="mt-1 list-disc pl-4">
                              {a.issues.map((i) => (
                                <li key={i.code}>
                                  <span className="font-semibold">[{i.severity}]</span> {i.message}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="ui-kicker">제안</p>
                          {a.suggestions.length === 0 ? (
                            <p className="mt-1 text-text-muted">제안 없음</p>
                          ) : (
                            <ul className="mt-1 list-disc pl-4">
                              {a.suggestions.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="ui-kicker">상세 지표</p>
                          <p className="mt-1">
                            제목 {a.metrics.titleLength}자 · 발췌 {a.metrics.excerptLength}자 · H1 {a.metrics.h1Count}개 · H2 {a.metrics.h2Count}개 · 평균 문장 길이 {a.metrics.avgSentenceLength}
                          </p>
                        </div>
                      </div>
                    </details>
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${scoreClass(a.score)}`}>{a.score}</td>
                  <td className="px-3 py-2 text-right">{a.issues.length}</td>
                  <td className="px-3 py-2 text-right">{a.metrics.wordCount}</td>
                  <td className="px-3 py-2 text-right">
                    {a.metrics.internalLinks}/{a.metrics.externalLinks}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {a.metrics.imageCount}
                    {a.metrics.imagesMissingAlt > 0 ? ` (누락 ${a.metrics.imagesMissingAlt})` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
