"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { CareerApplication, CareerStatus } from "@/lib/services/career-application-service";

const STATUS_LABEL: Record<CareerStatus, string> = {
  new: "신규",
  review: "검토",
  interview: "면접",
  hired: "합격",
  rejected: "불합격",
};

const STATUS_OPTIONS: CareerStatus[] = ["new", "review", "interview", "hired", "rejected"];

type Item = CareerApplication & { trackLabel: string };

export function CareersAdminList({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(id: string, status: CareerStatus, note?: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/careers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, note }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.item) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, status: body.item.status, note: body.item.note } : it,
          ),
        );
      } else {
        alert(body?.error ?? "업데이트 실패");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <Card key={it.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-text-strong">{it.name}</span>
                <span className="rounded bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                  {it.trackLabel}
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {STATUS_LABEL[it.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {it.email} · {it.phone} ·{" "}
                {new Date(it.submittedAt).toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={it.status}
                onChange={(e) => updateStatus(it.id, e.target.value as CareerStatus)}
                disabled={busy === it.id}
                className="rounded border border-border px-2 py-1 text-xs"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setOpenId((prev) => (prev === it.id ? null : it.id))}
                className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted"
              >
                {openId === it.id ? "닫기" : "상세"}
              </button>
            </div>
          </div>

          {openId === it.id && (
            <div className="mt-4 space-y-3 border-t border-border pt-3">
              {it.resumeUrl && (
                <p className="text-xs">
                  <span className="text-text-muted">이력서: </span>
                  <a
                    href={it.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {it.resumeUrl}
                  </a>
                </p>
              )}
              <div>
                <div className="mb-1 text-xs font-semibold text-text-strong">자기소개</div>
                <p className="whitespace-pre-wrap rounded bg-surface-muted p-3 text-xs leading-relaxed text-text-strong">
                  {it.cover}
                </p>
              </div>
              <NoteEditor
                initial={it.note ?? ""}
                onSave={(note) => updateStatus(it.id, it.status, note)}
                disabled={busy === it.id}
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function NoteEditor({
  initial,
  onSave,
  disabled,
}: {
  initial: string;
  onSave: (note: string) => void;
  disabled: boolean;
}) {
  const [note, setNote] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-text-strong">내부 메모</div>
      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        rows={3}
        maxLength={2000}
        className="w-full rounded border border-border px-2 py-1 text-xs"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onSave(note);
            setSaved(true);
          }}
          className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          메모 저장
        </button>
        {saved && <span className="text-xs text-green-600">저장됨</span>}
      </div>
    </div>
  );
}
