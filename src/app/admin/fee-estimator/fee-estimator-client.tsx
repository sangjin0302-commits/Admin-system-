"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { FeeEstimate, FeeTable } from "@/lib/services/fee-estimator-service";

type Benchmark = FeeTable;

const CATEGORY_LABELS: Record<string, string> = {
  VISA_STAY: "비자/체류",
  ADMIN_APPEAL: "행정심판",
  CONTRACT_INVESTIGATION: "계약/사실조사",
  LICENSE_PERMIT: "인허가",
  CORPORATE: "법인",
  TRANSLATION_NOTARY: "번역/공증",
};

function formatKRW(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function FeeEstimatorClient({ benchmark }: { benchmark: Benchmark }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [clientType, setClientType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [hasComplexFactors, setHasComplexFactors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeeEstimate | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/fee-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category: category || undefined,
          urgency,
          clientType,
          hasComplexFactors,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `요청 실패 (${res.status})`);
      }
      const data = (await res.json()) as FeeEstimate;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    setToast("본 사건에 적용되었습니다 (견적 생성 페이지로 이동 예정)");
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-strong">의뢰 정보 입력</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-strong">의뢰 설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              className="mt-1 w-full rounded-lg border border-line bg-surface p-3 text-sm"
              placeholder="예: 강제퇴거 처분에 대한 행정심판을 진행해주세요. 7일 안에 청구서 제출이 필요합니다."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-strong">카테고리 (선택)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-sm"
            >
              <option value="">AI 자동 분류</option>
              {Object.keys(benchmark).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-strong">긴급도</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as typeof urgency)}
              className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-sm"
            >
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음 (×1.3)</option>
              <option value="CRITICAL">최우선 (×1.5)</option>
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-text-strong">의뢰인 유형</span>
            <div className="mt-2 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="clientType"
                  checked={clientType === "INDIVIDUAL"}
                  onChange={() => setClientType("INDIVIDUAL")}
                />
                <span>개인</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="clientType"
                  checked={clientType === "COMPANY"}
                  onChange={() => setClientType("COMPANY")}
                />
                <span>법인 (×1.2)</span>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasComplexFactors}
              onChange={(e) => setHasComplexFactors(e.target.checked)}
            />
            <span>복잡 요소 포함 (×1.4)</span>
          </label>

          <button
            type="submit"
            disabled={loading || description.trim().length < 2}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "분석 중..." : "AI 견적 생성"}
          </button>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </form>
      </Card>

      <div className="space-y-4">
        {result ? (
          <ResultPanel result={result} onApply={handleApply} />
        ) : (
          <Card className="p-6">
            <p className="text-sm text-text-muted">
              왼쪽에 의뢰 내용을 입력하고 견적을 생성하세요. AI가 카테고리 분류와 함께 시장 기준 수임료를
              제안합니다.
            </p>
          </Card>
        )}
        {toast && (
          <div className="rounded-lg border border-line bg-surface p-3 text-sm text-text-strong shadow-sm">
            {toast}
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <BenchmarkTable benchmark={benchmark} />
      </div>
    </div>
  );
}

function ResultPanel({ result, onApply }: { result: FeeEstimate; onApply: () => void }) {
  const confidencePct = Math.round(result.confidence * 100);
  return (
    <Card className="p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-muted">분류 결과</p>
        <p className="mt-1 text-base font-semibold text-text-strong">
          {CATEGORY_LABELS[result.serviceCategory] ?? result.serviceCategory} · {result.serviceName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs text-text-muted">기본 범위</p>
          <p className="mt-1 text-sm font-medium text-text-strong">
            {formatKRW(result.baseRange.min)} ~ {formatKRW(result.baseRange.max)}
          </p>
        </div>
        <div className="rounded-lg border border-primary bg-primary/5 p-3">
          <p className="text-xs text-text-muted">조정 후 견적</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {formatKRW(result.adjustedRange.min)} ~ {formatKRW(result.adjustedRange.max)}
          </p>
        </div>
      </div>

      {result.adjustments.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-text-muted">조정 요인</p>
          <ul className="mt-2 space-y-1 text-sm text-text-strong">
            {result.adjustments.map((adj, idx) => (
              <li key={idx} className="flex justify-between border-b border-line py-1">
                <span>{adj.reason}</span>
                <span className="text-text-muted">×{adj.factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">신뢰도</span>
          <span className="text-text-strong">{confidencePct}%</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-surface-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-text-muted">AI 추론</p>
        <p className="mt-1 text-sm text-text-strong">{result.reasoning}</p>
      </div>

      {result.similarPastCases && result.similarPastCases.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-text-muted">유사 과거 사건</p>
          <ul className="mt-2 space-y-1 text-sm">
            {result.similarPastCases.map((c) => (
              <li key={c.caseId} className="flex justify-between border-b border-line py-1">
                <span className="truncate text-text-strong">{c.title}</span>
                <span className="text-text-muted">{formatKRW(c.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onApply}
        className="w-full rounded-lg border border-primary bg-surface px-4 py-2 text-sm font-semibold text-primary"
      >
        본 사건에 적용
      </button>
    </Card>
  );
}

function BenchmarkTable({ benchmark }: { benchmark: Benchmark }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-strong">시장 기준 수임료 표 (2025)</h3>
        <Link
          href="/admin/fee-estimator/edit"
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-text-strong hover:bg-surface-muted"
        >
          테이블 편집
        </Link>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {Object.entries(benchmark).map(([cat, services]) => (
          <div key={cat} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-text-strong">
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(services as Record<string, { min: number; max: number }>).map(
                ([name, range]) => (
                  <li key={name} className="flex justify-between border-b border-line py-1">
                    <span className="text-text-strong">{name}</span>
                    <span className="text-text-muted">
                      {formatKRW(range.min)} ~ {formatKRW(range.max)}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
