"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  FactCheckPolicy,
  FactCheckResult,
} from "@/lib/services/fact-check-gate-service";

type RecentEntry = {
  at: string;
  passed: boolean;
  excerpt: string;
  counts: { total: number; verified: number; contradicted: number; unverifiable: number };
  model: string;
};

export default function FactCheckClient({
  policy,
  recent,
  enabled,
}: {
  policy: FactCheckPolicy;
  recent: RecentEntry[];
  enabled: boolean;
}) {
  const [text, setText] = useState("");
  const [clientDataJson, setClientDataJson] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPolicy, setLocalPolicy] = useState<FactCheckPolicy>(policy);
  const [savingPolicy, setSavingPolicy] = useState(false);

  async function runCheck() {
    setBusy(true);
    setError(null);
    setResult(null);
    let clientData: Record<string, unknown> | undefined;
    if (clientDataJson.trim()) {
      try {
        clientData = JSON.parse(clientDataJson);
      } catch {
        setError("clientData JSON 파싱 실패");
        setBusy(false);
        return;
      }
    }
    try {
      const res = await fetch("/api/admin/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, clientData, policy: localPolicy }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "실행 실패");
      else setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  async function savePolicy() {
    setSavingPolicy(true);
    try {
      await fetch("/api/admin/fact-check", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localPolicy),
      });
    } finally {
      setSavingPolicy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">엄격도 (정책)</p>
        <div className="grid gap-2 md:grid-cols-3">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={localPolicy.blockOnContradicted}
              onChange={(e) => setLocalPolicy({ ...localPolicy, blockOnContradicted: e.target.checked })}
            />
            상충 주장 발견 시 차단
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={localPolicy.blockOnUnverifiable}
              onChange={(e) => setLocalPolicy({ ...localPolicy, blockOnUnverifiable: e.target.checked })}
            />
            검증불가 주장도 차단
          </label>
          <label className="flex items-center gap-2 text-xs">
            최대 claim 수
            <input
              type="number"
              min={1}
              max={20}
              value={localPolicy.maxClaims}
              onChange={(e) => setLocalPolicy({ ...localPolicy, maxClaims: Number(e.target.value) || 8 })}
              className="w-16 rounded border border-line px-2 py-1"
            />
          </label>
        </div>
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={savePolicy} disabled={savingPolicy}>
            {savingPolicy ? "저장 중..." : "정책 저장"}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">수동 재검사</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="AI 초안 텍스트를 붙여넣으세요"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs"
        />
        <div className="mt-2">
          <p className="text-xs text-text-muted">의뢰인 데이터 (선택, JSON)</p>
          <textarea
            value={clientDataJson}
            onChange={(e) => setClientDataJson(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-xs"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button variant="primary" size="md" onClick={runCheck} disabled={busy || !enabled || !text.trim()}>
            {busy ? "검사 중..." : "fact-check 실행"}
          </Button>
          {!enabled && <span className="text-xs text-rose-700">플래그 off — 실행 차단</span>}
        </div>
        {error && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {result && (
          <div className="mt-3 space-y-2 text-xs">
            <p
              className={
                "rounded p-2 font-semibold " +
                (result.passed
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800")
              }
            >
              {result.passed ? "게이트 통과" : "게이트 차단"} · model={result.model}
            </p>
            {result.contradicted.length > 0 && (
              <div>
                <p className="font-semibold text-rose-700">상충 ({result.contradicted.length})</p>
                <ul className="list-disc pl-5">
                  {result.contradicted.map((v, i) => (
                    <li key={i}>
                      <span className="font-mono">{v.claim.text}</span>
                      {v.evidence && <span className="ml-2 text-text-muted">— {v.evidence}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.unverifiable.length > 0 && (
              <div>
                <p className="font-semibold text-amber-700">검증불가 ({result.unverifiable.length})</p>
                <ul className="list-disc pl-5">
                  {result.unverifiable.map((v, i) => (
                    <li key={i}>
                      <span className="font-mono">{v.claim.text}</span>
                      {v.evidence && <span className="ml-2 text-text-muted">— {v.evidence}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.verified.length > 0 && (
              <div>
                <p className="font-semibold text-emerald-700">확인 ({result.verified.length})</p>
                <ul className="list-disc pl-5">
                  {result.verified.map((v, i) => (
                    <li key={i}>
                      <span className="font-mono">{v.claim.text}</span>
                      {v.evidence && <span className="ml-2 text-text-muted">— {v.evidence}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">최근 fact-check 결과</p>
        {recent.length === 0 ? (
          <p className="text-xs text-text-muted">최근 기록이 없습니다.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-left text-text-muted">
              <tr>
                <th className="py-1">시각</th>
                <th>결과</th>
                <th>Claim</th>
                <th>발췌</th>
                <th>Model</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-1">{new Date(r.at).toLocaleString("ko-KR")}</td>
                  <td>
                    <span
                      className={
                        "rounded px-1.5 py-0.5 " +
                        (r.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")
                      }
                    >
                      {r.passed ? "통과" : "차단"}
                    </span>
                  </td>
                  <td>
                    총 {r.counts.total} · 확인 {r.counts.verified} · 상충 {r.counts.contradicted} · 검증불가{" "}
                    {r.counts.unverifiable}
                  </td>
                  <td className="max-w-[240px] truncate">{r.excerpt}</td>
                  <td className="font-mono">{r.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
