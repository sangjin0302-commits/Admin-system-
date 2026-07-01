import { Card } from "@/components/ui/card";
import type { LawbotResponse } from "@/lib/services/lawbot-case-analysis-types";

function lawGoKrPrecedentUrl(query: string): string {
  return `https://www.law.go.kr/precSc.do?menuId=1&subMenu=1&query=${encodeURIComponent(query)}`;
}

function lawGoKrInterpretationUrl(query: string): string {
  return `https://www.law.go.kr/expcSc.do?menuId=8&subMenu=2&query=${encodeURIComponent(query)}`;
}

function lawGoKrLawUrl(query: string): string {
  return `https://www.law.go.kr/lawSearch.do?menuId=1&subMenu=1&query=${encodeURIComponent(query)}`;
}

function deepLinkForKind(
  kind: string | undefined,
  query: string
): string {
  switch (kind) {
    case "law":
      return lawGoKrLawUrl(query);
    case "precedent":
      return lawGoKrPrecedentUrl(query);
    case "interpretation":
      return lawGoKrInterpretationUrl(query);
    default:
      return `https://www.law.go.kr/main.html?menuId=1&query=${encodeURIComponent(query)}`;
  }
}

const KIND_TONE: Record<string, string> = {
  law: "bg-indigo-100 text-indigo-800 border-indigo-200",
  precedent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  interpretation: "bg-amber-100 text-amber-800 border-amber-200",
  general: "bg-slate-100 text-slate-700 border-slate-200"
};

const KIND_LABEL: Record<string, string> = {
  law: "법령",
  precedent: "판례",
  interpretation: "해석",
  general: "일반"
};

export function LawbotPrecedentsCard({
  snapshot
}: {
  snapshot: Partial<LawbotResponse>;
}) {
  const precedents = Array.isArray(snapshot.related_precedents)
    ? snapshot.related_precedents
    : [];
  const interpretations = Array.isArray(snapshot.related_interpretations)
    ? snapshot.related_interpretations
    : [];
  const recommendedQueries = Array.isArray(snapshot.recommended_search_queries)
    ? snapshot.recommended_search_queries
    : [];

  if (
    precedents.length === 0 &&
    interpretations.length === 0 &&
    recommendedQueries.length === 0
  ) {
    return null;
  }

  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="ui-kicker">R4-6 · 관련 판례 · 해석 · 검색</p>
        <h3 className="text-sm font-semibold text-text-strong">
          law.go.kr 딥링크
        </h3>
      </div>

      {precedents.length > 0 && (
        <section className="mb-5">
          <h4 className="mb-2 text-xs font-semibold text-brand-navy">
            관련 판례 ({precedents.length})
          </h4>
          <ul className="space-y-2">
            {precedents.map((p, idx) => (
              <li
                key={`prec-${idx}`}
                className="rounded-lg border border-line bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-strong">
                      {p.case_name || "이름 미상"}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-brand-navy">
                      {p.case_number}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {p.court_name ?? ""}
                      {p.court_name && p.decision_date ? " · " : ""}
                      {p.decision_date ?? ""}
                    </p>
                  </div>
                  <a
                    href={lawGoKrPrecedentUrl(p.case_number || p.case_name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-brand-gold/50 bg-brand-gold/10 px-2 py-1 text-[11px] font-semibold text-brand-navy hover:bg-brand-gold/20"
                  >
                    law.go.kr ↗
                  </a>
                </div>
                {p.reason && (
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">
                    {p.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {interpretations.length > 0 && (
        <section className="mb-5">
          <h4 className="mb-2 text-xs font-semibold text-brand-navy">
            관련 유권해석 ({interpretations.length})
          </h4>
          <ul className="space-y-2">
            {interpretations.map((it, idx) => (
              <li
                key={`interp-${idx}`}
                className="rounded-lg border border-line bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-strong">
                      {it.title}
                    </p>
                    {it.number && (
                      <p className="mt-0.5 text-xs font-bold text-brand-navy">
                        {it.number}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {it.agency ?? ""}
                      {it.agency && it.decision_date ? " · " : ""}
                      {it.decision_date ?? ""}
                    </p>
                  </div>
                  <a
                    href={lawGoKrInterpretationUrl(it.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-brand-gold/50 bg-brand-gold/10 px-2 py-1 text-[11px] font-semibold text-brand-navy hover:bg-brand-gold/20"
                  >
                    law.go.kr ↗
                  </a>
                </div>
                {it.reason && (
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">
                    {it.reason}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recommendedQueries.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-semibold text-brand-navy">
            검색 추천 ({recommendedQueries.length})
          </h4>
          <ul className="flex flex-wrap gap-2">
            {recommendedQueries.map((q, idx) => {
              const kind = q.kind ?? "general";
              return (
                <li key={`rec-${idx}`}>
                  <a
                    href={deepLinkForKind(kind, q.query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs text-text-strong hover:border-brand-navy"
                  >
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${KIND_TONE[kind] ?? KIND_TONE.general}`}
                    >
                      {KIND_LABEL[kind] ?? kind}
                    </span>
                    <span>{q.label || q.query}</span>
                    <span className="text-text-muted">↗</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </Card>
  );
}
