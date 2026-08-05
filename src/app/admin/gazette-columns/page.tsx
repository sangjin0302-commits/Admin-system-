import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { fetchGazetteList } from "@/lib/services/gazette-client";
import { matchGazetteService } from "@/lib/services/gazette-service-match";
import { buildGazetteColumnDraft } from "@/lib/services/gazette-column-draft";

import { CopyDraftButton } from "./copy-draft-button";

export const dynamic = "force-dynamic";

/**
 * 관보 → 칼럼 소재 큐. 최신 관보에서 "영향 안내" 칼럼 초안 골격을 만들어 준다.
 * 정책상 blogPost 는 만들지 않는다 — 초안을 복사해 /admin/blog 에서 직접 작성·발행.
 */
export default async function GazetteColumnsPage() {
  const outcome = await fetchGazetteList(30);
  const items = outcome.status === "ok" ? outcome.items : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Content"
        title="관보 칼럼 소재"
        description="최신 관보에서 '영향 안내' 칼럼 초안 골격을 만들어 복사합니다. (직접 작성·발행)"
      />

      {outcome.status !== "ok" ? (
        <Card className="p-5">
          <EmptyState
            icon="🗞"
            title="관보 데이터 없음"
            description="GWANBO_API_URL 연동을 확인하세요. 연동되면 최신 관보가 여기 표시됩니다."
          />
        </Card>
      ) : items.length === 0 ? (
        <Card className="p-5">
          <EmptyState icon="🗞" title="최근 관보 없음" description="표시할 관보가 없습니다." />
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((g) => {
            const svc = matchGazetteService(g, "ko");
            const draft = buildGazetteColumnDraft(g);
            return (
              <Card key={g.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {g.category && (
                        <span className="rounded-full bg-gold-soft/50 px-2.5 py-0.5 text-[11px] font-bold text-gold-deep">
                          {g.category}
                        </span>
                      )}
                      {svc && (
                        <span className="rounded-full border border-gold/30 px-2.5 py-0.5 text-[11px] font-bold text-gold-deep">
                          {svc.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-serif text-sm font-bold text-text-strong">{g.title}</p>
                    {g.agency && <p className="mt-1 text-[11px] text-text-muted">{g.agency}</p>}
                  </div>
                  <CopyDraftButton markdown={draft.markdown} />
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-gold-deep">초안 미리보기</summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-surface-muted p-3 text-[11px] leading-5 text-text">
                    {draft.markdown}
                  </pre>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
