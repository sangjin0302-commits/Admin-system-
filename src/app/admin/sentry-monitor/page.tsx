"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SentryStatus = {
  configured: boolean;
  queued: number;
  maxBatch: number;
  environment: string;
  org: string | null;
  project: string | null;
  featureEnabled: boolean;
  dashboardUrl?: string | null;
};

export default function AdminSentryMonitorPage() {
  const [status, setStatus] = useState<SentryStatus | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sentry-monitor", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "조회 실패");
      else setStatus(json.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flush = useCallback(async () => {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/sentry-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "flush" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "flush 실패");
      else {
        setFlash(
          json.result.skipped
            ? `flush skipped: ${json.result.reason ?? "unknown"}`
            : `전송 ${json.result.sent}개, 실패 ${json.result.failed}개`
        );
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [load]);

  const sendTest = useCallback(async () => {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/sentry-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "테스트 실패");
      else {
        setFlash(
          json.result.skipped
            ? `테스트 skipped: ${json.result.reason ?? "unknown"}`
            : `테스트 이벤트 전송: sent=${json.result.sent}, failed=${json.result.failed}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Sentry 에러 모니터링</h1>
          <p className="text-sm text-gray-500">
            SENTRY_DSN 설정 시 미치유 에러를 Sentry로 배치 전송하고, 자가 치유 성공 시 이벤트를 resolved 로 마킹합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={sendTest} disabled={busy} className="bg-gray-200 text-gray-800">
            {busy ? "..." : "테스트 이벤트"}
          </Button>
          <Button onClick={flush} disabled={busy}>
            {busy ? "..." : "지금 flush"}
          </Button>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {flash && <div className="text-green-600 text-sm">{flash}</div>}

      <Card className="p-4 space-y-3">
        <h2 className="font-medium">현재 설정</h2>
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중...</div>
        ) : status ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">기능 플래그</dt>
            <dd>{status.featureEnabled ? "ON" : "OFF (sentry_monitoring 활성화 필요)"}</dd>
            <dt className="text-gray-500">DSN 설정</dt>
            <dd>{status.configured ? "OK" : "미설정 (SENTRY_DSN)"}</dd>
            <dt className="text-gray-500">환경</dt>
            <dd>{status.environment}</dd>
            <dt className="text-gray-500">Org / Project</dt>
            <dd>
              {status.org ?? "(미설정)"} / {status.project ?? "(미설정)"}
            </dd>
            <dt className="text-gray-500">배치 큐</dt>
            <dd>
              {status.queued} / {status.maxBatch}
            </dd>
            <dt className="text-gray-500">대시보드</dt>
            <dd>
              {status.dashboardUrl ? (
                <a
                  href={status.dashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Sentry 열기
                </a>
              ) : (
                <span className="text-gray-500">
                  SENTRY_ORG/SENTRY_PROJECT 설정 시 표시됩니다.
                </span>
              )}
            </dd>
          </dl>
        ) : (
          <div className="text-sm text-gray-500">데이터 없음</div>
        )}
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-medium">설정 안내</h2>
        <p className="text-sm text-gray-600">
          <code>.env.local</code> 에 다음 값을 설정하세요:
        </p>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
{`SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/YYY
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=xxxxx   # 이벤트 resolve API용 (자가 치유 연동)
SENTRY_ENVIRONMENT=production`}
        </pre>
        <p className="text-xs text-gray-500">
          플래그를 켜지 않으면 배치 flush 는 자동으로 skip 됩니다.
        </p>
      </Card>
    </div>
  );
}
