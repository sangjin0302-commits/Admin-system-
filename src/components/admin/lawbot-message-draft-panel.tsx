"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MessageKind =
  | "status_update"
  | "quote_followup"
  | "consultation_confirmation"
  | "case_closed";
type Tone = "formal" | "warm" | "direct";

const MESSAGE_KIND_OPTIONS: { value: MessageKind; label: string }[] = [
  { value: "status_update", label: "진행 상황 안내" },
  { value: "quote_followup", label: "견적 팔로업" },
  { value: "consultation_confirmation", label: "상담 확정" },
  { value: "case_closed", label: "사건 종결" }
];

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "formal", label: "격식체" },
  { value: "warm", label: "친근한 톤" },
  { value: "direct", label: "간결·직설" }
];

type ApiResponse = {
  ok: boolean;
  message?: string | null;
  subject?: string | null;
  warnings?: string[];
  error?: string;
};

export function LawbotMessageDraftPanel({ inquiryId }: { inquiryId: string }) {
  const [messageKind, setMessageKind] = useState<MessageKind>("status_update");
  const [tone, setTone] = useState<Tone>("formal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [copiedField, setCopiedField] = useState<"subject" | "body" | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopiedField(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/draft-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageKind, tone })
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        setError(data.error ?? "AI 메시지 초안 생성에 실패했습니다.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string | null | undefined, field: "subject" | "body") {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setError("클립보드 복사에 실패했습니다.");
    }
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-3">
        <p className="text-xs text-text-muted">Lawbot AI</p>
        <h3 className="text-sm font-semibold text-text-strong">AI 고객 메시지 초안</h3>
        <p className="mt-1 text-xs text-text-muted">
          고객에게 발송할 메시지 초안을 상황·톤별로 생성합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-strong">
            메시지 종류
          </label>
          <select
            value={messageKind}
            onChange={(e) => setMessageKind(e.target.value as MessageKind)}
            disabled={loading}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            {MESSAGE_KIND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-strong">톤</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            disabled={loading}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <Button onClick={handleGenerate} disabled={loading} variant="primary" size="md">
          {loading ? "생성 중..." : "AI 메시지 초안"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {result?.warnings && result.warnings.length > 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">확인 필요:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {result?.subject && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-text-strong">제목</p>
            <Button
              onClick={() => handleCopy(result.subject, "subject")}
              variant="secondary"
              size="sm"
            >
              {copiedField === "subject" ? "복사됨" : "복사"}
            </Button>
          </div>
          <div className="rounded-md border border-line bg-surface-muted p-3 text-sm text-text-strong">
            {result.subject}
          </div>
        </div>
      )}

      {result?.message && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium text-text-strong">본문</p>
            <Button
              onClick={() => handleCopy(result.message, "body")}
              variant="secondary"
              size="sm"
            >
              {copiedField === "body" ? "복사됨" : "복사"}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-md border border-line bg-surface-muted p-3 text-sm text-text-strong">
            {result.message}
          </pre>
        </div>
      )}

      {result && !result.message && !result.subject && (
        <p className="mt-4 text-sm text-text-muted">
          메시지 텍스트를 받지 못했습니다. Lawbot 응답을 확인해 주세요.
        </p>
      )}
    </Card>
  );
}
