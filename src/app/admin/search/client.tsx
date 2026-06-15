"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Results = {
  cases: { id: string; caseNo: string | null; title: string; status: string }[];
  inquiries: { id: string; title: string; contactName: string; status: string; publicTrackingCode: string | null }[];
  caseStudies: { id: string; title: string; category: string; published: boolean }[];
};

const EMPTY: Results = { cases: [], inquiries: [], caseStudies: [] };

export function SearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.ok) setResults({ cases: d.cases ?? [], inquiries: d.inquiries ?? [], caseStudies: d.caseStudies ?? [] });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const total = results.cases.length + results.inquiries.length + results.caseStudies.length;

  return (
    <div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="이름, 사건번호, 제목, 추적코드…"
        className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base focus:border-primary focus:outline-none"
      />

      {q.trim().length >= 2 && (
        <p className="mt-3 text-xs text-text-muted">{loading ? "검색 중…" : `${total}건 발견`}</p>
      )}

      <div className="mt-5 space-y-6">
        {results.cases.length > 0 && (
          <Group title={`사건 (${results.cases.length})`}>
            {results.cases.map((c) => (
              <Row key={c.id} href={`/admin/cases/${c.id}`} title={`${c.caseNo ? c.caseNo + " · " : ""}${c.title}`} tag={c.status} />
            ))}
          </Group>
        )}
        {results.inquiries.length > 0 && (
          <Group title={`문의 (${results.inquiries.length})`}>
            {results.inquiries.map((i) => (
              <Row
                key={i.id}
                href={`/admin/inquiries/${i.id}`}
                title={`${i.title} — ${i.contactName}`}
                tag={i.publicTrackingCode ?? i.status}
              />
            ))}
          </Group>
        )}
        {results.caseStudies.length > 0 && (
          <Group title={`사례 (${results.caseStudies.length})`}>
            {results.caseStudies.map((s) => (
              <Row key={s.id} href="/admin/case-studies" title={s.title} tag={s.published ? "게시" : "비공개"} />
            ))}
          </Group>
        )}
        {q.trim().length >= 2 && !loading && total === 0 && (
          <p className="rounded-lg border border-dashed border-line bg-surface-muted/40 px-4 py-8 text-center text-sm text-text-muted">
            검색 결과가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gold-deep">{title}</h3>
      <ul className="mt-2 space-y-1.5">{children}</ul>
    </div>
  );
}

function Row({ href, title, tag }: { href: string; title: string; tag: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition hover:border-gold/50 hover:bg-surface-muted"
      >
        <span className="min-w-0 truncate text-sm font-medium text-text-strong">{title}</span>
        <span className="flex-shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold text-text-muted">
          {tag}
        </span>
      </Link>
    </li>
  );
}
