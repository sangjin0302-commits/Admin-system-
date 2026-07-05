"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Job = {
  id: string;
  name: string;
  payload: unknown;
  status: "pending" | "running" | "done" | "failed";
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledFor?: string;
  finishedAt?: string;
  error?: string;
};

export function JobsClient({
  initialJobs,
  handlers,
}: {
  initialJobs: Job[];
  handlers: string[];
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [name, setName] = useState<string>(handlers[0] ?? "");
  const [payloadStr, setPayloadStr] = useState<string>("{}");
  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  async function refresh() {
    try {
      const res = await fetch("/api/admin/jobs", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { jobs?: Job[] };
      if (Array.isArray(data.jobs)) setJobs(data.jobs);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "새로고침 실패");
    }
  }

  async function callApi(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok === false) throw new Error(data.error ?? `HTTP ${res.status}`);
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "요청 실패");
    } finally {
      setBusy(false);
    }
  }

  async function onEnqueue() {
    let payload: unknown = {};
    try {
      payload = payloadStr.trim() ? JSON.parse(payloadStr) : {};
    } catch (err) {
      setMsg(`payload JSON 파싱 실패: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    if (!name) {
      setMsg("잡 이름을 선택하세요");
      return;
    }
    await callApi({ action: "enqueue", name, payload });
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold">수동 큐 추가 (테스트)</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs text-text-muted">핸들러</label>
            <Select value={name} onChange={(e) => setName(e.target.value)}>
              {handlers.length === 0 ? (
                <option value="">등록된 핸들러 없음</option>
              ) : (
                handlers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))
              )}
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-text-muted">payload (JSON)</label>
            <Input value={payloadStr} onChange={(e) => setPayloadStr(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={onEnqueue} disabled={busy}>
            큐 추가
          </Button>
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            새로고침
          </Button>
        </div>
        {msg && <p className="mt-2 text-xs text-warning">{msg}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">최근 잡</h3>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">잡이 없습니다.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">이름</th>
                  <th className="pb-2">상태</th>
                  <th className="pb-2">시도</th>
                  <th className="pb-2">생성</th>
                  <th className="pb-2">액션</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t border-border/40">
                    <td className="py-2 font-mono text-xs">{j.id}</td>
                    <td className="py-2">{j.name}</td>
                    <td className="py-2">
                      <StatusBadge status={j.status} />
                      {j.error && <span className="ml-2 text-xs text-error">{j.error}</span>}
                    </td>
                    <td className="py-2 font-mono">
                      {j.attempts}/{j.maxAttempts}
                    </td>
                    <td className="py-2 text-xs text-text-muted">
                      {new Date(j.createdAt).toLocaleString("ko-KR")}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          disabled={busy || j.status === "running"}
                          onClick={() => callApi({ action: "retry", id: j.id })}
                        >
                          재시도
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy || j.status === "running" || j.status === "done"}
                          onClick={() => callApi({ action: "cancel", id: j.id })}
                        >
                          취소
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function StatusBadge({ status }: { status: Job["status"] }) {
  const color =
    status === "done"
      ? "bg-emerald-100 text-emerald-800"
      : status === "failed"
      ? "bg-red-100 text-red-800"
      : status === "running"
      ? "bg-blue-100 text-blue-800"
      : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{status}</span>;
}
