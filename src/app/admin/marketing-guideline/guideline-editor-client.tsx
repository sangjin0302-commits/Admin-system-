"use client";

import { useState } from "react";

type Doc = {
  version: string;
  content: string;
  updatedAt: string;
  updatedBy?: string | null;
};

type VersionRef = { version: string; updatedAt: string };

export function GuidelineEditorClient({
  initialDoc,
  initialVersions,
}: {
  initialDoc: Doc;
  initialVersions: VersionRef[];
}) {
  const [content, setContent] = useState(initialDoc.content);
  const [version, setVersion] = useState(initialDoc.version);
  const [current, setCurrent] = useState<Doc>(initialDoc);
  const [versions, setVersions] = useState<VersionRef[]>(initialVersions);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "loading">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/marketing-guideline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, version }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        current?: Doc;
        versions?: VersionRef[];
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "저장 실패");
        return;
      }
      if (data.current) setCurrent(data.current);
      if (data.versions) {
        setVersions(data.versions.map((v) => ({ version: v.version, updatedAt: v.updatedAt })));
      }
      setStatus("saved");
    } catch {
      setStatus("error");
      setMessage("네트워크 오류");
    }
  }

  async function loadVersion(v: string) {
    if (!v) return;
    setStatus("loading");
    setMessage(null);
    try {
      // GET에는 버전 필터가 없어서 versions 목록에서 찾거나 전체 조회 후 filter.
      const res = await fetch("/api/admin/marketing-guideline");
      const data = (await res.json().catch(() => ({}))) as {
        current?: Doc;
        versions?: Doc[];
      };
      const list = [
        ...(data.current ? [data.current] : []),
        ...(data.versions ?? []),
      ];
      const hit = list.find((d) => d.version === v);
      if (!hit) {
        setStatus("error");
        setMessage("해당 버전 문서를 찾지 못했습니다.");
        return;
      }
      setContent(hit.content);
      setVersion(hit.version);
      setStatus("idle");
      setMessage(`버전 ${hit.version} 을 편집기에 불러왔습니다. 저장하면 새 스냅샷이 됩니다.`);
    } catch {
      setStatus("error");
      setMessage("불러오기 실패");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-surface/60 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-text-strong">현재 버전:</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary">
            {current.version}
          </span>
          <span className="text-text-muted">
            최종 수정: {new Date(current.updatedAt).toLocaleString("ko-KR")}
          </span>
          {current.updatedBy && <span className="text-text-muted">by {current.updatedBy}</span>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <label htmlFor="ml-version" className="block text-sm font-semibold text-text-strong">
            버전 표기
          </label>
          <input
            id="ml-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="예: v6.5"
            className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="ml-history" className="block text-sm font-semibold text-text-strong">
            과거 버전 불러오기
          </label>
          <select
            id="ml-history"
            defaultValue=""
            onChange={(e) => loadVersion(e.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">— 버전 선택 —</option>
            {versions.map((v) => (
              <option key={`${v.version}-${v.updatedAt}`} value={v.version}>
                {v.version} · {new Date(v.updatedAt).toLocaleDateString("ko-KR")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="ml-content" className="block text-sm font-semibold text-text-strong">
          지침 본문 (Markdown)
        </label>
        <p className="mt-1 text-xs text-text-muted">
          저장 시 AI 초안(reply-draft, tone-adjust)의 시스템 프롬프트에 자동 첨부됩니다. 최대 5만자.
        </p>
        <textarea
          id="ml-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm leading-relaxed focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-muted">{content.length.toLocaleString()} 자</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving" || status === "loading"}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-white transition hover:bg-[#143d5d] disabled:opacity-50"
        >
          {status === "saving" ? "저장 중…" : "저장하기"}
        </button>
        {status === "saved" && (
          <span className="text-sm font-semibold text-emerald-600">✓ 저장되었습니다</span>
        )}
        {status === "error" && (
          <span className="text-sm font-semibold text-rose-600">
            {message ?? "저장 실패 — 다시 시도해 주세요"}
          </span>
        )}
        {status === "idle" && message && (
          <span className="text-sm text-text-muted">{message}</span>
        )}
      </div>
    </div>
  );
}
