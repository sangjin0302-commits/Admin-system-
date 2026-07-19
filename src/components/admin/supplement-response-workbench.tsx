"use client";

import { useState, useTransition } from "react";

import { Card } from "@/components/ui/card";

interface DraftShape {
  subject: string;
  body: string;
  citedProvisions: string[];
  requiredDocuments: string[];
  signatureBlock: string;
  provider: "claude-haiku" | "fallback";
  warnings: string[];
}

export function SupplementResponseWorkbench({
  inquiryId,
  caseId
}: {
  inquiryId: string;
  caseId: string;
}) {
  const [requestText, setRequestText] = useState("");
  const [draft, setDraft] = useState<DraftShape | null>(null);
  const [editableBody, setEditableBody] = useState("");
  const [editableSubject, setEditableSubject] = useState("");
  const [autoSend, setAutoSend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [ocrPending, startOcr] = useTransition();
  const [genPending, startGen] = useTransition();
  const [savePending, startSave] = useTransition();

  const handleOcrUpload = async (file: File) => {
    setError(null);
    startOcr(async () => {
      try {
        const buf = await file.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        const res = await fetch("/api/admin/document-ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: b64, mimeType: file.type })
        });
        if (!res.ok) {
          // Fallback: hit the generic ocr endpoint if present, else show error
          throw new Error(`OCR 실패 (${res.status})`);
        }
        const data = (await res.json()) as { text?: string; result?: { text?: string } };
        const text = data.text ?? data.result?.text ?? "";
        if (text) {
          setRequestText((prev) => (prev ? `${prev}\n\n${text}` : text));
        } else {
          setError("OCR 결과 텍스트를 얻지 못했습니다.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "OCR 실패");
      }
    });
  };

  const handleGenerate = () => {
    setError(null);
    setSaved(false);
    startGen(async () => {
      try {
        const res = await fetch(`/api/admin/inquiries/${inquiryId}/supplement-response`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId, requestText })
        });
        const data = (await res.json()) as { ok?: boolean; draft?: DraftShape; error?: string; message?: string };
        if (!res.ok || !data.ok || !data.draft) {
          throw new Error(data.error ?? data.message ?? "초안 생성 실패");
        }
        setDraft(data.draft);
        setEditableBody(data.draft.body);
        setEditableSubject(data.draft.subject);
      } catch (e) {
        setError(e instanceof Error ? e.message : "초안 생성 실패");
      }
    });
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startSave(async () => {
      try {
        const res = await fetch(`/api/admin/inquiries/${inquiryId}/supplement-response`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            subject: editableSubject,
            body: editableBody,
            citedProvisions: draft?.citedProvisions ?? [],
            requiredDocuments: draft?.requiredDocuments ?? [],
            autoSend
          })
        });
        const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? data.message ?? "저장 실패");
        }
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장 실패");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="ui-kicker">1) 보완 요청 원문 입력</p>
        <p className="mt-1 text-xs text-text-muted">
          기관에서 받은 보완 요청서 내용을 붙여넣거나, PDF/이미지를 업로드하여 OCR로 추출하세요.
        </p>

        <div className="mt-3">
          <label className="text-xs font-medium text-text-muted" htmlFor="ocr-upload">
            PDF / 이미지 업로드 (OCR)
          </label>
          <input
            id="ocr-upload"
            type="file"
            accept="image/*,application/pdf"
            className="mt-1 block w-full text-xs"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleOcrUpload(f);
            }}
            disabled={ocrPending}
          />
          {ocrPending && <p className="mt-1 text-xs text-text-muted">OCR 처리 중…</p>}
        </div>

        <textarea
          className="mt-3 h-40 w-full rounded-md border border-border/60 p-2 text-sm"
          placeholder="보완 요청 내용을 붙여넣으세요…"
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
        />

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            onClick={handleGenerate}
            disabled={genPending || requestText.trim().length < 5}
          >
            {genPending ? "생성 중…" : "AI 답변 초안 생성"}
          </button>
          {draft && (
            <span className="text-xs text-text-muted">
              엔진: {draft.provider === "claude-haiku" ? "Claude Haiku" : "기본 템플릿"}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}
      </Card>

      {draft && (
        <Card className="p-5">
          <p className="ui-kicker">2) 초안 검토 및 편집</p>

          <label className="mt-3 block text-xs font-medium text-text-muted" htmlFor="draft-subject">
            제목
          </label>
          <input
            id="draft-subject"
            className="mt-1 w-full rounded-md border border-border/60 p-2 text-sm"
            value={editableSubject}
            onChange={(e) => setEditableSubject(e.target.value)}
          />

          <label className="mt-3 block text-xs font-medium text-text-muted" htmlFor="draft-body">
            본문
          </label>
          <textarea
            id="draft-body"
            className="mt-1 h-72 w-full rounded-md border border-border/60 p-2 text-sm"
            value={editableBody}
            onChange={(e) => setEditableBody(e.target.value)}
          />

          {draft.citedProvisions.length > 0 && (
            <div className="mt-3">
              <p className="ui-kicker">근거 조항</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {draft.citedProvisions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.requiredDocuments.length > 0 && (
            <div className="mt-3">
              <p className="ui-kicker">추가 제출 서류</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {draft.requiredDocuments.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.warnings.length > 0 && (
            <div className="mt-3 rounded-md bg-yellow-50 p-2 text-xs text-yellow-800">
              {draft.warnings.map((w, i) => (
                <p key={i}>⚠ {w}</p>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3">
            <p className="text-xs font-semibold text-red-800">위험 구역 (Danger Zone)</p>
            <label className="mt-1 flex items-center gap-2 text-xs text-red-800">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
              />
              자동 전송 활성화 (저장과 동시에 기관 담당자에게 이메일 발송 예약)
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={handleSave}
              disabled={savePending || editableBody.trim().length === 0}
            >
              {savePending ? "저장 중…" : "사건 문서로 저장"}
            </button>
            {saved && <span className="text-xs text-emerald-700">저장되었습니다.</span>}
          </div>
        </Card>
      )}
    </div>
  );
}
