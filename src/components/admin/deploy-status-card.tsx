"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";

type Deployment = {
  id: string;
  state: string;
  createdAt: number;
  url: string;
  meta: { githubCommitMessage: string | null };
};

function stateIcon(state: string) {
  if (state === "READY") return "🟢";
  if (state === "ERROR" || state === "CANCELED") return "🔴";
  return "🟡";
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function DeployStatusCard() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/deploy-status")
      .then((r) => r.json())
      .then((data) => {
        setDeployments(data.deployments ?? []);
        if (data.error) setError(data.error);
      })
      .catch(() => setError("fetch_failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="p-5">
      <p className="ui-kicker">배포 상태</p>
      {loading && <p className="mt-3 text-xs text-text-muted">로딩 중...</p>}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {!loading && deployments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {deployments.map((d) => (
            <li key={d.id} className="flex items-start gap-2 text-xs">
              <span className="shrink-0">{stateIcon(d.state)}</span>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-text-muted">{d.state}</span>
                <span className="mx-1.5 text-text-muted">·</span>
                <span className="text-text-muted">{timeAgo(d.createdAt)}</span>
                {d.meta.githubCommitMessage && (
                  <p className="mt-0.5 truncate text-text">{d.meta.githubCommitMessage}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && deployments.length === 0 && !error && (
        <p className="mt-3 text-xs text-text-muted">배포 데이터 없음</p>
      )}
    </Card>
  );
}
