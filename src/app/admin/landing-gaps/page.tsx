import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getTopSearchQueries } from "@/lib/services/gsc-service";
import { getExtraKeywordLandings } from "@/lib/services/keyword-landing-service";
import { notFound } from "next/navigation";

import { CreateLandingButton } from "./create-landing-button";

export const dynamic = "force-dynamic";

// 하드코딩 기본 랜딩 7종. DB 로 추가된 랜딩은 런타임에 병합.
const BASE_LANDINGS = [
  { term: "d-8-비자", label: "D-8 비자 (기업투자)", tokens: ["d-8", "d8", "기업투자"] },
  { term: "d-10-비자", label: "D-10 비자 (구직)", tokens: ["d-10", "d10", "구직비자"] },
  { term: "f-2-7-비자", label: "F-2-7 비자 (점수제 거주)", tokens: ["f-2-7", "f2-7", "점수제"] },
  { term: "귀화", label: "귀화 · 국적", tokens: ["귀화", "국적"] },
  { term: "강제퇴거", label: "강제퇴거 대응", tokens: ["강제퇴거", "출국명령"] },
  { term: "행정심판", label: "행정심판", tokens: ["행정심판", "이의신청"] },
  { term: "법인설립", label: "법인 설립", tokens: ["법인설립", "회사설립"] },
];

type Landing = { term: string; label: string; tokens: string[] };

function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/\s+/g, "");
}

function matchLandingSlug(query: string, landings: Landing[]): string | null {
  const nq = normalizeQuery(query);
  for (const landing of landings) {
    for (const token of landing.tokens) {
      const nt = normalizeQuery(token);
      if (nt && nq.includes(nt)) return landing.term; // 빈 토큰 → includes("")=항상참 방지
    }
  }
  return null;
}

export default async function LandingGapsPage() {
  if (!(await isFeatureEnabled("landing_gap_finder"))) notFound();

  const [queries, extras] = await Promise.all([
    getTopSearchQueries(28, 50).catch(() => []),
    getExtraKeywordLandings().catch(() => []),
  ]);

  const landings: Landing[] = [
    ...BASE_LANDINGS,
    ...extras.map((e) => ({ term: e.slug, label: e.label, tokens: e.tokens })),
  ];

  const matched: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number; slug: string }> = [];
  const gaps: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> = [];

  for (const q of queries) {
    const slug = matchLandingSlug(q.query, landings);
    if (slug) matched.push({ ...q, slug });
    else gaps.push(q);
  }

  gaps.sort((a, b) => b.impressions - a.impressions);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="랜딩 갭 파인더"
        description="GSC 상위 유입 키워드 중 /keyword 랜딩과 매칭되지 않는 것을 찾습니다."
      />

      <Card className="p-5">
        <p className="ui-kicker">매칭되지 않는 키워드 (신규 랜딩 후보)</p>
        <p className="mt-1 text-xs text-text-muted">
          노출 많지만 대응 랜딩이 없는 검색어 — 새 <code>/keyword/[term]</code> 페이지 만들면 유입 증가 기대.
        </p>
        {gaps.length === 0 ? (
          <EmptyState icon="✅" title="모든 상위 키워드가 랜딩과 매칭됨" description="새 키워드 랜딩을 추가할 필요가 없습니다. GSC 데이터가 없다면 서비스 연동을 확인하세요." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">키워드</th>
                  <th className="pb-2 text-right font-bold text-text-strong">노출</th>
                  <th className="pb-2 text-right font-bold text-text-strong">클릭</th>
                  <th className="pb-2 text-right font-bold text-text-strong">CTR</th>
                  <th className="pb-2 text-right font-bold text-text-strong">순위</th>
                  <th className="pb-2 text-right font-bold text-text-strong">액션</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g) => (
                  <tr key={g.query} className="border-b border-gold/10">
                    <td className="py-2 font-medium text-text">{g.query}</td>
                    <td className="py-2 text-right text-text-muted">{g.impressions.toLocaleString()}</td>
                    <td className="py-2 text-right text-text-muted">{g.clicks}</td>
                    <td className="py-2 text-right text-text-muted">{g.ctr}%</td>
                    <td className="py-2 text-right text-text-muted">{g.position}</td>
                    <td className="py-2 text-right"><CreateLandingButton query={g.query} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <p className="ui-kicker">매칭된 키워드 (기존 랜딩 활용 중)</p>
        {matched.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">기존 랜딩 매칭 데이터 없음.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gold/20 text-left">
                  <th className="pb-2 font-bold text-text-strong">키워드</th>
                  <th className="pb-2 font-bold text-text-strong">랜딩</th>
                  <th className="pb-2 text-right font-bold text-text-strong">클릭</th>
                  <th className="pb-2 text-right font-bold text-text-strong">노출</th>
                </tr>
              </thead>
              <tbody>
                {matched.map((m) => (
                  <tr key={m.query} className="border-b border-gold/10">
                    <td className="py-2 font-medium text-text">{m.query}</td>
                    <td className="py-2">
                      <a href={`/keyword/${m.slug}`} className="text-gold-deep hover:underline">/keyword/{m.slug}</a>
                    </td>
                    <td className="py-2 text-right text-text-muted">{m.clicks}</td>
                    <td className="py-2 text-right text-text-muted">{m.impressions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
