"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
type PendingIntake = {
  id: string;
  source: "telegram" | "kakao";
  rawText: string;
  fields: {
    name: string | null;
    phone: string | null;
    category: string | null;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    summary: string;
    confidence: number;
  };
  confidence: number;
  createdAt: string;
  status: "PENDING_REVIEW";
};

const CATEGORY_LABELS: Record<string, string> = {
  VISA_STAY: "체류·비자",
  NATURALIZATION: "귀화",
  CORPORATE_REQUEST: "법인",
  GENERAL_ADMIN_CIVIL: "민원",
  ADMIN_APPEAL: "행정심판",
  APOSTILLE_CONSULAR: "아포스티유",
  FOREIGNER_VISA: "외국인 비자",
  IMMIGRATION_STAY: "출입국·체류",
};

function getCategoryLabel(key: string | null): string {
  if (!key) return "-";
  return CATEGORY_LABELS[key] ?? key;
}

type TestResult = {
  status: string;
  inquiryId?: string;
  pendingId?: string;
  confidence?: number;
  fields?: {
    name: string | null;
    phone: string | null;
    category: string | null;
    urgency: string;
    summary: string;
    confidence: number;
  };
  reason?: string;
};

export default function AdminMessengerBotPage() {
  const [pending, setPending] = useState<PendingIntake[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState<string>("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messenger-bot", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "불러오기 실패");
        setPending([]);
        return;
      }
      setPending(data.pending ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: "approve" | "reject", id: string) => {
    try {
      const res = await fetch("/api/admin/messenger-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(`실패: ${data.error ?? res.statusText}`);
        return;
      }
      await load();
    } catch (err) {
      alert(`오류: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const runTest = async () => {
    if (!testText.trim()) return;
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/messenger-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", text: testText }),
      });
      const data = await res.json();
      setTestResult((data.result as TestResult) ?? { status: "error", reason: data.error });
      await load();
    } catch (err) {
      setTestResult({ status: "error", reason: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Messenger Bot</p>
        <h1 className="mt-2 ui-page-title">텔레그램·카카오 자동 접수 봇</h1>
        <p className="mt-2 text-sm text-text-muted">
          인바운드 메시지를 AI가 파싱해 자동으로 문의를 생성합니다. 신뢰도가 낮으면 아래 대기열에 표시되며, 관리자가 승인/거부합니다.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          웹훅: <code>/api/webhooks/telegram-intake</code> · <code>/api/webhooks/kakao-intake</code>
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-strong">대기 중 접수 ({pending.length})</h2>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? "새로고침 중…" : "새로고침"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {pending.length === 0 && !loading && (
          <p className="mt-3 text-sm text-text-muted">대기 중인 접수가 없습니다.</p>
        )}
        <ul className="mt-4 space-y-3">
          {pending.map((p) => (
            <li key={p.id} className="rounded-lg border border-line bg-surface-muted p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">
                  {p.source}
                </span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">
                  신뢰도 {(p.confidence * 100).toFixed(0)}%
                </span>
                <span className="text-text-muted">{new Date(p.createdAt).toLocaleString("ko-KR")}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <span className="text-text-muted">이름: </span>
                  <span className="text-text-strong">{p.fields.name ?? "-"}</span>
                </div>
                <div>
                  <span className="text-text-muted">전화: </span>
                  <span className="text-text-strong">{p.fields.phone ?? "-"}</span>
                </div>
                <div>
                  <span className="text-text-muted">카테고리: </span>
                  <span className="text-text-strong">{getCategoryLabel(p.fields.category)}</span>
                </div>
                <div>
                  <span className="text-text-muted">긴급도: </span>
                  <span className="text-text-strong">{p.fields.urgency}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-text-strong">{p.fields.summary}</p>
              <details className="mt-2 text-xs text-text-muted">
                <summary className="cursor-pointer">원문 보기</summary>
                <pre className="mt-1 whitespace-pre-wrap break-words">{p.rawText}</pre>
              </details>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void act("approve", p.id)}>
                  승인
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void act("reject", p.id)}>
                  거부
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">메시지 파서 테스트</h2>
        <p className="mt-1 text-sm text-text-muted">
          웹훅을 거치지 않고 임의의 텍스트로 파싱 결과를 확인합니다.
        </p>
        <Textarea
          className="mt-3"
          rows={4}
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="예) 안녕하세요, 홍길동입니다. F-2 비자 관련 상담 급하게 필요합니다. 010-1234-5678"
        />
        <div className="mt-3">
          <Button onClick={() => void runTest()} disabled={!testText.trim()}>
            파싱 실행
          </Button>
        </div>
        {testResult && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </Card>
    </div>
  );
}
