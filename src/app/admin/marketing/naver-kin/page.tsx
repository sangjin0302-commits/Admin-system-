"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type KinQueueStatus = "PENDING" | "APPROVED" | "EDITED" | "COPIED" | "REJECTED";
type KinQueueItem = {
  id: string;
  questionId: string;
  category: string;
  sourceUrl: string;
  title: string;
  body: string;
  confidence: number;
  draft: string;
  status: KinQueueStatus;
  createdAt: string;
  updatedAt: string;
};

export default function NaverKinAdminPage() {
  const [queue, setQueue] = useState<KinQueueItem[]>([]);
  const [feeds, setFeeds] = useState<string[]>([]);
  const [feedsInput, setFeedsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/naver-kin", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "조회 실패");
        return;
      }
      setQueue(data.queue ?? []);
      setFeeds(data.feeds ?? []);
      setFeedsInput((data.feeds ?? []).join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runScan = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/naver-kin", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "스캔 실패");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const saveFeeds = async () => {
    setBusy(true);
    setError(null);
    try {
      const parsed = feedsInput
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/admin/marketing/naver-kin?type=feeds", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feeds: parsed }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "저장 실패");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const patchItem = async (id: string, patch: { status?: KinQueueStatus; draft?: string }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/marketing/naver-kin?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "갱신 실패");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const copyDraft = async (item: KinQueueItem) => {
    const text = editing[item.id] ?? item.draft;
    try {
      await navigator.clipboard.writeText(text);
      await patchItem(item.id, { status: "COPIED" });
    } catch {
      setError("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Marketing · Naver 지식iN</p>
        <h1 className="mt-2 ui-page-title">네이버 지식iN 자동 답변</h1>
        <p className="mt-2 text-sm text-text-muted">
          등록한 카테고리 피드에서 신규 질문을 수집하고, AI가 관련도를 판정해 답변 초안을 생성합니다.
          승인 후 &quot;복사&quot; 버튼으로 지식iN 답변창에 붙여넣기 하세요.
        </p>
        <p className="mt-1 text-xs text-amber-700">
          지식iN 파트너 API 등록 완료 시 자동 게시 훅을 연결합니다. (현재 수동 게시)
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-strong">카테고리 피드 URL</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => void saveFeeds()} disabled={busy}>
              피드 저장
            </Button>
            <Button size="sm" onClick={() => void runScan()} disabled={busy}>
              {busy ? "스캔 중…" : "지금 스캔"}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          한 줄에 하나씩 RSS URL 을 입력하세요. 지식iN 카테고리별 RSS 또는 사용자 정의 피드를 지원합니다.
        </p>
        <textarea
          className="mt-3 w-full min-h-[120px] rounded-md border border-line p-3 text-sm font-mono"
          value={feedsInput}
          onChange={(e) => setFeedsInput(e.target.value)}
          placeholder="https://.../rss..."
        />
        <p className="mt-2 text-xs text-text-muted">현재 등록된 피드: {feeds.length}개</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">
          답변 대기 큐 ({queue.length}개)
        </h2>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {loading && queue.length === 0 && <p className="mt-3 text-sm text-text-muted">불러오는 중…</p>}
        {queue.length === 0 && !loading && (
          <p className="mt-3 text-sm text-text-muted">
            대기 중인 질문이 없습니다. 상단 &quot;지금 스캔&quot; 을 눌러 신규 질문을 수집하세요.
          </p>
        )}
        <ul className="mt-4 space-y-4">
          {queue.map((q) => {
            const draftValue = editing[q.id] ?? q.draft;
            return (
              <li key={q.id} className="rounded-lg border border-line p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <a
                      href={q.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-text-strong hover:underline"
                    >
                      {q.title}
                    </a>
                    <p className="mt-1 truncate text-xs text-text-muted">{q.body}</p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1 text-xs">
                    <span className="rounded bg-navy-50 px-2 py-0.5 text-navy-700">
                      신뢰도 {(q.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-text-muted">{q.status}</span>
                  </div>
                </div>
                <textarea
                  className="mt-3 w-full min-h-[100px] rounded-md border border-line p-3 text-sm"
                  value={draftValue}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      void patchItem(q.id, {
                        status: "APPROVED",
                        draft: draftValue,
                      })
                    }
                    disabled={busy}
                  >
                    승인
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void copyDraft(q)} disabled={busy}>
                    복사
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void patchItem(q.id, { status: "EDITED", draft: draftValue })}
                    disabled={busy}
                  >
                    편집 저장
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void patchItem(q.id, { status: "REJECTED" })}
                    disabled={busy}
                  >
                    거절
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
