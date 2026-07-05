"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Enrichment {
  company?: string;
  industry?: string;
  seniority?: string;
  socialLinks?: { linkedin?: string; hint?: string };
  confidence: number;
  source: string;
  updatedAt: string;
  notes?: string;
}

export function ClientProfileEnrichmentCard({ email }: { email: string }) {
  const [data, setData] = useState<Enrichment | null>(null);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Partial<Enrichment>>({});
  const [err, setErr] = useState<string | null>(null);

  const encoded = encodeURIComponent(email);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/clients/${encoded}/enrichment`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "조회 실패");
      } else {
        setData(json.enrichment ?? null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [encoded]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/clients/${encoded}/enrichment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "재조회 실패");
      else setData(json.enrichment);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${encoded}/enrichment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "override", patch: draft }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "저장 실패");
      else {
        setData(json.enrichment);
        setEdit(false);
        setDraft({});
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="ui-kicker">고객 프로필 강화</p>
          <p className="text-xs text-text-muted">{email}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button className="rounded border px-2 py-1" onClick={refresh} disabled={loading}>
            재조회
          </button>
          <button
            className="rounded border px-2 py-1"
            onClick={() => {
              setDraft(data ?? {});
              setEdit((v) => !v);
            }}
            disabled={loading}
          >
            {edit ? "취소" : "수동 편집"}
          </button>
        </div>
      </div>

      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

      {!data && !loading ? (
        <p className="mt-3 text-sm text-text-muted">데이터 없음 — "재조회"를 눌러 강화하세요.</p>
      ) : null}

      {data && !edit ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-text-muted">회사</dt>
          <dd>{data.company ?? "—"}</dd>
          <dt className="text-text-muted">산업</dt>
          <dd>{data.industry ?? "—"}</dd>
          <dt className="text-text-muted">시니어리티</dt>
          <dd>{data.seniority ?? "—"}</dd>
          <dt className="text-text-muted">신뢰도</dt>
          <dd>{Math.round(data.confidence * 100)}% · {data.source}</dd>
          {data.notes ? (
            <>
              <dt className="text-text-muted">비고</dt>
              <dd className="text-xs">{data.notes}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {edit ? (
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">회사</span>
            <input
              className="rounded border px-2 py-1"
              value={draft.company ?? ""}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">산업</span>
            <input
              className="rounded border px-2 py-1"
              value={draft.industry ?? ""}
              onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">시니어리티</span>
            <input
              className="rounded border px-2 py-1"
              value={draft.seniority ?? ""}
              onChange={(e) => setDraft({ ...draft, seniority: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">비고</span>
            <textarea
              className="rounded border px-2 py-1"
              rows={2}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>
          <button className="rounded bg-primary px-3 py-1.5 text-white" onClick={save} disabled={loading}>
            저장
          </button>
        </div>
      ) : null}
    </Card>
  );
}
