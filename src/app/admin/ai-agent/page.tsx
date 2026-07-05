"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type StepResult = {
  stepId: string;
  action: string;
  status: "ok" | "failed" | "skipped";
  summary: string;
  data?: unknown;
  startedAt: string;
  endedAt: string;
  error?: string;
};

type AgentEvent =
  | { type: "start"; workflowId: string; entityId: string; totalSteps: number }
  | { type: "step:start"; stepId: string; action: string; index: number }
  | { type: "step:end"; stepId: string; action: string; result: StepResult; index: number }
  | { type: "done"; result: { workflowId: string; entityId: string; ok: boolean; steps: StepResult[] } }
  | { type: "error"; message: string };

type WorkflowSummary = {
  id: string;
  label: string;
  description: string;
  entity: "inquiry" | "case";
  steps: { id: string; action: string }[];
};

const WORKFLOW_LIST: WorkflowSummary[] = [
  {
    id: "new_inquiry_full_process",
    label: "신규 문의 종합 처리",
    description: "우선순위 점수 → 체크리스트 → 상담 스크립트 → 카카오 접수 확인",
    entity: "inquiry",
    steps: [
      { id: "score", action: "scoreInquiry" },
      { id: "checklist", action: "generateChecklist" },
      { id: "script", action: "draftConsultationScript" },
      { id: "notify", action: "sendKakaoConfirmation" },
    ],
  },
  {
    id: "case_open_prep",
    label: "사건 개시 준비",
    description: "체크리스트 → 필요 서류 → 고객 안내",
    entity: "case",
    steps: [
      { id: "checklist", action: "createChecklist" },
      { id: "docs", action: "generateRequiredDocs" },
      { id: "notify", action: "notifyClient" },
    ],
  },
  {
    id: "case_close_wrap",
    label: "사건 종결 마무리",
    description: "종결 요약 → 후기 요청 → 재참여",
    entity: "case",
    steps: [
      { id: "summary", action: "generateClosingSummary" },
      { id: "review", action: "sendReviewRequest" },
      { id: "reeng", action: "scheduleReengagement" },
    ],
  },
];

function listWorkflows(): WorkflowSummary[] {
  return WORKFLOW_LIST;
}

type LogEntry = { ts: string; text: string; tone: "info" | "ok" | "warn" | "err" };

export default function AdminAiAgentPage() {
  const workflows = listWorkflows();
  const [entityId, setEntityId] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [stepResults, setStepResults] = useState<Record<string, StepResult[]>>({});

  const appendLog = (wfId: string, entry: LogEntry) => {
    setLogs((prev) => ({ ...prev, [wfId]: [...(prev[wfId] ?? []), entry] }));
  };

  const runWorkflow = async (wfId: string) => {
    const id = entityId[wfId]?.trim();
    if (!id) {
      appendLog(wfId, { ts: new Date().toISOString(), text: "entityId를 입력하세요.", tone: "warn" });
      return;
    }
    setRunning(wfId);
    setLogs((prev) => ({ ...prev, [wfId]: [] }));
    setStepResults((prev) => ({ ...prev, [wfId]: [] }));

    try {
      const res = await fetch("/api/admin/ai-agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: wfId, entityId: id }),
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        appendLog(wfId, { ts: new Date().toISOString(), text: `요청 실패 (${res.status}): ${t}`, tone: "err" });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const chunk of parts) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim()) as AgentEvent;
            handleEvent(wfId, ev);
          } catch {
            // skip bad chunk
          }
        }
      }
    } catch (err) {
      appendLog(wfId, {
        ts: new Date().toISOString(),
        text: `에러: ${err instanceof Error ? err.message : String(err)}`,
        tone: "err",
      });
    } finally {
      setRunning(null);
    }
  };

  const handleEvent = (wfId: string, ev: AgentEvent) => {
    const ts = new Date().toISOString();
    if (ev.type === "start") {
      appendLog(wfId, { ts, text: `시작 — 총 ${ev.totalSteps}단계`, tone: "info" });
    } else if (ev.type === "step:start") {
      appendLog(wfId, { ts, text: `▶ [${ev.index + 1}] ${ev.action} 실행 중…`, tone: "info" });
    } else if (ev.type === "step:end") {
      const tone: LogEntry["tone"] =
        ev.result.status === "ok" ? "ok" : ev.result.status === "skipped" ? "warn" : "err";
      const icon = ev.result.status === "ok" ? "✓" : ev.result.status === "skipped" ? "⤼" : "✗";
      appendLog(wfId, { ts, text: `${icon} [${ev.index + 1}] ${ev.action}: ${ev.result.summary}`, tone });
      setStepResults((prev) => ({ ...prev, [wfId]: [...(prev[wfId] ?? []), ev.result] }));
    } else if (ev.type === "done") {
      appendLog(wfId, {
        ts,
        text: ev.result.ok ? "완료 — 모든 단계 성공" : "완료 — 일부 단계 실패/스킵",
        tone: ev.result.ok ? "ok" : "warn",
      });
    } else if (ev.type === "error") {
      appendLog(wfId, { ts, text: `오류: ${ev.message}`, tone: "err" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">AI Agent</p>
        <h1 className="mt-2 ui-page-title">AI 멀티스텝 자동화</h1>
        <p className="mt-2 text-sm text-text-muted">
          여러 서비스(우선순위·체크리스트·스크립트·알림)를 하나의 워크플로로 원클릭 실행합니다.
        </p>
      </Card>

      {workflows.map((wf) => {
        const isRunning = running === wf.id;
        const wfLogs = logs[wf.id] ?? [];
        return (
          <Card key={wf.id} className="p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-strong">{wf.label}</h2>
                <p className="mt-1 text-sm text-text-muted">{wf.description}</p>
                <p className="mt-1 text-xs text-text-muted">
                  대상: {wf.entity === "inquiry" ? "문의(Inquiry)" : "사건(CaseMatter)"} · 단계 {wf.steps.length}개
                </p>
              </div>
              <div className="flex flex-col gap-2 md:min-w-[320px]">
                <Input
                  placeholder={wf.entity === "inquiry" ? "inquiryId" : "caseMatterId"}
                  value={entityId[wf.id] ?? ""}
                  onChange={(e) => setEntityId((p) => ({ ...p, [wf.id]: e.target.value }))}
                  disabled={isRunning}
                />
                <Button onClick={() => runWorkflow(wf.id)} disabled={isRunning || running !== null}>
                  {isRunning ? "실행 중…" : "실행"}
                </Button>
              </div>
            </div>

            {wfLogs.length > 0 && (
              <div className="mt-4 rounded-lg border border-line bg-surface-muted p-3">
                <p className="text-xs font-semibold text-text-muted">진행 로그</p>
                <ol className="mt-2 space-y-1 text-xs font-mono">
                  {wfLogs.map((log, i) => (
                    <li
                      key={i}
                      className={
                        log.tone === "ok"
                          ? "text-emerald-700"
                          : log.tone === "err"
                            ? "text-rose-700"
                            : log.tone === "warn"
                              ? "text-amber-700"
                              : "text-text-muted"
                      }
                    >
                      <span className="opacity-50">{log.ts.slice(11, 19)}</span> {log.text}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
