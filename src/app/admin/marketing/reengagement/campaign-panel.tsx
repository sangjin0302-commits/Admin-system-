"use client";

import { useMemo, useState } from "react";

import type { ReengagementScore } from "@/lib/services/reengagement-service";

type Draft = { subject: string; body: string; recipients: { email: string; name: string | null }[] };

export function CampaignPanel({ initial }: { initial: ReengagementScore[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sorted = useMemo(() => [...initial].sort((a, b) => b.score - a.score), [initial]);

  function toggle(email: string) {
    const next = new Set(selected);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelected(next);
  }

  function selectTop(n: number) {
    setSelected(new Set(sorted.slice(0, n).map((r) => r.clientEmail)));
  }

  async function createDraft() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/marketing/reengagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setDraft(data.draft as Draft);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function bulkSend() {
    // 실 발송은 기존 캠페인 인프라에 위임 예정. 여기서는 미리보기 확인만.
    setMsg("대량 발송은 캠페인 콘솔로 이관 필요. 초안은 복사해 사용하세요.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectTop(10)}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface-muted"
        >
          상위 10명 선택
        </button>
        <button
          type="button"
          onClick={() => selectTop(50)}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface-muted"
        >
          상위 50명 선택
        </button>
        <button
          type="button"
          onClick={() => setSelected(new Set())}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface-muted"
        >
          선택 해제
        </button>
        <span className="text-xs text-text-muted">선택: {selected.size}명</span>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={createDraft}
            disabled={selected.size === 0 || busy}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "생성 중..." : "타깃 캠페인 생성"}
          </button>
          {draft && (
            <button
              type="button"
              onClick={bulkSend}
              className="rounded-md border border-gold px-3 py-1.5 text-xs font-bold text-gold-deep"
            >
              대량 발송 (미리보기)
            </button>
          )}
        </div>
      </div>

      {msg && <p className="text-xs text-amber-700">{msg}</p>}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/40 text-xs">
            <tr>
              <th className="w-8 px-3 py-2"></th>
              <th className="px-3 py-2 text-left">고객</th>
              <th className="px-3 py-2 text-center">점수</th>
              <th className="px-3 py-2 text-left">카테고리</th>
              <th className="px-3 py-2 text-center">NPS</th>
              <th className="px-3 py-2 text-left">추천 시점</th>
              <th className="px-3 py-2 text-left">요인</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-text-muted">
                  종결 사건이 없습니다.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.clientEmail} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.clientEmail)}
                      onChange={() => toggle(r.clientEmail)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-semibold">{r.clientName ?? "-"}</div>
                    <div className="text-xs text-text-muted">{r.clientEmail}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="rounded-md bg-gold/10 px-2 py-1 text-xs font-bold text-gold-deep">
                      {r.score}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.likelyCategory}</td>
                  <td className="px-3 py-2 text-center text-xs">{r.npsScore ?? "-"}</td>
                  <td className="px-3 py-2 text-xs">{r.suggestedMonth}</td>
                  <td className="px-3 py-2 text-xs">
                    <ul className="space-y-0.5">
                      {r.factors.map((f, i) => (
                        <li key={i}>· {f}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
          <p className="ui-kicker">이메일 초안</p>
          <p className="mt-2 text-sm">
            <span className="text-text-muted">제목: </span>
            <span className="font-semibold">{draft.subject}</span>
          </p>
          <pre className="mt-2 whitespace-pre-wrap rounded-md bg-surface p-3 text-xs">{draft.body}</pre>
          <p className="mt-2 text-xs text-text-muted">수신자 {draft.recipients.length}명</p>
        </div>
      )}
    </div>
  );
}
