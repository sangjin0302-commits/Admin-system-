"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

type Audience = "client" | "court" | "internal" | "public";

interface TextScore {
  clarity: number;
  toneAppropriateness: number;
  persuasiveness: number;
  legalAccuracy: number;
  lengthEfficiency: number;
  overall: number;
}

interface ABResult {
  scoreA: TextScore;
  scoreB: TextScore;
  winner: "A" | "B" | "tie";
  strengthsA: string[];
  weaknessesA: string[];
  strengthsB: string[];
  weaknessesB: string[];
  synthesis: string;
  source: "ai" | "heuristic";
  comparedAt: string;
}

function ScoreBar({ label, a, b }: { label: string; a: number; b: number }) {
  return (
    <div className="text-xs">
      <div className="mb-0.5 flex justify-between">
        <span>{label}</span>
        <span className={a > b ? "text-emerald-600" : a < b ? "text-red-600" : "text-text-muted"}>
          A {Math.round(a)} · B {Math.round(b)}
        </span>
      </div>
      <div className="flex gap-1">
        <div className="h-1.5 flex-1 rounded bg-gray-200">
          <div className="h-1.5 rounded bg-blue-500" style={{ width: `${Math.min(100, a)}%` }} />
        </div>
        <div className="h-1.5 flex-1 rounded bg-gray-200">
          <div className="h-1.5 rounded bg-indigo-500" style={{ width: `${Math.min(100, b)}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function TextComparePage() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [audience, setAudience] = useState<Audience>("client");
  const [purpose, setPurpose] = useState("");
  const [result, setResult] = useState<ABResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);

  async function compare() {
    setLoading(true);
    setErr(null);
    setShowSynthesis(false);
    try {
      const res = await fetch("/api/admin/text-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textA, textB, context: { audience, purpose } }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "비교 실패");
      else setResult(json.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">답변 문안 A/B 비교</h1>
        <p className="text-sm text-text-muted">두 문안을 비교하고 합성 초안을 생성합니다.</p>
      </div>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium">대상 독자</span>
            <select
              className="w-full rounded border p-2 text-sm"
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
            >
              <option value="client">의뢰인</option>
              <option value="court">법원·행정기관</option>
              <option value="internal">내부</option>
              <option value="public">일반 공중</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium">목적</span>
            <input
              className="w-full rounded border p-2 text-sm"
              placeholder="예: 지연 사유 안내, 진행 상황 보고"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="ui-kicker">문안 A</p>
          <textarea
            className="mt-2 h-64 w-full resize-y rounded border p-2 text-sm"
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="첫 번째 문안을 입력하세요."
          />
          <p className="mt-1 text-[10px] text-text-muted">{textA.length}자</p>
        </Card>
        <Card className="p-4">
          <p className="ui-kicker">문안 B</p>
          <textarea
            className="mt-2 h-64 w-full resize-y rounded border p-2 text-sm"
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="두 번째 문안을 입력하세요."
          />
          <p className="mt-1 text-[10px] text-text-muted">{textB.length}자</p>
        </Card>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={compare}
          disabled={loading || !textA.trim() || !textB.trim()}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "비교중..." : "비교하기"}
        </button>
        {result?.synthesis ? (
          <button
            type="button"
            onClick={() => setShowSynthesis(true)}
            className="rounded border px-4 py-2 text-sm"
          >
            합성 초안 보기
          </button>
        ) : null}
      </div>

      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

      {result ? (
        <Card className="mt-6 p-4">
          <div className="flex items-baseline justify-between">
            <p className="ui-kicker">비교 결과</p>
            <span className="rounded-full border px-2 py-0.5 text-xs">
              승자: {result.winner === "tie" ? "무승부" : `문안 ${result.winner}`} · {result.source === "ai" ? "AI 판단" : "휴리스틱"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <ScoreBar label="명료성" a={result.scoreA.clarity} b={result.scoreB.clarity} />
            <ScoreBar label="톤 적합성" a={result.scoreA.toneAppropriateness} b={result.scoreB.toneAppropriateness} />
            <ScoreBar label="설득력" a={result.scoreA.persuasiveness} b={result.scoreB.persuasiveness} />
            <ScoreBar label="법률 정확도" a={result.scoreA.legalAccuracy} b={result.scoreB.legalAccuracy} />
            <ScoreBar label="길이 효율" a={result.scoreA.lengthEfficiency} b={result.scoreB.lengthEfficiency} />
            <ScoreBar label="총점" a={result.scoreA.overall} b={result.scoreB.overall} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium">문안 A</p>
              {result.strengthsA.length ? (
                <div className="mt-1 text-xs">
                  <span className="text-emerald-700">강점:</span>
                  <ul className="list-disc pl-4">
                    {result.strengthsA.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.weaknessesA.length ? (
                <div className="mt-1 text-xs">
                  <span className="text-red-700">약점:</span>
                  <ul className="list-disc pl-4">
                    {result.weaknessesA.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-medium">문안 B</p>
              {result.strengthsB.length ? (
                <div className="mt-1 text-xs">
                  <span className="text-emerald-700">강점:</span>
                  <ul className="list-disc pl-4">
                    {result.strengthsB.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.weaknessesB.length ? (
                <div className="mt-1 text-xs">
                  <span className="text-red-700">약점:</span>
                  <ul className="list-disc pl-4">
                    {result.weaknessesB.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {showSynthesis && result.synthesis ? (
            <div className="mt-4 rounded border bg-surface-muted p-3 text-sm">
              <p className="mb-2 text-xs font-semibold">합성 초안</p>
              <pre className="whitespace-pre-wrap break-words text-sm">{result.synthesis}</pre>
              <button
                type="button"
                className="mt-2 rounded border px-2 py-1 text-xs"
                onClick={() => navigator.clipboard.writeText(result.synthesis).catch(() => undefined)}
              >
                복사
              </button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
