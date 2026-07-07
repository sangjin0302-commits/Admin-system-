"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";

type ClientCase = {
  id: string;
  title: string;
  caseNo: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
};

type ClientMessage = {
  id: string;
  caseId: string;
  eventType: string;
  message: string;
  createdAt: string;
};

type ClientContext = {
  profile: {
    email: string;
    phone?: string | null;
    displayName: string;
    organizationName?: string | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
  };
  cases: { active: ClientCase[]; closed: ClientCase[] };
  inquiries: Array<{ id: string; title: string; status: string; createdAt: string }>;
  messages: ClientMessage[];
  docs: Array<{ id: string; fileName: string; uploadedAt: string }>;
  payments: Array<{ id: string; amount: number; status: string; createdAt: string; caseId: string | null }>;
  notes: Array<{ caseId: string; memo: string; updatedAt: string }>;
};

function fmt(d: string) {
  return d.slice(0, 10);
}

export function ClientContextSidebar({ email }: { email: string }) {
  const enabled = useFeatureFlag("client_context_sidebar");
  const [open, setOpen] = useState(true);
  const [ctx, setCtx] = useState<ClientContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled === false) return;
    if (!email) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/admin/clients/${encodeURIComponent(email)}/context`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? `실패 (${res.status})`);
        } else {
          setCtx(data.context ?? null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message ?? "네트워크 오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, enabled]);

  if (enabled === false) return null;

  return (
    <details
      className="rounded-2xl border border-line bg-surface shadow-panel"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-text-strong">
        <span className="mr-2">이 의뢰인 이력</span>
        <span className="text-xs font-normal text-text-muted">{email}</span>
      </summary>
      <div className="border-t border-line px-5 py-4 text-sm">
        {loading && <p className="text-text-muted">로드 중…</p>}
        {error && <p className="text-danger">{error}</p>}
        {ctx && (
          <div className="grid gap-4 md:grid-cols-2">
            <section>
              <h4 className="ui-kicker mb-2">프로필</h4>
              <p className="text-text-strong">{ctx.profile.displayName}</p>
              <p className="text-xs text-text-muted">
                {ctx.profile.organizationName ? `${ctx.profile.organizationName} · ` : ""}
                {ctx.profile.phone ?? ""}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                최초 접점: {ctx.profile.firstSeenAt ? fmt(ctx.profile.firstSeenAt) : "-"} · 최근:{" "}
                {ctx.profile.lastSeenAt ? fmt(ctx.profile.lastSeenAt) : "-"}
              </p>
            </section>
            <section>
              <h4 className="ui-kicker mb-2">사건 요약</h4>
              <p className="text-text">
                활성 {ctx.cases.active.length}건 · 종결 {ctx.cases.closed.length}건 · 문의{" "}
                {ctx.inquiries.length}건
              </p>
              <p className="text-xs text-text-muted">
                결제 {ctx.payments.length}건 · 서류 {ctx.docs.length}건
              </p>
            </section>
            <section className="md:col-span-2">
              <h4 className="ui-kicker mb-2">이전 사건</h4>
              {ctx.cases.active.length + ctx.cases.closed.length === 0 ? (
                <p className="text-xs text-text-muted">이전 사건 없음</p>
              ) : (
                <ul className="space-y-1">
                  {[...ctx.cases.active, ...ctx.cases.closed].slice(0, 8).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/cases/${c.id}`}
                        className="truncate text-text hover:text-primary"
                      >
                        {c.title}
                      </Link>
                      <span className="whitespace-nowrap text-xs text-text-muted">
                        {c.caseNo ?? "-"} · {c.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="md:col-span-2">
              <h4 className="ui-kicker mb-2">최근 상호작용</h4>
              {ctx.messages.length === 0 ? (
                <p className="text-xs text-text-muted">상호작용 이력 없음</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {ctx.messages.slice(0, 6).map((m) => (
                    <li key={m.id}>
                      <span className="font-mono text-text-muted">{fmt(m.createdAt)}</span>{" "}
                      <span className="text-text-strong">{m.eventType}</span>{" "}
                      <span className="text-text">{m.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </details>
  );
}
