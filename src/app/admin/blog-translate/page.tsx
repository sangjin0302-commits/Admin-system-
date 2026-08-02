"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type PostStatus = {
  id: string;
  slug: string;
  title: string;
  hasEn: boolean;
};

export default function BlogTranslatePage() {
  const [posts, setPosts] = useState<PostStatus[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [stuckCount, setStuckCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog-translate-batch", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { posts: PostStatus[]; pendingCount: number; stuckCount?: number };
        setPosts(data.posts);
        setPendingCount(data.pendingCount);
        setStuckCount(data.stuckCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const [runningAll, setRunningAll] = useState(false);

  async function runBatch() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/blog-translate-batch", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(`오류: ${err.error ?? res.statusText}`);
      } else {
        const data = (await res.json()) as { processed: number };
        setMessage(`${data.processed}건 처리 완료`);
        await refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  // 전체 번역 — 서버는 1회 5건 상한이라, pending 이 0이 될 때까지 반복 호출.
  async function runAll() {
    setRunningAll(true);
    setMessage(null);
    let total = 0;
    try {
      for (let i = 0; i < 60; i++) {
        const res = await fetch("/api/admin/blog-translate-batch", { method: "POST" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setMessage(`중단 — 오류: ${err.error ?? res.statusText} (누적 ${total}건)`);
          break;
        }
        const data = (await res.json()) as { processed: number; succeeded?: number };
        const succeeded = data.succeeded ?? data.processed;
        total += succeeded;
        setMessage(`번역 중… 누적 ${total}건`);
        // 이번 배치에서 성공 0 → 남은 건 번역 실패(재시도해도 동일) → 무한반복 방지 중단.
        if (succeeded === 0) break;
        await refresh();
      }
      await refresh();
      setMessage(
        `전체 번역 종료 — 누적 ${total}건 번역. 남은 미번역이 있으면 번역 실패 글(3회 초과)이니 수동 검토하세요.`
      );
    } finally {
      setRunningAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Blog"
        title="블로그 자동 번역"
        description="미번역 블로그 포스트를 영문(EN)으로 자동 번역합니다. '전체 번역'은 남은 글이 없을 때까지 자동 반복(1회 5건 상한)."
      />

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-text-muted">미번역 포스트</div>
            <div className="mt-1 text-2xl font-semibold text-text-strong">{pendingCount}건</div>
            {stuckCount > 0 && (
              <div className="mt-1 text-xs text-amber-600">3회 실패 {stuckCount}건 — 수동 검토 필요</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runBatch}
              disabled={loading || runningAll || pendingCount === 0}
              className="rounded-md border border-primary/40 px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
            >
              {loading && !runningAll ? "실행 중..." : "5건 번역"}
            </button>
            <button
              onClick={runAll}
              disabled={loading || runningAll || pendingCount === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {runningAll ? "전체 번역 중..." : "전체 번역 (자동 반복)"}
            </button>
          </div>
        </div>
        {message && <div className="mt-3 text-sm text-text-muted">{message}</div>}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">최근 포스트 번역 상태</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left">제목</th>
              <th className="py-2 text-center">EN</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-2">{p.title}</td>
                <td className="py-2 text-center">{p.hasEn ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
