"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { GuidelineRule, Severity } from "@/lib/services/marketing-guideline-rules";

export function RulesClient({ initialCustom }: { initialCustom: GuidelineRule[] }) {
  const [rules, setRules] = useState<GuidelineRule[]>(initialCustom);
  const [pattern, setPattern] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<Severity>("error");
  const [suggestion, setSuggestion] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pattern.trim() || !reason.trim()) {
      setError("금지 문구·사유는 필수입니다");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/guideline-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pattern: pattern.trim(),
          isRegex,
          reason: reason.trim(),
          severity,
          suggestion: suggestion.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error ?? "저장 실패");
        return;
      }
      setRules(data.custom as GuidelineRule[]);
      setPattern("");
      setReason("");
      setSuggestion("");
      setIsRegex(false);
      setSeverity("error");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(target: string) {
    if (!confirm(`"${target}" 규칙을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(
        `/api/admin/guideline-rules?pattern=${encodeURIComponent(target)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data?.error ?? "삭제 실패");
        return;
      }
      setRules(data.custom as GuidelineRule[]);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <>
      <Card className="p-5">
        <h2 className="text-base font-semibold text-text-strong">규칙 추가</h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block text-xs">
            <span className="text-text-muted">금지 문구</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              placeholder="예: 확실히 승소"
            />
          </label>
          <label className="block text-xs">
            <span className="text-text-muted">심각도</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="error">error (즉시 수정)</option>
              <option value="warn">warn (검토 권장)</option>
            </select>
          </label>
          <label className="block text-xs md:col-span-2">
            <span className="text-text-muted">사유</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              placeholder="예: 결과 보장 프레임 금지"
            />
          </label>
          <label className="block text-xs md:col-span-2">
            <span className="text-text-muted">대체 제안 (선택)</span>
            <input
              type="text"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              placeholder="예: 검토 결과에 따라"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={(e) => setIsRegex(e.target.checked)}
            />
            <span className="text-text-muted">정규식으로 해석</span>
          </label>
          <div className="md:col-span-2 flex items-center justify-between">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "저장 중…" : "규칙 추가"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-text-strong">사용자 정의 규칙 ({rules.length})</h2>
        {rules.length === 0 ? (
          <p className="mt-3 text-xs text-text-muted">추가된 규칙이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left text-text-muted">
                  <th className="py-2 pr-2">금지 문구</th>
                  <th className="py-2 pr-2">심각도</th>
                  <th className="py-2 pr-2">사유</th>
                  <th className="py-2 pr-2">대체 제안</th>
                  <th className="py-2 pr-2 text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.pattern} className="border-b border-line/40 align-top">
                    <td className="py-2 pr-2">
                      <code className="rounded bg-line/30 px-1.5 py-0.5">{r.pattern}</code>
                      {r.isRegex && (
                        <span className="ml-1 text-[10px] text-text-muted">regex</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          r.severity === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-text-muted">{r.reason}</td>
                    <td className="py-2 pr-2 text-green-700">{r.suggestion ?? "—"}</td>
                    <td className="py-2 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => remove(r.pattern)}
                        className="text-[11px] text-red-600 hover:underline"
                      >
                        삭제
                      </button>
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
