"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type Item = {
  id: string;
  event: string;
  eventLabel: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function PortalNotificationsClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  const unread = items.filter((i) => !i.readAt).length;

  function markOne(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/portal/notifications/${id}`, { method: "POST" });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, readAt: new Date().toISOString() } : i))
        );
      }
    });
  }

  function markAll() {
    startTransition(async () => {
      const res = await fetch("/api/portal/notifications", { method: "POST" });
      if (res.ok) {
        const now = new Date().toISOString();
        setItems((prev) => prev.map((i) => (i.readAt ? i : { ...i, readAt: now })));
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-gold/40 bg-surface px-8 py-16 text-center">
        <p className="ethos-quote text-5xl text-gold/30">📭</p>
        <p className="mt-4 text-sm text-text-muted">아직 받은 알림이 없습니다.</p>
        <p className="mt-2 text-xs text-text-muted">
          사건 상태가 변경되거나 자료 요청이 들어오면 여기서 확인하실 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {unread > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAll}
            disabled={isPending}
            className="inline-flex h-9 items-center rounded-lg border border-gold/40 bg-surface px-4 text-xs font-semibold text-primary transition hover:bg-gold-soft/30 disabled:opacity-50"
          >
            모두 읽음으로 표시
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const isRead = !!item.readAt;
          return (
            <li
              key={item.id}
              className={`relative rounded-2xl border bg-surface p-6 transition ${
                isRead ? "border-gold/15" : "border-gold/40 bg-gold-soft/15"
              }`}
            >
              {!isRead && (
                <span aria-hidden className="absolute left-3 top-7 h-2 w-2 rounded-full bg-gold" />
              )}
              <div className="ml-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-[11px] font-bold text-gold-deep">
                    {item.eventLabel}
                  </span>
                  <span className="text-xs text-text-muted">{formatDate(item.createdAt)}</span>
                </div>
                <h3 className="ethos-display mt-3 text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-text">{item.body}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {item.link && (
                    <Link
                      href={item.link}
                      onClick={() => !isRead && markOne(item.id)}
                      className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-white transition hover:bg-text-strong"
                    >
                      자세히 보기 →
                    </Link>
                  )}
                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => markOne(item.id)}
                      disabled={isPending}
                      className="text-xs font-semibold text-text-muted hover:text-primary"
                    >
                      읽음으로 표시
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
