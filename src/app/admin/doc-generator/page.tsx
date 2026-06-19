"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";

type DraftType = "appeal" | "complaint" | "petition" | "application" | "objection";

const TYPE_OPTIONS: { value: DraftType; label: string }[] = [
  { value: "appeal", label: "행정심판 청구서" },
  { value: "complaint", label: "진정서" },
  { value: "petition", label: "민원" },
  { value: "application", label: "인허가 신청서" },
  { value: "objection", label: "이의신청서" },
];

export default function DocGeneratorPage() {
  const [type, setType] = useState<DraftType>("appeal");
  const [clientName, setClientName] = useState("");
  const [agency, setAgency] = useState("");
  const [subject, setSubject] = useState("");
  const [facts, setFacts] = useState("");
  const [legalBasis, setLegalBasis] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDraft(null);
    setCopied(false);
    try {
      const res = await fetch("/api/admin/doc-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          clientName,
          agency,
          subject,
          facts,
          legalBasis: legalBasis || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "초안 생성 실패");
      }
      const data = (await res.json()) as { title: string; body: string };
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("클립보드 복사에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">AI Drafting</p>
        <h2 className="mt-2 ui-page-title">문서 초안 생성</h2>
        <p className="mt-2 max-w-3xl text-sm text-text-muted">
          행정심판 청구서, 진정서, 민원, 인허가 신청서, 이의신청서 초안을 자동으로 생성합니다.
          ANTHROPIC_API_KEY가 설정된 경우 Claude를 활용하고, 그렇지 않으면 템플릿 기반으로
          작성됩니다.
        </p>
      </Card>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted">문서 종류</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DraftType)}
              className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-text-muted">의뢰인</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted">대상 기관</label>
              <input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                required
                className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted">제목 / 사건명</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted">사실관계</label>
            <textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              required
              rows={5}
              className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted">
              법적 근거 (선택)
            </label>
            <input
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-white px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-text-strong px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "생성 중..." : "초안 생성"}
          </button>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </form>
      </Card>

      {draft && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-strong">{draft.title}</h3>
            <button
              onClick={handleCopy}
              className="rounded border border-line px-3 py-1.5 text-xs font-medium text-text-strong hover:bg-surface-muted"
            >
              {copied ? "복사됨" : "클립보드 복사"}
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded bg-surface-muted p-4 text-sm leading-relaxed text-text-strong">
            {draft.body}
          </pre>
        </Card>
      )}
    </div>
  );
}
