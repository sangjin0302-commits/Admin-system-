"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import {
  CHANNEL_LABEL,
  CHANNEL_ORDER,
  type SyndicationChannel,
  type SyndicationRecord,
} from "@/lib/services/pr-syndication-types";

type Item = {
  post: {
    id: string;
    slug: string;
    title: string;
    publishedAt: string | null;
    category: string;
  };
  syndication: SyndicationRecord | null;
};

export function PrDistributionList({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function regenerate(postId: string) {
    setBusy(postId);
    try {
      const res = await fetch("/api/admin/pr-distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate", postId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok && data.record) {
        setItems((prev) =>
          prev.map((it) => (it.post.id === postId ? { ...it, syndication: data.record } : it)),
        );
      } else {
        alert(data?.error ?? "재생성 실패");
      }
    } finally {
      setBusy(null);
    }
  }

  async function markPosted(postId: string, channel: SyndicationChannel) {
    const res = await fetch("/api/admin/pr-distribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_posted", postId, channel }),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.ok && data.record) {
      setItems((prev) =>
        prev.map((it) => (it.post.id === postId ? { ...it, syndication: data.record } : it)),
      );
    } else {
      alert(data?.error ?? "처리 실패");
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("클립보드에 복사됨");
    } catch {
      alert("복사 실패");
    }
  }

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const s = it.syndication;
        const postedCount = s?.channels.filter((c) => c.posted).length ?? 0;
        return (
          <Card key={it.post.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="rounded bg-surface-muted px-2 py-0.5">{it.post.category}</span>
                  {it.post.publishedAt && (
                    <span>{new Date(it.post.publishedAt).toLocaleDateString("ko-KR")}</span>
                  )}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-text-strong">{it.post.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {CHANNEL_ORDER.map((c) => {
                    const ch = s?.channels.find((x) => x.channel === c);
                    const state = !ch ? "미생성" : ch.posted ? "게시완료" : "생성됨";
                    return (
                      <span
                        key={c}
                        className={`rounded px-2 py-0.5 ${
                          !ch
                            ? "bg-surface-muted text-text-muted"
                            : ch.posted
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                        }`}
                      >
                        {CHANNEL_LABEL[c]}: {state}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-muted">
                  {postedCount}/{CHANNEL_ORDER.length} 게시
                </span>
                <button
                  type="button"
                  onClick={() => regenerate(it.post.id)}
                  disabled={busy === it.post.id}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted disabled:opacity-60"
                >
                  {s ? "재배포" : "생성"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen((prev) => (prev === it.post.id ? null : it.post.id))}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                >
                  {open === it.post.id ? "닫기" : "미리보기"}
                </button>
              </div>
            </div>

            {open === it.post.id && s && (
              <div className="mt-4 space-y-3 border-t border-border pt-3">
                {s.channels.map((ch) => (
                  <div key={ch.channel} className="rounded border border-border bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-text-strong">
                        {CHANNEL_LABEL[ch.channel]}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copy(ch.text)}
                          className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-surface-muted"
                        >
                          복사
                        </button>
                        {!ch.posted && (
                          <button
                            type="button"
                            onClick={() => markPosted(it.post.id, ch.channel)}
                            className="rounded bg-primary px-2 py-0.5 text-[11px] font-semibold text-white"
                          >
                            게시 완료 표시
                          </button>
                        )}
                        {ch.posted && ch.postedAt && (
                          <span className="text-[11px] text-success">
                            {new Date(ch.postedAt).toLocaleDateString("ko-KR")} 게시
                          </span>
                        )}
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap rounded bg-surface-muted p-2 text-[11px] leading-relaxed text-text-strong">
                      {ch.text || "(생성된 문안 없음)"}
                    </pre>
                  </div>
                ))}
                <p className="text-[11px] text-text-muted">
                  TODO: 네이버 · 페이스북 · 링크드인 OAuth 자동 게시 연동. 현재는 위 텍스트를 복사해서 각
                  채널에 수동으로 붙여넣기 합니다.
                </p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
