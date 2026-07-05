import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getOrGeneratePersonas } from "@/lib/services/persona-analysis-service";

import { RegeneratePersonasButton } from "./regenerate-button";

export const dynamic = "force-dynamic";

function formatWon(v: number): string {
  if (!v) return "-";
  return `${(v / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}만원`;
}

export default async function AdminPersonasPage() {
  const envelope = await getOrGeneratePersonas();
  const { personas, totalSamples, updatedAt } = envelope;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="인사이트 · 페르소나"
        title="의뢰인 페르소나 자동 분석"
        description={`최근 종결 ${totalSamples}건 기반 · 갱신 ${new Date(updatedAt).toLocaleString("ko-KR")}`}
        action={<RegeneratePersonasButton />}
      />

      {personas.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-muted">
          분석에 사용할 종결 사건이 아직 없습니다.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {personas.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="ui-kicker">{p.id}</p>
                  <h3 className="mt-1 text-base font-semibold text-text-strong">{p.name}</h3>
                </div>
                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs">
                  {p.size}명
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-text-muted">평균 견적</dt>
                  <dd className="mt-1 font-semibold text-text-strong">{formatWon(p.avgFee)}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">주요 카테고리</dt>
                  <dd className="mt-1 text-text-strong">
                    {p.topCategories.length ? p.topCategories.join(", ") : "-"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs text-text-muted">특성</p>
                <ul className="mt-2 space-y-1 text-xs">
                  {p.traits.map((t, i) => (
                    <li key={i} className="rounded-md bg-surface-muted/50 px-2 py-1">
                      · {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-lg border border-gold/40 bg-gold/5 p-3">
                <p className="text-xs uppercase tracking-wide text-gold-deep">추천 CTA</p>
                <p className="mt-1 text-sm font-semibold text-text-strong">{p.recommendedCta}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
