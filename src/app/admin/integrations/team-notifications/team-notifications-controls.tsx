"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TeamEvent, TeamNotificationConfig } from "@/lib/services/team-notification-service";

const EVENT_LABELS: Record<TeamEvent, string> = {
  new_inquiry: "신규 문의",
  deadline_warning: "마감 임박",
  high_priority: "고우선순위",
  payment_received: "입금 확인"
};

export function TeamNotificationsControls({ initial }: { initial: TeamNotificationConfig }) {
  const [config, setConfig] = useState<TeamNotificationConfig>(initial);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    try {
      await fetch("/api/admin/integrations/team-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "config", config })
      });
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/team-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" })
      });
      const data = await res.json();
      setTestResult(`Slack: ${data.slack ? "OK" : "실패"} · Discord: ${data.discord ? "OK" : "실패"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-3">
        <h3 className="text-base font-semibold">채널</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.slack}
            onChange={(e) => setConfig({ ...config, slack: e.target.checked })}
          />
          Slack 사용
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.discord}
            onChange={(e) => setConfig({ ...config, discord: e.target.checked })}
          />
          Discord 사용
        </label>
      </Card>

      <Card className="p-6 space-y-2">
        <h3 className="text-base font-semibold">이벤트 구독</h3>
        {(Object.keys(EVENT_LABELS) as TeamEvent[]).map((ev) => (
          <label key={ev} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.events[ev]}
              onChange={(e) => setConfig({ ...config, events: { ...config.events, [ev]: e.target.checked } })}
            />
            {EVENT_LABELS[ev]}
          </label>
        ))}
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={loading}>
          저장
        </Button>
        <Button variant="secondary" onClick={sendTest} disabled={loading}>
          테스트 전송
        </Button>
      </div>
      {testResult && <p className="text-sm text-text-muted">{testResult}</p>}
    </div>
  );
}
