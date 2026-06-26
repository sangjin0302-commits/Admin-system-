"use client";

import { useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  templateKey: string;
  initialSubject: string;
  initialBodyHtml: string;
  variables: string[];
};

export function TemplateEditor({
  templateKey,
  initialSubject,
  initialBodyHtml,
  variables,
}: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: templateKey, subject, bodyHtml }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("저장되었습니다.");
      } else {
        setMessage(`저장 실패: ${data.error ?? "unknown"}`);
      }
    } catch (error) {
      setMessage(`오류: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-text-strong">제목</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-strong">본문 (HTML)</label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={16}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs"
          />
        </div>
        <div className="text-xs text-text-muted">
          사용 가능 변수:{" "}
          {variables.map((v) => (
            <code key={v} className="mr-1 rounded bg-surface-muted px-1">{`{{${v}}}`}</code>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          {message && <span className="text-xs text-text-muted">{message}</span>}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-strong">미리보기</p>
        <div className="mt-1 rounded-md border border-line bg-surface p-3">
          <p className="text-sm font-semibold text-text-strong">{subject}</p>
          <div
            className="mt-3 border-t border-line pt-3 text-sm"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
          />
        </div>
      </div>
    </div>
  );
}
