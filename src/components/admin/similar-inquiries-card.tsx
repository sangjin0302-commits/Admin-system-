"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

type SimilarInquiry = {
  id: string;
  title: string;
  contactName: string | null;
  status: string;
  category: string | null;
  createdAt: string;
  keyIssues: string[];
  matchScore: number;
  matchedIssues: string[];
};

function scoreTone(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 50) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (score >= 25) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function SimilarInquiriesCard({ inquiryId }: { inquiryId: string }) {
  const [items, setItems] = useState<SimilarInquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/similar`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!alive) return;
        setItems(Array.isArray(json.similar) ? json.similar : []);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "unknown");
        setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [inquiryId]);

  return (
    <Card className="p-5">
      <div className="mb-3">
        <p className="ui-kicker">R4-4 · 유사 과거 사건</p>
        <h3 className="text-sm font-semibold text-text-strong">
          Lawbot key_issues 기반 유사 사건
        </h3>
      </div>

      {items === null && (
        <p className="text-sm text-text-muted">불러오는 중…</p>
      )}

      {items !== null && items.length === 0 && (
        <p className="text-sm text-text-muted">
          유사한 과거 사건이 없습니다.
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-rose-700">에러: {error}</p>
      )}

      {items && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-line bg-white p-3 hover:border-brand-navy"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/inquiries/${it.id}`}
                  className="text-sm font-semibold text-brand-navy hover:underline"
                >
                  {it.title}
                </Link>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(it.matchScore)}`}
                >
                  {it.matchScore}% 유사
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                {it.contactName && <span>{it.contactName}</span>}
                <span>·</span>
                <span>{it.status}</span>
                {it.category && (
                  <>
                    <span>·</span>
                    <span>{it.category}</span>
                  </>
                )}
                <span>·</span>
                <span>{new Date(it.createdAt).toLocaleDateString("ko-KR")}</span>
              </div>
              {it.matchedIssues.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {it.matchedIssues.map((issue, idx) => (
                    <span
                      key={`${it.id}-m-${idx}`}
                      className="inline-flex rounded-full border border-brand-gold/40 bg-brand-gold/10 px-2 py-0.5 text-[11px] text-brand-navy"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
