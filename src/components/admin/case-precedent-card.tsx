import { findSimilarPrecedents } from "@/lib/services/precedent-database-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

/** 사건 상세용 유사 판례 카드. 기능 플래그 precedent_database off 면 null. */
export async function CasePrecedentCard(props: {
  category: string | null | undefined;
  keywords: string[];
}) {
  if (!(await isFeatureEnabled("precedent_database"))) return null;
  const list = await findSimilarPrecedents(props.category, props.keywords, 5);
  if (list.length === 0) return null;
  return (
    <section className="rounded-[16px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-strong">유사 판례</h3>
        <a href="/admin/precedents" className="text-xs text-primary underline">판례 DB</a>
      </div>
      <ul className="mt-3 space-y-2">
        {list.map((p) => (
          <li key={p.id} className="rounded-lg border border-line px-3 py-2">
            <p className="text-xs text-text-muted">{p.court} · {p.decisionDate} · {p.category}</p>
            <p className="mt-0.5 font-mono text-sm font-semibold">{p.caseNo}</p>
            <p className="mt-1 line-clamp-2 text-sm">{p.summary}</p>
            {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-primary">원문 →</a>}
          </li>
        ))}
      </ul>
    </section>
  );
}
